// server/routes.worries.ts
import type { Request, Response, NextFunction } from "express";
import { eq, and, asc } from "drizzle-orm";
import { pgDb } from "./pgClient.js";
import {
  worries,
  worryResponseLines,
  worryRecommendations,
  worryRecommendationKeywords,
  userWorryEvents,
  securityChecklistItems,
} from "../shared/schema.js";

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
    const filterActive = String(req.query.active || "").trim() === "1";
    const rows = filterActive
      ? await pgDb
          .select()
          .from(worries)
          .where(eq(worries.isActive, true))
          .orderBy(asc(worries.sortOrder), asc(worries.id))
      : await pgDb.select().from(worries).orderBy(asc(worries.sortOrder), asc(worries.id));

    const result = rows.map((w) => ({
      id: w.id,
      worry_key: w.worryKey,
      label: w.label,
      blurb: w.blurb,
      icon_name: w.iconName,
      sort_order: w.sortOrder,
      is_active: w.isActive,
    }));
    res.json(result);
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
    const [worryRow] = await pgDb
      .select()
      .from(worries)
      .where(and(eq(worries.isActive, true), eq(worries.worryKey, key)))
      .limit(1);

    if (!worryRow) {
      return res.status(404).json({ message: "Worry not found" });
    }
    const worry = {
      id: worryRow.id,
      key: worryRow.worryKey,
      label: worryRow.label,
      blurb: worryRow.blurb,
      iconName: worryRow.iconName,
    };

    const lineRows = await pgDb
      .select()
      .from(worryResponseLines)
      .where(eq(worryResponseLines.worryId, worryRow.id));
    const lines = lineRows.map((r) => r.lineText);
    const headline = lines.length
      ? lines[Math.floor(Math.random() * lines.length)]
      : "Let’s take care of this together.";

    const recRows = await pgDb
      .select()
      .from(worryRecommendations)
      .where(
        and(
          eq(worryRecommendations.worryId, worryRow.id),
          eq(worryRecommendations.isActive, true),
        ),
      )
      .orderBy(asc(worryRecommendations.sortOrder), asc(worryRecommendations.id));
    const recs = recRows.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      rationale: r.rationale,
      points: r.pointsText,
      est: r.estText,
      sort_order: r.sortOrder,
    }));

    const kwRows = await pgDb
      .select({
        recommendation_id: worryRecommendationKeywords.recommendationId,
        keyword: worryRecommendationKeywords.keyword,
      })
      .from(worryRecommendations)
      .innerJoin(
        worryRecommendationKeywords,
        eq(worryRecommendationKeywords.recommendationId, worryRecommendations.id),
      )
      .where(
        and(
          eq(worryRecommendations.worryId, worryRow.id),
          eq(worryRecommendations.isActive, true),
        ),
      );

    const kwByRec = new Map<number, string[]>();
    for (const row of kwRows) {
      const arr = kwByRec.get(row.recommendation_id) || [];
      arr.push((row.keyword || "").toLowerCase());
      kwByRec.set(row.recommendation_id, arr);
    }

    const checklist = await pgDb
      .select({
        id: securityChecklistItems.id,
        title: securityChecklistItems.title,
        description: securityChecklistItems.description,
        youtube_video_url: securityChecklistItems.youtubeVideoUrl,
      })
      .from(securityChecklistItems)
      .where(eq(securityChecklistItems.isActive, true));

    const enriched = recs.map((r: any) => {
      const keys = (kwByRec.get(r.id) || [r.slug, r.title])
        .filter(Boolean)
        .map((s) => String(s).toLowerCase());
      const found = checklist.find((item) => {
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
    await pgDb.insert(userWorryEvents).values({ userId, worryId: worryRow.id });

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

    const [row] = await pgDb
      .insert(worries)
      .values({
        worryKey: worry_key,
        label,
        blurb: blurb ?? null,
        iconName: icon_name ?? null,
        isActive: !!is_active,
        sortOrder: Number(sort_order) || 0,
      })
      .returning();

    res.status(201).json({
      id: row.id,
      worry_key: row.worryKey,
      label: row.label,
      blurb: row.blurb,
      icon_name: row.iconName,
      is_active: row.isActive,
      sort_order: row.sortOrder,
      created_at: row.createdAt,
      updated_at: row.updatedAt,
    });
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

    const setObj: Record<string, any> = {
      // blurb/icon_name are always overwritten (matches original COALESCE-less behavior)
      blurb: blurb ?? null,
      iconName: icon_name ?? null,
      updatedAt: new Date(),
    };
    if (worry_key !== undefined) setObj.worryKey = worry_key;
    if (label !== undefined) setObj.label = label;
    if (typeof is_active === "boolean") setObj.isActive = is_active;
    if (typeof sort_order === "number") setObj.sortOrder = sort_order;

    const [row] = await pgDb.update(worries).set(setObj).where(eq(worries.id, id)).returning();
    if (!row) return res.status(404).json({ message: "Worry not found" });

    res.json({
      id: row.id,
      worry_key: row.worryKey,
      label: row.label,
      blurb: row.blurb,
      icon_name: row.iconName,
      is_active: row.isActive,
      sort_order: row.sortOrder,
      created_at: row.createdAt,
      updated_at: row.updatedAt,
    });
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

    const recIds = await pgDb
      .select({ id: worryRecommendations.id })
      .from(worryRecommendations)
      .where(eq(worryRecommendations.worryId, id));

    for (const { id: recId } of recIds) {
      await pgDb
        .delete(worryRecommendationKeywords)
        .where(eq(worryRecommendationKeywords.recommendationId, recId));
    }
    await pgDb.delete(worryRecommendations).where(eq(worryRecommendations.worryId, id));
    await pgDb.delete(worryResponseLines).where(eq(worryResponseLines.worryId, id));
    await pgDb.delete(worries).where(eq(worries.id, id));

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
    const rows = await pgDb
      .select({ id: worryResponseLines.id, line_text: worryResponseLines.lineText })
      .from(worryResponseLines)
      .where(eq(worryResponseLines.worryId, worryId))
      .orderBy(worryResponseLines.id);
    res.json(rows.reverse()); // ORDER BY id DESC
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

    const [row] = await pgDb
      .insert(worryResponseLines)
      .values({ worryId, lineText: line_text })
      .returning();

    res.status(201).json({ id: row.id, worry_id: row.worryId, line_text: row.lineText });
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

    await pgDb.delete(worryResponseLines).where(eq(worryResponseLines.id, id));
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

    // 1) Base recommendations for this worry
    const recRows = await pgDb
      .select()
      .from(worryRecommendations)
      .where(eq(worryRecommendations.worryId, worryId))
      .orderBy(asc(worryRecommendations.sortOrder), asc(worryRecommendations.id));

    // 2) Keywords mapped to rec.id
    const kwRows = await pgDb
      .select({
        recommendation_id: worryRecommendationKeywords.recommendationId,
        keyword: worryRecommendationKeywords.keyword,
      })
      .from(worryRecommendations)
      .innerJoin(
        worryRecommendationKeywords,
        eq(worryRecommendationKeywords.recommendationId, worryRecommendations.id),
      )
      .where(
        and(eq(worryRecommendations.worryId, worryId), eq(worryRecommendations.isActive, true)),
      );

    const kwByRec = new Map<number, string[]>();
    for (const row of kwRows) {
      const id = Number(row.recommendation_id);
      const arr = kwByRec.get(id) || [];
      if (row.keyword) arr.push(String(row.keyword));
      kwByRec.set(id, arr);
    }

    // 3) Active checklist items
    const checklist = await pgDb
      .select()
      .from(securityChecklistItems)
      .where(eq(securityChecklistItems.isActive, true));

    // --- helpers ---
    const norm = (s: any) => (s == null ? "" : String(s)).trim().toLowerCase();

    const sanitize = (s: string) => s.replace(/[\s\-_.:/]+/g, " ").trim();

    const scoreItem = (item: (typeof checklist)[number], keys: string[]) => {
      // Score based on total keyword occurrences in title + text fields
      const hay =
        `${norm(item.title)} ` +
        `${norm(item.description)} ` +
        `${norm(item.recommendationText)}`;
      let score = 0;
      for (const k of keys) {
        if (!k) continue;
        const needle = norm(k);
        if (!needle) continue;
        // count occurrences
        let idx = 0;
        while (true) {
          const j = hay.indexOf(needle, idx);
          if (j === -1) break;
          score += 1;
          idx = j + needle.length;
        }
      }
      // Heavier boost for exact/sanitized title match (e.g., "vpn22")
      const titleSan = sanitize(norm(item.title));
      const keysSan = keys.map((k) => sanitize(norm(k)));
      if (keysSan.includes(titleSan)) score += 5;
      return score;
    };

    // 4) Enrich each recommendation with best-matching checklist row
    const enriched = recRows.map((rec) => {
      // UNION: keywords ∪ [slug, title]
      const kw = kwByRec.get(Number(rec.id)) || [];
      const rawKeys = [...kw, rec.slug, rec.title].filter(Boolean) as string[];

      // Normalize once
      const keys = rawKeys.map(norm).filter(Boolean);

      // Pick the highest scoring checklist item
      let best: (typeof checklist)[number] | undefined;
      let bestScore = 0;
      for (const item of checklist) {
        const s = scoreItem(item, keys);
        if (s > bestScore) {
          best = item;
          bestScore = s;
        }
      }

      // Prefer long-form recommendation text, then description, then fallback to rationale
      const longText =
        (best?.recommendationText && String(best.recommendationText).trim()) ||
        (best?.description && String(best.description).trim()) ||
        rec.rationale ||
        null;

      const helpUrl = (best?.helpUrl && String(best.helpUrl).trim()) || null;

      const toolLaunchUrl =
        (best?.toolLaunchUrl && String(best.toolLaunchUrl).trim()) || null;

      const videoUrl = (best?.youtubeVideoUrl && String(best.youtubeVideoUrl).trim()) || "";

      const embedVideoUrl = toEmbed(videoUrl || "");

      const estimatedTimeMinutes =
        typeof best?.estimatedTimeMinutes === "number" ? best.estimatedTimeMinutes : null;

      return {
        id: rec.id,
        slug: rec.slug,
        title: rec.title,
        rationale: rec.rationale,
        pointsText: rec.pointsText ?? null,
        estText: rec.estText ?? null,
        sortOrder: rec.sortOrder,
        isActive: !!rec.isActive,

        // UI fields
        description: longText,
        helpUrl,
        toolLaunchUrl,
        videoUrl,
        embedVideoUrl,
        estimatedTimeMinutes,
      };
    });

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

    const [row] = await pgDb
      .insert(worryRecommendations)
      .values({
        worryId,
        slug,
        title,
        rationale,
        pointsText: points_text,
        estText: est_text,
        sortOrder: Number(sort_order) || 0,
        isActive: !!is_active,
      })
      .returning();

    res.status(201).json({
      id: row.id,
      worry_id: row.worryId,
      slug: row.slug,
      title: row.title,
      rationale: row.rationale,
      points_text: row.pointsText,
      est_text: row.estText,
      sort_order: row.sortOrder,
      is_active: row.isActive,
      created_at: row.createdAt,
      updated_at: row.updatedAt,
    });
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

    const setObj: Record<string, any> = {
      // points_text/est_text are always overwritten (matches original COALESCE-less behavior)
      pointsText: points_text ?? null,
      estText: est_text ?? null,
      updatedAt: new Date(),
    };
    if (slug !== undefined) setObj.slug = slug;
    if (title !== undefined) setObj.title = title;
    if (rationale !== undefined) setObj.rationale = rationale;
    if (typeof sort_order === "number") setObj.sortOrder = sort_order;
    if (typeof is_active === "boolean") setObj.isActive = is_active;

    const [row] = await pgDb
      .update(worryRecommendations)
      .set(setObj)
      .where(eq(worryRecommendations.id, id))
      .returning();
    if (!row) return res.status(404).json({ message: "Recommendation not found" });

    res.json({
      id: row.id,
      worry_id: row.worryId,
      slug: row.slug,
      title: row.title,
      rationale: row.rationale,
      points_text: row.pointsText,
      est_text: row.estText,
      sort_order: row.sortOrder,
      is_active: row.isActive,
      created_at: row.createdAt,
      updated_at: row.updatedAt,
    });
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

    await pgDb
      .delete(worryRecommendationKeywords)
      .where(eq(worryRecommendationKeywords.recommendationId, id));
    await pgDb.delete(worryRecommendations).where(eq(worryRecommendations.id, id));

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
    const rows = await pgDb
      .select({ id: worryRecommendationKeywords.id, keyword: worryRecommendationKeywords.keyword })
      .from(worryRecommendationKeywords)
      .where(eq(worryRecommendationKeywords.recommendationId, id))
      .orderBy(worryRecommendationKeywords.id);
    res.json(rows.reverse()); // ORDER BY id DESC
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

    const [row] = await pgDb
      .insert(worryRecommendationKeywords)
      .values({ recommendationId: id, keyword })
      .returning();

    res.status(201).json({ id: row.id, recommendation_id: row.recommendationId, keyword: row.keyword });
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

    await pgDb.delete(worryRecommendationKeywords).where(eq(worryRecommendationKeywords.id, id));
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
    const rows = await pgDb
      .select()
      .from(securityChecklistItems)
      .where(eq(securityChecklistItems.isActive, true))
      .orderBy(asc(securityChecklistItems.sortOrder), asc(securityChecklistItems.id));

    res.json(
      rows.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        recommendationText: r.recommendationText,
        helpUrl: r.helpUrl,
        estimatedTimeMinutes: r.estimatedTimeMinutes,
        sort_order: r.sortOrder,
        video_url: r.youtubeVideoUrl,
      })),
    );
  } catch (err) {
    next(err);
  }
}

// ====================== MOUNT HELPERS ======================

/** Register all routes on an Express app instance */
export default function registerWorryRoutes(app: import("express").Express) {
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
