// client/src/components/DashboardWorries.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  Wifi as WifiIcon,
  Mail,
  CreditCard,
  KeyRound,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  RotateCw,
  ExternalLink,
  Link2,
  Video,
  Info,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

/* =========================
   Types (normalized to UI)
========================= */
type WorryUI = {
  id: number;
  key: string;
  label: string;
  blurb: string | null;
  iconName: string | null;
  sortOrder: number;
  isActive: boolean;
};

type ResourceLink = {
  label: string;
  url: string;
};

type RecUI = {
  id: number;
  slug: string;
  title: string;
  rationale: string; // primary guidance (recommendation)
  description?: string | null; // long/extra context
  points?: string | null; // "+10 pts"
  est?: string | null; // "5 min"
  embedPrimary?: { kind: "iframe" | "video"; src: string } | null;
  extraEmbeds?: { kind: "iframe" | "video"; src: string }[];
  resources?: ResourceLink[];
  tags?: string[] | null;
  sortOrder?: number | null;
  isActive?: boolean | null;
};

type DetailUI = {
  headline: string;
  recommendations: RecUI[];
};

/* =========================
   Helpers
========================= */
function toSlug(text?: string | null): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s\-]+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

function toIframeEmbed(url?: string | null): string | null {
  if (!url) return null;
  // YouTube watch/share -> embed
  const yt =
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_\-]{6,})/i.exec(url);
  if (yt?.[1]) return `https://www.youtube.com/embed/${yt[1]}`;
  // Vimeo -> embed
  const vm = /vimeo\.com\/(\d+)/.exec(url);
  if (vm?.[1]) return `https://player.vimeo.com/video/${vm[1]}`;
  // If it looks like an embed already, allow it
  if (
    /^(https?:)?\/\/(player\.vimeo|www\.youtube|youtube|youtu\.be)/i.test(url)
  )
    return url;
  return null;
}

function toMedia(
  url?: string | null,
): { kind: "iframe" | "video"; src: string } | null {
  if (!url) return null;
  const u = String(url).trim();
  const iframe = toIframeEmbed(u);
  if (iframe) return { kind: "iframe", src: iframe };
  // simple mp4 check
  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(u)) return { kind: "video", src: u };
  return null;
}

function minutesText(min?: number | null): string | null {
  if (min == null) return null;
  return `${min} min`;
}

function uniqueBy<T>(arr: T[], key: (x: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of arr) {
    const k = key(item);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(item);
  }
  return out;
}

/* =========================
   Mappers
========================= */
function mapWorry(raw: any): WorryUI {
  return {
    id: raw.id,
    key: raw.key ?? raw.worry_key ?? "",
    label: raw.label,
    blurb: raw.blurb ?? null,
    iconName: raw.iconName ?? raw.icon_name ?? null,
    sortOrder: raw.sort_order ?? 0,
    isActive: raw.is_active ?? raw.isActive ?? true,
  };
}

/** Gather links from many possible fields */
function collectResourceLinks(raw: any): ResourceLink[] {
  const candidates: Array<{ url?: string | null; label?: string | null }> = [
    { url: raw.help_url, label: raw.help_label ?? "Learn more" },
    { url: raw.link_url, label: raw.link_label ?? "Reference" },
    { url: raw.external_url, label: raw.external_label ?? "Official site" },
    { url: raw.doc_url, label: raw.doc_label ?? "Documentation" },
    { url: raw.learn_more_url, label: raw.learn_more_label ?? "Learn more" },
    { url: raw.partner_url, label: raw.partner_label ?? "Partner offer" },
    { url: raw.resource_url, label: raw.resource_label ?? "Resource" },
    { url: raw.url, label: raw.url_label ?? "Link" },
    { url: raw.cta_url, label: raw.cta_text ?? "Open" },
  ];

  // Merge arrays if present: [{label,url}], or [{text,href}]
  if (Array.isArray(raw.resources)) {
    for (const r of raw.resources) {
      candidates.push({
        url: r?.url ?? r?.href,
        label: r?.label ?? r?.text ?? "Resource",
      });
    }
  }

  const normalized = candidates
    .filter((x) => typeof x.url === "string" && x.url)
    .map((x) => ({
      url: String(x.url),
      label: String(x.label || "Link"),
    }));

  return uniqueBy(normalized, (r) => `${r.label}|${r.url}`);
}

/** Gather videos/embeds from multiple possible fields */
function collectEmbeds(raw: any): { kind: "iframe" | "video"; src: string }[] {
  const urls: string[] = [];
  const possible = [
    raw.embedVideoUrl,
    raw.youtube_video_url,
    raw.youtubeVideoUrl,
    raw.video_url,
    raw.video_url_2,
    raw.video_url_3,
    ...(Array.isArray(raw.video_urls) ? raw.video_urls : []),
    ...(Array.isArray(raw.videos) ? raw.videos : []),
  ].filter(Boolean);

  for (const v of possible) {
    const url = String(v);
    const media = toMedia(url);
    if (media) urls.push(media.src + "|" + media.kind);
  }

  // dedupe by URL+kind
  const uniq = Array.from(new Set(urls)).map((item) => {
    const [src, kind] = item.split("|");
    return { src, kind: kind as "iframe" | "video" };
  });

  return uniq;
}

/** Map recommendation row (link-expanded or legacy) -> UI */
function mapRec(raw: any): RecUI {
  const title = raw.title ?? "";

  // Primary guidance
  const rationale =
    raw.rationale_override ??
    raw.rationale ??
    raw.recommendation_text ??
    raw.description_short ??
    raw.tip ??
    "";

  // Longer description/context
  const description =
    raw.description ?? raw.long_description ?? raw.details ?? raw.notes ?? null;

  const points =
    raw.points_text_override ?? raw.points_text ?? raw.points ?? null;

  const est =
    raw.est_text_override ??
    raw.est_text ??
    (raw.estimated_time_minutes != null
      ? minutesText(raw.estimated_time_minutes)
      : null);

  const slug = raw.slug ?? toSlug(title);

  const embeds = collectEmbeds(raw);
  const [primary, ...extras] = embeds;

  const tags = Array.isArray(raw.tags)
    ? raw.tags
    : typeof raw.tags === "string"
      ? raw.tags
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean)
      : null;

  return {
    id: raw.id,
    slug,
    title,
    rationale,
    description,
    points,
    est,
    embedPrimary: primary ?? null,
    extraEmbeds: extras ?? [],
    resources: collectResourceLinks(raw),
    tags,
    sortOrder: raw.sort_order ?? raw.sortOrder ?? null,
    isActive: raw.is_active ?? raw.isActive ?? null,
  };
}

/* =========================
   API calls
========================= */
async function fetchWorries(): Promise<WorryUI[]> {
  const res = await apiRequest("/api/worries");
  if (!res.ok) throw new Error(`Failed to load worries (${res.status})`);
  const data = await res.json();
  const list = Array.isArray(data) ? data : [];
  return list
    .map(mapWorry)
    .filter((w) => w.isActive)
    .sort(
      (a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label),
    );
}

async function fetchResponseLines(worryId: number): Promise<string[]> {
  const res = await apiRequest(`/api/worries/${worryId}/response-lines`);
  if (!res.ok) return [];
  const data = await res.json();
  return (Array.isArray(data) ? data : [])
    .map((r: any) => r.line_text)
    .filter(Boolean);
}

async function fetchRecommendations(worryId: number): Promise<RecUI[]> {
  const res = await apiRequest(`/api/worries/${worryId}/recommendations`);
  if (!res.ok) return [];
  const data = await res.json();
  const rows = Array.isArray(data) ? data : [];
  const mapped = rows.map(mapRec);
  const filtered = mapped.filter(
    (r) => r.isActive === null || r.isActive === true,
  );
  return filtered.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

/* =========================
   Icons
========================= */
function renderIcon(name?: string | null) {
  switch ((name || "").toLowerCase()) {
    case "phone":
      return <Phone className="h-4 w-4" />;
    case "wifi":
      return <WifiIcon className="h-4 w-4" />;
    case "mail":
      return <Mail className="h-4 w-4" />;
    case "creditcard":
    case "credit_card":
      return <CreditCard className="h-4 w-4" />;
    case "keyround":
    case "key":
      return <KeyRound className="h-4 w-4" />;
    case "shieldalert":
    case "shield_alert":
      return <ShieldAlert className="h-4 w-4" />;
    default:
      return <ShieldAlert className="h-4 w-4" />;
  }
}

/* =========================
   Component
========================= */
export default function DashboardWorries() {
  const qc = useQueryClient();
  const initialKey = new URLSearchParams(window.location.search).get(
    "worryKey",
  );

  // const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(initialKey);

  const recsRef = useRef<HTMLDivElement | null>(null);

  const {
    data: worries = [],
    isLoading: worriesLoading,
    error: worriesError,
  } = useQuery({
    queryKey: ["worries"],
    queryFn: fetchWorries,
    // reduce cache so the worry list also refreshes frequently
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
  });

  const selectedWorry = useMemo(
    () => worries.find((w) => w.key === selectedKey) ?? null,
    [worries, selectedKey],
  );

  // Lines + recs always refetch (avoid stale)
  const { data: lines = [], isFetching: linesLoading } = useQuery<string[]>({
    queryKey: ["worry-lines", selectedWorry?.id],
    queryFn: () => fetchResponseLines(selectedWorry!.id),
    enabled: !!selectedWorry?.id,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
  });

  const { data: recs = [], isFetching: recsLoading } = useQuery<RecUI[]>({
    queryKey: ["worry-recs", selectedWorry?.id],
    queryFn: () => fetchRecommendations(selectedWorry!.id),
    enabled: !!selectedWorry?.id,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
  });

  const detail: DetailUI | null = useMemo(() => {
    if (!selectedWorry) return null;
    const headline =
      (lines[0] as string) || "Let’s take care of this together.";
    return { headline, recommendations: recs };
  }, [selectedWorry, lines, recs]);

  // Auto-scroll to the animated suggestions after selection
  useEffect(() => {
    if (!selectedKey) return;
    const t = setTimeout(() => {
      recsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
    return () => clearTimeout(t);
  }, [selectedKey]);

  const reset = () => {
    setSelectedKey(null);
    qc.removeQueries({ queryKey: ["worry-lines"] });
    qc.removeQueries({ queryKey: ["worry-recs"] });
  };

  return (
    <motion.div
      className="transform-gpu"
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.997 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <Card className="overflow-hidden shadow-sm hover:shadow-xl transition-shadow">
        {/* Decorative top gradient bar */}
        <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />

        <CardHeader className="pb-0">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50">
                <Sparkles className="h-4 w-4 text-indigo-600" />
              </span>
              {/* Keep this header label black only */}
              <CardTitle className="text-2xl md:text-3xl font-extrabold text-slate-900">
                What worries you the most?
              </CardTitle>
            </div>

            <div className="flex items-center gap-2">
              {selectedKey && (
                <motion.div
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1"
                    onClick={reset}
                  >
                    <RotateCw className="h-4 w-4" />
                    Change
                  </Button>
                </motion.div>
              )}
            </div>
          </div>

          <p className="text-muted-foreground mt-2">
            Tap a card — we’ll prioritize your checklist, and show Description,
            Video, and Helpful links (if available) for each step.
          </p>
        </CardHeader>

        <CardContent className="pt-4">
          {/* Worry chips */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {worriesLoading && (
              <div className="text-sm text-muted-foreground">
                Loading worries…
              </div>
            )}
            {worriesError && (
              <div className="text-sm text-red-600">
                Couldn’t load worries. Try again.
              </div>
            )}
            {worries.map((w) => {
              const active = selectedKey === w.key;
              return (
                <motion.button
                  key={w.key}
                  onClick={() => {
                    setSelectedKey(w.key);
                    // ensure fresh data for the selected worry
                    qc.invalidateQueries({ queryKey: ["worry-lines", w.id] });
                    qc.invalidateQueries({ queryKey: ["worry-recs", w.id] });
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 280, damping: 18 }}
                  className={[
                    "group relative text-left rounded-2xl border p-4 transition transform-gpu",
                    "hover:shadow-md hover:-translate-y-0.5",
                    active
                      ? "border-indigo-600 bg-gradient-to-br from-indigo-50 to-white shadow-[0_0_0_3px_rgba(99,102,241,0.15)]"
                      : "bg-white",
                  ].join(" ")}
                  aria-pressed={active}
                >
                  {active && (
                    <span className="pointer-events-none absolute inset-0 rounded-2xl shadow-[0_0_25px_3px_rgba(99,102,241,0.12)]" />
                  )}
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      {renderIcon(w.iconName)}
                    </span>
                    <div className="flex-1">
                      <div className="font-semibold leading-snug">
                        {w.label}
                      </div>
                      {w.blurb && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {w.blurb}
                        </p>
                      )}
                    </div>
                    <CheckCircle2
                      className={[
                        "h-5 w-5 transition",
                        active
                          ? "text-emerald-600 opacity-100"
                          : "opacity-0 group-hover:opacity-50 text-slate-300",
                      ].join(" ")}
                    />
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Animated suggestions panel */}
          <div ref={recsRef} className="mt-3">
            <AnimatePresence initial={false} mode="wait">
              {!selectedKey ? (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                  className="rounded-2xl border bg-slate-50 p-4 text-sm text-slate-700 mt-3"
                >
                  <Sparkles className="mr-2 inline-block h-4 w-4" />
                  Select an option to see personalized steps (with
                  <span className="font-semibold"> Description</span>,
                  <span className="font-semibold"> Video</span>, and
                  <span className="font-semibold"> Helpful links</span>).
                </motion.div>
              ) : (
                <motion.div
                  key={selectedKey}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="mt-4">
                    {/* System Response (highlighted) */}
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className="mb-3 rounded-xl border border-blue-300 bg-blue-50 p-3 shadow-sm"
                    >
                      <div className="text-base md:text-lg font-semibold text-blue-800">
                        {linesLoading ? "Personalizing…" : detail?.headline}
                      </div>
                      <div className="text-xs text-blue-700">
                        Based on your selection
                      </div>
                    </motion.div>

                    {/* Suggested next steps header */}
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className="mb-2"
                    >
                      <h3 className="text-lg md:text-xl font-semibold">
                        Suggested next steps
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Do the first one or two for the biggest impact today.
                      </p>
                    </motion.div>

                    {/* Recommendation cards */}
                    <motion.div
                      variants={{
                        show: { transition: { staggerChildren: 0.06 } },
                        hidden: {},
                      }}
                      initial="hidden"
                      animate="show"
                      className="grid gap-3 md:grid-cols-2"
                    >
                      {(detail?.recommendations || []).map((item) => (
                        <motion.div
                          key={item.id}
                          variants={{
                            hidden: { opacity: 0, y: 8, scale: 0.98 },
                            show: { opacity: 1, y: 0, scale: 1 },
                          }}
                          transition={{ duration: 0.25, ease: "easeOut" }}
                          className="rounded-2xl border border-blue-200 p-4 bg-blue-50 shadow-md"
                        >
                          {/* Title + Badges */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="font-semibold leading-tight">
                              {item.title}
                            </div>
                            {(item.points || item.est) && (
                              <Badge variant="outline">
                                {[item.points, item.est]
                                  .filter(Boolean)
                                  .join(" • ")}
                              </Badge>
                            )}
                          </div>

                          {/* Tags */}
                          {item.tags?.length ? (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {item.tags.map((t, idx) => (
                                <Badge key={idx} variant="secondary">
                                  {t}
                                </Badge>
                              ))}
                            </div>
                          ) : null}

                          {/* Recommendation (always shown) */}
                          <div className="mt-2 flex items-start gap-2">
                            <Info className="h-4 w-4 mt-0.5 text-slate-600" />
                            <p className="text-sm text-slate-800">
                              {item.rationale ||
                                "No recommendation text provided yet."}
                            </p>
                          </div>

                          {/* Description section (always present; shows placeholder if missing) */}
                          <div className="mt-2">
                            <div className="text-xs font-semibold text-slate-600 mb-1">
                              Description
                            </div>
                            <p className="text-sm text-slate-700">
                              {item.description &&
                              item.description.trim().length > 0
                                ? item.description
                                : "No additional description provided yet."}
                            </p>
                          </div>

                          {/* Video(s) section (always present; show placeholder if none) */}
                          <div className="mt-3">
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 mb-1">
                              <Video className="h-3.5 w-3.5" />
                              <span>Video</span>
                            </div>

                            {item.embedPrimary ? (
                              item.embedPrimary.kind === "iframe" ? (
                                <div className="aspect-video">
                                  <iframe
                                    src={item.embedPrimary.src}
                                    className="w-full h-full rounded"
                                    frameBorder={0}
                                    allowFullScreen
                                    title={`${item.title} Video`}
                                  />
                                </div>
                              ) : (
                                <video
                                  className="w-full rounded"
                                  controls
                                  src={item.embedPrimary.src}
                                />
                              )
                            ) : (
                              <div className="text-xs text-slate-500">
                                No video provided yet.
                              </div>
                            )}

                            {item.extraEmbeds &&
                              item.extraEmbeds.length > 0 && (
                                <div className="mt-2 space-y-2">
                                  {item.extraEmbeds.map((v, i) =>
                                    v.kind === "iframe" ? (
                                      <div key={i} className="aspect-video">
                                        <iframe
                                          src={v.src}
                                          className="w-full h-full rounded"
                                          frameBorder={0}
                                          allowFullScreen
                                          title={`${item.title} Extra ${i + 1}`}
                                        />
                                      </div>
                                    ) : (
                                      <video
                                        key={i}
                                        className="w-full rounded"
                                        controls
                                        src={v.src}
                                      />
                                    ),
                                  )}
                                </div>
                              )}
                          </div>

                          {/* Helpful links section (always present; placeholder if none) */}
                          <div className="mt-3">
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 mb-1">
                              <Link2 className="h-3.5 w-3.5" />
                              <span>Helpful links</span>
                            </div>

                            {item.resources && item.resources.length > 0 ? (
                              <ul className="space-y-1">
                                {item.resources.map((r, idx) => (
                                  <li key={idx} className="text-sm">
                                    <a
                                      href={r.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-indigo-600 hover:underline inline-flex items-center gap-1"
                                    >
                                      {r.label}{" "}
                                      <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <div className="text-xs text-slate-500">
                                No links provided yet.
                              </div>
                            )}
                          </div>

                          {/* Primary action */}
                          <div className="mt-3">
                            <motion.div
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Button
                                asChild
                                variant="secondary"
                                className="gap-2"
                              >
                                <a
                                  href={`/secure-your-digital-presence#${item.slug}`}
                                >
                                  Do this now <ArrowRight className="h-4 w-4" />
                                </a>
                              </Button>
                            </motion.div>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>

                    <div className="mt-4 flex justify-center">
                      <motion.div
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button asChild className="gap-2">
                          <a href="/secure-your-digital-presence">
                            Open my full Security Checklist{" "}
                            <ArrowRight className="h-4 w-4" />
                          </a>
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
