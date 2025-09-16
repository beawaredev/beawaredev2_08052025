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
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

/* =========================
   Types from API
========================= */
type Worry = {
  id: number;
  key: string;
  label: string;
  blurb: string | null;
  iconName: string | null;
  sort_order?: number;
};

type WorryDetail = {
  worry: Worry;
  headline: string;
  recommendations: Array<{
    id: number;
    slug: string;
    title: string;
    rationale: string;
    points?: string | null;
    est?: string | null;
    embedVideoUrl?: string;
  }>;
};

/* =========================
   API helpers
========================= */
async function fetchWorries(): Promise<Worry[]> {
  const res = await apiRequest("/api/worries");
  if (!res.ok) throw new Error(`Failed to load worries (${res.status})`);
  return res.json();
}

async function fetchWorryDetail(key: string): Promise<WorryDetail> {
  const res = await apiRequest(`/api/worries/${encodeURIComponent(key)}`);
  if (!res.ok) throw new Error(`Failed to load worry detail (${res.status})`);
  return res.json();
}

/* =========================
   Icon chooser from DB string
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
      return <CreditCard className="h-4 w-4" />;
    case "keyround":
      return <KeyRound className="h-4 w-4" />;
    case "shieldalert":
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
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const recsRef = useRef<HTMLDivElement | null>(null);

  const {
    data: worries = [],
    isLoading: worriesLoading,
    error: worriesError,
  } = useQuery({
    queryKey: ["worries"],
    queryFn: fetchWorries,
    staleTime: 5 * 60 * 1000,
  });

  const { data: detail, isFetching: detailLoading } = useQuery<WorryDetail>({
    queryKey: ["worry-detail", selectedKey],
    queryFn: () => fetchWorryDetail(selectedKey!),
    enabled: !!selectedKey,
  });

  const selectedLabel = useMemo(
    () => worries.find((w) => w.key === selectedKey)?.label,
    [worries, selectedKey],
  );

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
    qc.removeQueries({ queryKey: ["worry-detail"] });
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
                <Badge variant="secondary" className="text-sm">
                  <CheckCircle2 className="mr-1 h-4 w-4" />
                  {selectedLabel}
                </Badge>
              )}
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
            Tap a card — we’ll prioritize your checklist, show quick wins, and
            include a helpful video when available.
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
                  onClick={() => setSelectedKey(w.key)}
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
                  Select an option to see personalized steps (with videos when
                  available).
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
                        {detailLoading
                          ? "Personalizing…"
                          : detail?.headline ||
                            "Let’s take care of this together."}
                      </div>
                      <div className="text-xs text-blue-700">
                        Based on “{selectedLabel}”
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
                          <div className="flex items-start justify-between">
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

                          <p className="text-sm text-slate-700 mt-1">
                            {item.rationale}
                          </p>

                          {/* Video (if provided by API) */}
                          {item.embedVideoUrl && (
                            <div className="mt-3">
                              <div className="aspect-video">
                                <iframe
                                  src={item.embedVideoUrl}
                                  className="w-full h-full rounded"
                                  frameBorder={0}
                                  allowFullScreen
                                  title={`${item.title} Tutorial`}
                                />
                              </div>
                            </div>
                          )}

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
