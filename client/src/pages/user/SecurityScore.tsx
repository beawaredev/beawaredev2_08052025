import * as React from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Bar,
} from "recharts";
import {
  ShieldCheckIcon,
  GaugeIcon,
  LockIcon,
  UserCheckIcon,
  SmartphoneIcon,
  WifiIcon,
  CreditCardIcon,
  InfoIcon,
  ArrowRightIcon,
  LinkIcon,
  Handshake as HandshakeIcon,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";

/* =========================
   Types & Config
========================= */
type Priority = "high" | "medium" | "low";
type Category =
  | "identity_protection"
  | "password_security"
  | "account_security"
  | "device_security"
  | "network_security"
  | "financial_security";

interface SecurityChecklistItem {
  id: number;
  title: string;
  description: string;
  category: Category;
  priority: Priority;
  recommendationText: string;
  helpUrl?: string | null;
  toolLaunchUrl?: string | null;
  youtubeVideoUrl?: string | null;
  estimatedTimeMinutes?: number | null;
  sortOrder: number;
}

interface UserSecurityProgress {
  id: number;
  userId: number;
  checklistItemId: number;
  isCompleted: boolean;
  completedAt?: string | null;
  notes?: string | null;
}

const CHECKLIST_ROUTE = "/secure-your-digital-presence";

const SCORE_DECIMALS = 0;
const PRIORITY_WEIGHTS: Record<Priority, number> = {
  high: 40,
  medium: 20,
  low: 10,
};
const GOOD_SCORE = 80;
const CAUTION_SCORE = 50;
const GOOD_HIGH = 70;
const CAUTION_HIGH = 40;

const CATEGORY_LABELS: Record<Category, string> = {
  identity_protection: "Identity",
  password_security: "Passwords",
  account_security: "Accounts",
  device_security: "Devices",
  network_security: "Network",
  financial_security: "Financial",
};

const weightFor = (p: Priority) => PRIORITY_WEIGHTS[p] ?? 10;
const clampPct = (n: number) => Math.max(0, Math.min(100, n));
const roundPct = (n: number) => Number(clampPct(n).toFixed(SCORE_DECIMALS));
const formatPct = (n: number) => `${roundPct(n)}%`;
const percent = (num: number, den: number) => (den > 0 ? (num / den) * 100 : 0);

type RiskTier = "good" | "caution" | "risk";
function getTier(scorePct: number, highPct: number): RiskTier {
  if (scorePct >= GOOD_SCORE && highPct >= GOOD_HIGH) return "good";
  if (scorePct >= CAUTION_SCORE && highPct >= CAUTION_HIGH) return "caution";
  return "risk";
}

const TIER_TEXT = {
  good: { textClass: "text-green-600", slice: "#16a34a" },
  caution: { textClass: "text-yellow-600", slice: "#ca8a04" },
  risk: { textClass: "text-red-600", slice: "#dc2626" },
} as const;

/* Hover spring used across cards/buttons */
const hoverSpring = { type: "spring", stiffness: 260, damping: 20 } as const;

/* =========================
   Component
========================= */
export default function SecurityScore() {
  const { user } = useAuth();

  // Checklist catalog (public)
  const { data: checklistItems = [], isLoading: itemsLoading } = useQuery<
    SecurityChecklistItem[]
  >({
    queryKey: ["/api/security-checklist"],
    queryFn: async () => {
      const res = await apiRequest("/api/security-checklist");
      if (!res.ok) throw new Error("Failed to fetch checklist items");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  // User progress (auth)
  const { data: userProgress = [], isLoading: progressLoading } = useQuery<
    UserSecurityProgress[]
  >({
    queryKey: ["/api/security-checklist/progress"],
    queryFn: async () => {
      const res = await apiRequest("/api/security-checklist/progress");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 60 * 1000,
  });

  const loading = itemsLoading || progressLoading;

  // Effective items + completion
  const items: SecurityChecklistItem[] = checklistItems;

  const completedIds = new Set(
    (userProgress || [])
      .filter((p) => p.isCompleted)
      .map((p) => p.checklistItemId),
  );

  // Weighted score
  const totalWeight = items.reduce((s, i) => s + weightFor(i.priority), 0);
  const earnedWeight = items
    .filter((i) => completedIds.has(i.id))
    .reduce((s, i) => s + weightFor(i.priority), 0);
  const scorePctRaw = percent(earnedWeight, totalWeight);
  const scorePctDisplay = roundPct(scorePctRaw);

  // Completion breakdown
  const hi = items.filter((i) => i.priority === "high");
  const lo = items.filter((i) => i.priority === "low");
  const hiDone = hi.filter((i) => completedIds.has(i.id)).length;
  const loDone = lo.filter((i) => completedIds.has(i.id)).length;
  const hiPct = roundPct(percent(hiDone, hi.length));
  const loPct = roundPct(percent(loDone, lo.length));

  // Risk tier
  const tier = getTier(scorePctDisplay, hiPct);
  const tierClasses = TIER_TEXT[tier];

  // Sector-wise data
  const categories = Array.from(
    new Set(items.map((i) => i.category)),
  ) as Category[];
  const sectorData = categories.map((cat) => {
    const list = items.filter((i) => i.category === cat);
    const done = list.filter((i) => completedIds.has(i.id)).length;
    const pct = roundPct(percent(done, list.length));
    return { name: CATEGORY_LABELS[cat] ?? cat, completion: pct };
  });

  // Next steps (top 5 by priority)
  const nextSteps = [...items]
    .filter((i) => !completedIds.has(i.id))
    .sort((a, b) => {
      const wa = weightFor(a.priority);
      const wb = weightFor(b.priority);
      return wb - wa || (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    })
    .slice(0, 5);

  if (loading) {
    return <div className="p-8 text-center">Loading security score...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Security Score</h1>
          <p className="text-muted-foreground mt-1">
            Your current protection level and the most impactful next steps.
          </p>
          <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
            <HandshakeIcon className="h-4 w-4 text-primary" />
            We research and partner with industry leaders to provide security at
            a cheaper price — unlocking your digital confidence.
          </p>
        </div>

        <div className="mt-4 md:mt-0 flex flex-col items-center gap-1">
          <Link href={CHECKLIST_ROUTE}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
              <Button className="gap-1">
                Open Security Checklist
                <ArrowRightIcon className="h-4 w-4" />
              </Button>
            </motion.div>
          </Link>
        </div>
      </div>

      {/* Top row: Score donut + Sector-wise (both pop-out on hover) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Security Score */}
        <motion.div
          className="transform-gpu lg:col-span-1"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.997 }}
          transition={hoverSpring}
        >
          <Card className="overflow-hidden shadow-sm hover:shadow-xl transition-shadow h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GaugeIcon className="h-5 w-5 text-primary" />
                Security Score{" "}
                <span className={`text-3xl font-bold ${tierClasses.textClass}`}>
                  {formatPct(scorePctDisplay)}
                </span>
              </CardTitle>
              <CardDescription>My protection score</CardDescription>
              <div className="text-xs text-muted-foreground mt-1">
                {tier === "good"
                  ? `Great job—${hiDone}/${hi.length} high-impact steps complete. Keep going for full coverage.`
                  : tier === "caution"
                    ? `You're on your way—${hi.length - hiDone} high-impact step(s) left. Tackle these next.`
                    : `Act now — ${hi.length - hiDone} high-impact step(s) pending. Address these first for the biggest risk reduction.`}{" "}
                <Link href={`${CHECKLIST_ROUTE}?priority=high`}>
                  <a className="underline underline-offset-2">
                    See high-impact steps →
                  </a>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Completed", value: scorePctDisplay },
                        {
                          name: "Remaining",
                          value: clampPct(100 - scorePctDisplay),
                        },
                      ]}
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      <Cell fill={tierClasses.slice} />
                      <Cell fill="#9ca3af" />
                    </Pie>
                    <Tooltip formatter={(val: number) => formatPct(val)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* High/Low impact compliance */}
              <div className="flex items-center justify-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  High-impact: {formatPct(hiPct)}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Low-impact: {formatPct(loPct)}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sector-wise Protection */}
        <motion.div
          className="transform-gpu lg:col-span-2"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.997 }}
          transition={hoverSpring}
        >
          <Card className="overflow-hidden shadow-sm hover:shadow-xl transition-shadow h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheckIcon className="h-5 w-5 text-primary" />
                Sector-wise Protection
              </CardTitle>
              <CardDescription>
                Completion by category (higher is better).
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-64">
                {sectorData.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={sectorData}
                      margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis
                        domain={[0, 100]}
                        tickFormatter={(v) => formatPct(v)}
                      />
                      <Tooltip formatter={(v: number) => formatPct(v)} />
                      <Bar
                        dataKey="completion"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No checklist data yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* High-priority recommendations (card pops on hover) */}
      <motion.div
        className="transform-gpu"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.997 }}
        transition={hoverSpring}
      >
        <Card className="overflow-hidden shadow-sm hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <InfoIcon className="h-5 w-5 text-primary" />
              Most Impactful Next Steps
            </CardTitle>
            <CardDescription>
              Prioritized actions to improve your score quickly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {nextSteps.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>🎉 Amazing! You’ve completed all checklist items.</p>
                <p className="text-sm mt-1">
                  Check back later for new recommendations.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {nextSteps.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="mb-2 sm:mb-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm">{item.title}</h4>
                        <Badge
                          variant={
                            item.priority === "high" ? "destructive" : "outline"
                          }
                          className="text-[10px] px-1.5 py-0 h-5"
                        >
                          {item.priority.toUpperCase()}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">
                          {CATEGORY_LABELS[item.category]}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {item.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.toolLaunchUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          asChild
                        >
                          <a
                            href={item.toolLaunchUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Launch Tool <LinkIcon className="ml-1 h-3 w-3" />
                          </a>
                        </Button>
                      )}
                      <Button size="sm" className="h-8 text-xs" asChild>
                        <Link href={`${CHECKLIST_ROUTE}?open=${item.id}`}>
                          View Details <ArrowRightIcon className="ml-1 h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
