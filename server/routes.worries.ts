// server/routes.worries.ts
import type { Request, Response, NextFunction } from "express";
import sql from "mssql";

/**
 * Connection strategy (in this order):
 * A) If a getPool() was injected by the caller (index.ts), use that.
 * B) Try shared modules (./AzureStorage, ./db) to reuse existing pool.
 * C) Fallback to envs: SQLAZURECONNSTR_* → AZURE_SQL_* parts → AZURE_SQL_CONNECTION
 */

export type GetPoolFn = () => Promise<sql.ConnectionPool>;

let injectedGetPool: GetPoolFn | null = null;
let cachedPool: sql.ConnectionPool | null = null;

type MaybePoolExport = {
  getPool?: () => Promise<sql.ConnectionPool>;
  ensureConnection?: () => Promise<sql.ConnectionPool>;
  pool?: sql.ConnectionPool;
};

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

  // A) Injected getter from index.ts
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

function toEmbed(url?: string | null): string {
  if (!url) return "";
  return url.includes("embed/")
    ? url
    : url
        .replace("watch?v=", "embed/")
        .replace("youtu.be/", "www.youtube.com/embed/");
}

/* GET /api/worries */
export async function listWorries(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const pool = await resolvePool();
    const result = await pool.request().query(`
      SELECT id, worry_key AS [key], label, blurb, icon_name AS iconName, sort_order
      FROM [dbo].[worries]
      WHERE is_active = 1
      ORDER BY sort_order, id
    `);
    res.json(result.recordset);
  } catch (err) {
    next(err);
  }
}

/* GET /api/worries/:key */
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
      const embedVideoUrl = toEmbed(found?.youtube_video_url || "");
      return { ...r, embedVideoUrl };
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

    res.json({ worry, headline, recommendations: enriched });
  } catch (err) {
    next(err);
  }
}

/* Mount helper
   Optionally inject a getPool() to force using your existing connection. */
export default function registerWorryRoutes(
  app: import("express").Express,
  opts?: { getPool?: GetPoolFn },
) {
  if (opts?.getPool) {
    injectedGetPool = opts.getPool;
  }
  app.get("/api/worries", listWorries);
  app.get("/api/worries/:key", getWorryDetail);
}
