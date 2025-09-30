// server/routes.worries.ts
import type { Request, Response, NextFunction } from "express";
import sql from "mssql";
import util from "node:util";

/**
 * Connection strategy (in this order) — preserved:
 * A) Injected getPool() from index.ts
 * B) Shared modules ./AzureStorage or ./db
 * C) Env-based fallbacks (SQLAZURECONNSTR_* or AZURE_SQL_* or AZURE_SQL_CONNECTION)
 */

// ---- Types / wiring
export type GetPoolFn = () => Promise<sql.ConnectionPool>;
let injectedGetPool: GetPoolFn | null = null;
let cachedPool: sql.ConnectionPool | null = null;

type MaybePoolExport = {
  getPool?: () => Promise<sql.ConnectionPool>;
  ensureConnection?: () => Promise<sql.ConnectionPool>;
  pool?: sql.ConnectionPool;
};

// ---- Connection helpers (kept and extended)
function pickSqlAzureConnStr(): string | null {
  const keys = Object.keys(process.env).filter((k) =>
    k.startsWith("SQLAZURECONNSTR_"),
  );
  if (keys.length) {
    keys.sort();
    const v = process.env[keys[0]];
    if (v) return v;
  }
  return null;
}

function buildConnStrFromParts(): string | null {
  const server = process.env.AZURE_SQL_SERVER;
  const database = process.env.AZURE_SQL_DATABASE;
  const user = process.env.AZURE_SQL_USER;
  const password = process.env.AZURE_SQL_PASSWORD;
  if (server && database && user && password) {
    return [
      `Server=${server}`,
      `Database=${database}`,
      `User Id=${user}`,
      `Password=${password}`,
      `Encrypt=true`,
      `TrustServerCertificate=false`,
    ].join(";");
  }
  return null;
}

async function connectWith(connStr: string): Promise<sql.ConnectionPool> {
  const pool = new sql.ConnectionPool(connStr);
  await pool.connect();
  return pool;
}

async function trySharedModule(
  path: string,
): Promise<sql.ConnectionPool | null> {
  try {
    const mod: MaybePoolExport = await import(path).catch(
      () => ({}) as MaybePoolExport,
    );
    if (mod?.getPool) {
      const p = await mod.getPool();
      if (p?.connected) {
        console.log(`🧭 [WORRIES] Using ${path}.getPool()`);
        return p;
      }
    }
    if (mod?.ensureConnection) {
      const p = await mod.ensureConnection();
      if (p?.connected) {
        console.log(`🧭 [WORRIES] Using ${path}.ensureConnection()`);
        return p;
      }
    }
    if (mod?.pool && mod.pool.connected) {
      console.log(`🧭 [WORRIES] Using ${path}.pool`);
      return mod.pool;
    }
  } catch {
    // ignore
  }
  return null;
}

async function resolvePool(): Promise<sql.ConnectionPool> {
  if (cachedPool?.connected) return cachedPool;

  // A) Injected getter
  if (injectedGetPool) {
    cachedPool = await injectedGetPool();
    if (cachedPool?.connected) return cachedPool;
  }

  // B) Shared modules your app already uses
  const viaAzureStorage = await trySharedModule("./AzureStorage");
  if (viaAzureStorage) return (cachedPool = viaAzureStorage);

  const viaDb = await trySharedModule("./db");
  if (viaDb) return (cachedPool = viaDb);

  // C) Env fallbacks
  const appSvc = pickSqlAzureConnStr();
  if (appSvc) {
    console.log("🧭 [WORRIES] Connecting with SQLAZURECONNSTR_*");
    cachedPool = await connectWith(appSvc);
    return cachedPool;
  }

  const parts = buildConnStrFromParts();
  if (parts) {
    console.log("🧭 [WORRIES] Connecting with discrete AZURE_SQL_* parts");
    cachedPool = await connectWith(parts);
    return cachedPool;
  }

  const direct = process.env.AZURE_SQL_CONNECTION;
  if (direct) {
    console.log("🧭 [WORRIES] Connecting with AZURE_SQL_CONNECTION");
    cachedPool = await connectWith(direct);
    return cachedPool;
  }

  throw new Error(
    "No SQL connection available. Set one of: injected getPool, shared AzureStorage/db pool, SQLAZURECONNSTR_*, AZURE_SQL_SERVER/AZURE_SQL_DATABASE/AZURE_SQL_USER/AZURE_SQL_PASSWORD, or AZURE_SQL_CONNECTION.",
  );
}

// ---- Utilities
function toEmbed(url?: string | null): string {
  if (!url) return "";
  const u = url.trim();
  // Already an embed or a direct mp4: return as-is
  if (u.includes("/embed/") || u.endsWith(".mp4")) return u;
  // YouTube variants
  if (u.includes("youtube.com/watch?v="))
    return u.replace("watch?v=", "embed/");
  if (u.includes("youtu.be/"))
    return u.replace("youtu.be/", "www.youtube.com/embed/");
  // Vimeo normal -> embed
  const vimeoMatch = u.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  // Fallback
  return u;
}

// ====================== PUBLIC (READ) ENDPOINTS ======================

// GET /api/worries  (now supports ?active=1 to filter)
export async function listWorries(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const pool = await resolvePool();
    const filterActive = String(req.query.active || "").trim() === "1";
    const result = await pool.request().query(`
      SELECT id, worry_key AS worry_key, label, blurb, icon_name AS icon_name, sort_order, is_active
      FROM [dbo].[worries]
      ${filterActive ? "WHERE is_active = 1" : ""}
      ORDER BY sort_order, id
    `);
    console.log(
      "GET /api/worries:\n" +
        util.inspect(result.recordset, {
          depth: null,
          breakLength: 80,
          maxArrayLength: null,
          compact: false,
        }),
    );
    res.json(result.recordset);
  } catch (err) {
    next(err);
  }
}

// GET /api/worries/:key (kept; enriches with keywords + video embed)
export async function getWorryDetail(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { key } = req.params;
  try {
    const pool = await resolvePool();

    const worryQ = await pool.request().input("key", sql.NVarChar(64), key)
      .query(`
        SELECT TOP 1 id, worry_key AS [key], label, blurb, icon_name AS iconName
        FROM [dbo].[worries]
        WHERE is_active = 1 AND worry_key = @key
      `);

    if (worryQ.recordset.length === 0) {
      return res.status(404).json({ message: "Worry not found" });
    }
    const worry = worryQ.recordset[0];

    const linesQ = await pool.request().input("worryId", sql.Int, worry.id)
      .query(`
        SELECT line_text FROM [dbo].[worry_response_lines]
        WHERE worry_id = @worryId
      `);
    const lines = linesQ.recordset.map((r) => r.line_text);
    const headline = lines.length
      ? lines[Math.floor(Math.random() * lines.length)]
      : "Let’s take care of this together.";

    const recQ = await pool.request().input("worryId", sql.Int, worry.id)
      .query(`
        SELECT id, slug, title, rationale, points_text AS points, est_text AS est, sort_order
        FROM [dbo].[worry_recommendations]
        WHERE worry_id = @worryId AND is_active = 1
        ORDER BY sort_order, id
      `);
    const recs = recQ.recordset;

    const kwQ = await pool.request().input("worryId", sql.Int, worry.id).query(`
        SELECT wr.id AS recommendation_id, wk.keyword
        FROM [dbo].[worry_recommendations] wr
        JOIN [dbo].[worry_recommendation_keywords] wk
          ON wk.recommendation_id = wr.id
        WHERE wr.worry_id = @worryId AND wr.is_active = 1
      `);

    const kwByRec = new Map<number, string[]>();
    for (const row of kwQ.recordset) {
      const arr = kwByRec.get(row.recommendation_id) || [];
      arr.push((row.keyword || "").toLowerCase());
      kwByRec.set(row.recommendation_id, arr);
    }

    const checklistQ = await pool.request().query(`
      SELECT id, title, description, youtube_video_url
      FROM [dbo].[security_checklist_items]
      WHERE is_active = 1
    `);
    const checklist = checklistQ.recordset;

    const enriched = recs.map((r: any) => {
      const keys = (kwByRec.get(r.id) || [r.slug, r.title])
        .filter(Boolean)
        .map((s) => String(s).toLowerCase());
      const found = checklist.find((item: any) => {
        const hay = `${item.title} ${item.description}`.toLowerCase();
        return keys.some((k) => hay.includes(k));
      });
      const videoUrl = found?.youtube_video_url || "";
      const embedVideoUrl = toEmbed(videoUrl);
      return { ...r, videoUrl, embedVideoUrl };
    });

    const userId = req.headers["x-user-id"]
      ? Number(req.headers["x-user-id"])
      : null;
    await pool
      .request()
      .input("uid", userId ? sql.Int : sql.NVarChar, userId ?? null)
      .input("worryId", sql.Int, worry.id)
      .query(
        `INSERT INTO [dbo].[user_worry_events] (user_id, worry_id) VALUES (@uid, @worryId);`,
      );

    console.log(
      "GET /api/worries/:key -> worry:\n" +
        util.inspect(worry, {
          depth: null,
          breakLength: 80,
          maxArrayLength: null,
          compact: false,
        }),
    );
    console.log(
      "GET /api/worries/:key -> response-lines:\n" +
        util.inspect(lines, {
          depth: null,
          breakLength: 80,
          maxArrayLength: null,
          compact: false,
        }),
    );
    console.log(
      "GET /api/worries/:key -> recommendations (enriched):\n" +
        util.inspect(enriched, {
          depth: null,
          breakLength: 80,
          maxArrayLength: null,
          compact: false,
        }),
    );
    res.json({ worry, headline, recommendations: enriched });
  } catch (err) {
    next(err);
  }
}

// ====================== ADMIN CRUD: WORRIES ======================

// POST /api/worries
export async function createWorry(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const {
      worry_key,
      label,
      blurb,
      icon_name,
      is_active = 1,
      sort_order = 0,
    } = req.body || {};
    if (!worry_key || !label)
      return res
        .status(400)
        .json({ message: "worry_key and label are required" });

    const pool = await resolvePool();
    const result = await pool
      .request()
      .input("worry_key", sql.NVarChar(64), worry_key)
      .input("label", sql.NVarChar(128), label)
      .input("blurb", sql.NVarChar(256), blurb ?? null)
      .input("icon_name", sql.NVarChar(64), icon_name ?? null)
      .input("is_active", sql.Bit, !!is_active ? 1 : 0)
      .input("sort_order", sql.Int, Number(sort_order) || 0).query(`
        INSERT INTO [dbo].[worries] (worry_key, label, blurb, icon_name, is_active, sort_order)
        OUTPUT inserted.*
        VALUES (@worry_key, @label, @blurb, @icon_name, @is_active, @sort_order);
      `);
    res.status(201).json(result.recordset[0]);
  } catch (err) {
    next(err);
  }
}

// PUT /api/worries/:id
export async function updateWorry(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid id" });
    const { worry_key, label, blurb, icon_name, is_active, sort_order } =
      req.body || {};

    const pool = await resolvePool();
    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .input("worry_key", sql.NVarChar(64), worry_key ?? null)
      .input("label", sql.NVarChar(128), label ?? null)
      .input("blurb", sql.NVarChar(256), blurb ?? null)
      .input("icon_name", sql.NVarChar(64), icon_name ?? null)
      .input(
        "is_active",
        sql.Bit,
        typeof is_active === "boolean" ? (is_active ? 1 : 0) : null,
      )
      .input(
        "sort_order",
        sql.Int,
        typeof sort_order === "number" ? sort_order : null,
      ).query(`
        UPDATE [dbo].[worries]
        SET
          worry_key = COALESCE(@worry_key, worry_key),
          label = COALESCE(@label, label),
          blurb = @blurb,
          icon_name = @icon_name,
          is_active = COALESCE(@is_active, is_active),
          sort_order = COALESCE(@sort_order, sort_order),
          updated_at = getutcdate()
        WHERE id = @id;
        SELECT * FROM [dbo].[worries] WHERE id = @id;
      `);
    res.json(result.recordset[0]);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/worries/:id
export async function deleteWorry(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid id" });

    const pool = await resolvePool();
    await pool.request().input("id", sql.Int, id).query(`
      DELETE FROM [dbo].[worry_recommendation_keywords]
      WHERE recommendation_id IN (SELECT id FROM [dbo].[worry_recommendations] WHERE worry_id = @id);

      DELETE FROM [dbo].[worry_recommendations] WHERE worry_id = @id;
      DELETE FROM [dbo].[worry_response_lines] WHERE worry_id = @id;
      DELETE FROM [dbo].[worries] WHERE id = @id;
    `);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

// ====================== ADMIN: RESPONSE LINES ======================

// GET /api/worries/:worryId/response-lines
export async function listResponseLines(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const worryId = Number(req.params.worryId);
    const pool = await resolvePool();
    const r = await pool.request().input("worryId", sql.Int, worryId).query(`
        SELECT id, line_text
        FROM [dbo].[worry_response_lines]
        WHERE worry_id = @worryId
        ORDER BY id DESC
      `);
    console.log(
      "GET /api/worries/:worryId/response-lines:\n" +
        util.inspect(r.recordset, {
          depth: null,
          breakLength: 80,
          maxArrayLength: null,
          compact: false,
        }),
    );
    res.json(r.recordset);
  } catch (err) {
    next(err);
  }
}

// POST /api/worries/:worryId/response-lines
export async function createResponseLine(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const worryId = Number(req.params.worryId);
    const { line_text } = req.body || {};
    if (!worryId || !line_text)
      return res
        .status(400)
        .json({ message: "worryId and line_text required" });

    const pool = await resolvePool();
    const r = await pool
      .request()
      .input("worryId", sql.Int, worryId)
      .input("line_text", sql.NVarChar(512), line_text).query(`
        INSERT INTO [dbo].[worry_response_lines] (worry_id, line_text)
        OUTPUT inserted.*
        VALUES (@worryId, @line_text);
      `);
    res.status(201).json(r.recordset[0]);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/worry-response-lines/:id
export async function deleteResponseLine(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid id" });

    const pool = await resolvePool();
    await pool.request().input("id", sql.Int, id).query(`
      DELETE FROM [dbo].[worry_response_lines] WHERE id = @id;
    `);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

// ====================== ADMIN: RECOMMENDATIONS ======================

// GET /api/worries/:worryId/recommendations
export async function listRecommendations(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const worryId = Number(req.params.worryId);
    const pool = await resolvePool();
    const r = await pool.request().input("worryId", sql.Int, worryId).query(`
        SELECT id, slug, title, rationale, points_text, est_text, sort_order, is_active
        FROM [dbo].[worry_recommendations]
        WHERE worry_id = @worryId
        ORDER BY sort_order, id
      `);
    console.log(
      "GET /api/worries/:worryId/recommendations:\n" +
        util.inspect(r.recordset, {
          depth: null,
          breakLength: 80,
          maxArrayLength: null,
          compact: false,
        }),
    );
    // Build keyword map for this worry's recommendations
    const kwQ = await pool.request().input("worryId", sql.Int, worryId).query(`
      SELECT wr.id AS recommendation_id, wk.keyword
      FROM [dbo].[worry_recommendations] wr
      JOIN [dbo].[worry_recommendation_keywords] wk
        ON wk.recommendation_id = wr.id
      WHERE wr.worry_id = @worryId AND wr.is_active = 1
    `);
    const kwByRec = new Map<number, string[]>();
    for (const row of kwQ.recordset) {
      const arr = kwByRec.get(row.recommendation_id) || [];
      arr.push((row.keyword || "").toLowerCase());
      kwByRec.set(row.recommendation_id, arr);
    }

    // Pull active checklist items with their YouTube URL
    const checklistQ = await pool.request().query(`
      SELECT id, title, description, youtube_video_url
      FROM [dbo].[security_checklist_items]
      WHERE is_active = 1
    `);
    const checklist = checklistQ.recordset;

    // Enrich recommendations with videoUrl + embedVideoUrl (mirrors getWorryDetail)
    const recs = r.recordset;
    const enriched = recs.map((rec: any) => {
      const keys = (kwByRec.get(rec.id) || [rec.slug, rec.title])
        .filter(Boolean)
        .map((s) => String(s).toLowerCase());

      const found = checklist.find((item: any) => {
        const hay = `${item.title} ${item.description}`.toLowerCase();
        return keys.some((k) => hay.includes(k));
      });

      const videoUrl = found?.youtube_video_url || "";
      const embedVideoUrl = toEmbed(videoUrl);
      return { ...rec, videoUrl, embedVideoUrl };
    });

    // (nice logs, now using util.inspect import you added)
    console.log(
      "GET /api/worries/:worryId/recommendations (enriched):\n" +
        util.inspect(enriched, {
          depth: null,
          breakLength: 80,
          maxArrayLength: null,
          compact: false,
        }),
    );

    res.json(enriched);
  } catch (err) {
    next(err);
  }
}

// POST /api/worries/:worryId/recommendations
export async function createRecommendation(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const worryId = Number(req.params.worryId);
    const {
      slug,
      title,
      rationale,
      points_text = null,
      est_text = null,
      sort_order = 0,
      is_active = 1,
    } = req.body || {};
    if (!worryId || !slug || !title || !rationale) {
      return res
        .status(400)
        .json({ message: "worryId, slug, title, rationale are required" });
    }

    const pool = await resolvePool();
    const r = await pool
      .request()
      .input("worryId", sql.Int, worryId)
      .input("slug", sql.NVarChar(64), slug)
      .input("title", sql.NVarChar(256), title)
      .input("rationale", sql.NVarChar(sql.MAX), rationale)
      .input("points_text", sql.NVarChar(32), points_text)
      .input("est_text", sql.NVarChar(32), est_text)
      .input("sort_order", sql.Int, Number(sort_order) || 0)
      .input("is_active", sql.Bit, !!is_active ? 1 : 0).query(`
        INSERT INTO [dbo].[worry_recommendations]
          (worry_id, slug, title, rationale, points_text, est_text, sort_order, is_active)
        OUTPUT inserted.*
        VALUES
          (@worryId, @slug, @title, @rationale, @points_text, @est_text, @sort_order, @is_active);
      `);
    res.status(201).json(r.recordset[0]);
  } catch (err) {
    next(err);
  }
}

// PUT /api/worry-recommendations/:id
export async function updateRecommendation(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid id" });

    const {
      slug,
      title,
      rationale,
      points_text,
      est_text,
      sort_order,
      is_active,
    } = req.body || {};
    const pool = await resolvePool();
    const r = await pool
      .request()
      .input("id", sql.Int, id)
      .input("slug", sql.NVarChar(64), slug ?? null)
      .input("title", sql.NVarChar(256), title ?? null)
      .input("rationale", sql.NVarChar(sql.MAX), rationale ?? null)
      .input("points_text", sql.NVarChar(32), points_text ?? null)
      .input("est_text", sql.NVarChar(32), est_text ?? null)
      .input(
        "sort_order",
        sql.Int,
        typeof sort_order === "number" ? sort_order : null,
      )
      .input(
        "is_active",
        sql.Bit,
        typeof is_active === "boolean" ? (is_active ? 1 : 0) : null,
      ).query(`
        UPDATE [dbo].[worry_recommendations]
        SET
          slug = COALESCE(@slug, slug),
          title = COALESCE(@title, title),
          rationale = COALESCE(@rationale, rationale),
          points_text = @points_text,
          est_text = @est_text,
          sort_order = COALESCE(@sort_order, sort_order),
          is_active = COALESCE(@is_active, is_active),
          updated_at = getutcdate()
        WHERE id = @id;
        SELECT * FROM [dbo].[worry_recommendations] WHERE id = @id;
      `);
    res.json(r.recordset[0]);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/worry-recommendations/:id
export async function deleteRecommendation(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid id" });

    const pool = await resolvePool();
    await pool.request().input("id", sql.Int, id).query(`
      DELETE FROM [dbo].[worry_recommendation_keywords] WHERE recommendation_id = @id;
      DELETE FROM [dbo].[worry_recommendations] WHERE id = @id;
    `);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

// ====================== ADMIN: KEYWORDS ======================

// GET /api/worry-recommendations/:id/keywords
export async function listRecommendationKeywords(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = Number(req.params.id);
    const pool = await resolvePool();
    const r = await pool.request().input("id", sql.Int, id).query(`
        SELECT id, keyword
        FROM [dbo].[worry_recommendation_keywords]
        WHERE recommendation_id = @id
        ORDER BY id DESC
      `);
    res.json(r.recordset);
  } catch (err) {
    next(err);
  }
}

// POST /api/worry-recommendations/:id/keywords
export async function createRecommendationKeyword(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = Number(req.params.id);
    const { keyword } = req.body || {};
    if (!id || !keyword)
      return res.status(400).json({ message: "id and keyword required" });

    const pool = await resolvePool();
    const r = await pool
      .request()
      .input("id", sql.Int, id)
      .input("keyword", sql.NVarChar(64), keyword).query(`
        INSERT INTO [dbo].[worry_recommendation_keywords] (recommendation_id, keyword)
        OUTPUT inserted.*
        VALUES (@id, @keyword);
      `);
    res.status(201).json(r.recordset[0]);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/worry-recommendation-keywords/:id
export async function deleteRecommendationKeyword(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid id" });

    const pool = await resolvePool();
    await pool.request().input("id", sql.Int, id).query(`
      DELETE FROM [dbo].[worry_recommendation_keywords] WHERE id = @id;
    `);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

// ====================== SECURITY CHECKLIST (for mapping) ======================

// GET /api/security-checklist  (active items; minimal fields for mapping)
export async function listSecurityChecklist(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const pool = await resolvePool();
    const r = await pool.request().query(`
      SELECT
        id,
        title,
        description,
        recommendation_text AS recommendationText,
        help_url AS helpUrl,
        estimated_time_minutes AS estimatedTimeMinutes,
        sort_order,
        youtube_video_url AS video_url
      FROM [dbo].[security_checklist_items]
      WHERE is_active = 1
      ORDER BY sort_order, id
    `);
    console.log(
      "GET /api/security-checklist:\n" +
        util.inspect(r.recordset, {
          depth: null,
          breakLength: 80,
          maxArrayLength: null,
          compact: false,
        }),
    );
    res.json(r.recordset);
  } catch (err) {
    next(err);
  }
}

// ====================== MOUNT HELPERS ======================

/** Optional: set an injected getPool() from index.ts */
export function setWorriesGetPool(fn: GetPoolFn) {
  injectedGetPool = fn;
}

/** Register all routes on an Express app instance */
export default function registerWorryRoutes(
  app: import("express").Express,
  opts?: { getPool?: GetPoolFn },
) {
  if (opts?.getPool) injectedGetPool = opts.getPool;

  // Public reads
  app.get("/api/worries", listWorries); // supports ?active=1
  app.get("/api/worries/:key", getWorryDetail);

  // Admin: worries core
  app.post("/api/worries", createWorry);
  app.put("/api/worries/:id", updateWorry);
  app.delete("/api/worries/:id", deleteWorry);

  // Admin: response lines
  app.get("/api/worries/:worryId/response-lines", listResponseLines);
  app.post("/api/worries/:worryId/response-lines", createResponseLine);
  app.delete("/api/worry-response-lines/:id", deleteResponseLine);

  // Admin: recommendations
  app.get("/api/worries/:worryId/recommendations", listRecommendations);
  app.post("/api/worries/:worryId/recommendations", createRecommendation);
  app.put("/api/worry-recommendations/:id", updateRecommendation);
  app.delete("/api/worry-recommendations/:id", deleteRecommendation);

  // Admin: keywords
  app.get(
    "/api/worry-recommendations/:id/keywords",
    listRecommendationKeywords,
  );
  app.post(
    "/api/worry-recommendations/:id/keywords",
    createRecommendationKeyword,
  );
  app.delete(
    "/api/worry-recommendation-keywords/:id",
    deleteRecommendationKeyword,
  );

  // Mapping source
  app.get("/api/security-checklist", listSecurityChecklist);
}
