// src/pages/Dashboard.tsx
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
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// ---------- Types ----------
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

// ---------- Config ----------
const CHECKLIST_ROUTE = "/security-checklist"; // change if needed

// One precision everywhere (0 = integers; set 1 for one decimal place)
const SCORE_DECIMALS = 0;

// Weighted scoring
const PRIORITY_WEIGHTS: Record<Priority, number> = {
  high: 40,
  medium: 20,
  low: 10,
};

// Tier thresholds
const GOOD_SCORE = 80; // overall score %
const CAUTION_SCORE = 50;
const GOOD_HIGH = 70; // high-priority completion %
const CAUTION_HIGH = 40;

const CATEGORY_LABELS: Record<Category, string> = {
  identity_protection: "Identity",
  password_security: "Passwords",
  account_security: "Accounts",
  device_security: "Devices",
  network_security: "Network",
  financial_security: "Financial",
};

const CATEGORY_ICONS: Record<Category, React.ComponentType<any>> = {
  identity_protection: ShieldCheckIcon,
  password_security: LockIcon,
  account_security: UserCheckIcon,
  device_security: SmartphoneIcon,
  network_security: WifiIcon,
  financial_security: CreditCardIcon,
};

// ---------- Helpers ----------
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

// ---------- Fallback items (offline/demo safe) ----------
const FALLBACK_ITEMS: SecurityChecklistItem[] = [
  {
    id: 1,
    title: "Enable Two-Factor Authentication",
    description: "Secure your most important accounts with 2FA.",
    category: "account_security",
    priority: "high",
    recommendationText:
      "Turn on 2FA for email, banking, and socials using an authenticator app.",
    helpUrl: "https://authy.com/what-is-2fa/",
    toolLaunchUrl: "https://authy.com/",
    estimatedTimeMinutes: 10,
    sortOrder: 1,
  },
  {
    id: 2,
    title: "Use a Password Manager",
    description: "Generate and store strong, unique passwords.",
    category: "password_security",
    priority: "high",
    recommendationText:
      "Install a password manager (e.g., Bitwarden) and rotate weak passwords.",
    helpUrl: "https://bitwarden.com/help/",
    toolLaunchUrl: "https://bitwarden.com/",
    estimatedTimeMinutes: 25,
    sortOrder: 2,
  },
  {
    id: 3,
    title: "Freeze Your Credit",
    description: "Block new credit lines without your approval.",
    category: "identity_protection",
    priority: "high",
    recommendationText:
      "Place security freezes with Experian, Equifax, and TransUnion.",
    helpUrl:
      "https://www.consumer.ftc.gov/articles/what-know-about-credit-freezes-and-fraud-alerts",
    estimatedTimeMinutes: 20,
    sortOrder: 3,
  },
];

// ---------- Component ----------
export default function Dashboard() {
  const { user } = useAuth();

  // Fetch checklist items (public)
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

  // Fetch progress (auth; returns [] if unauth or 401)
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

  // Effective data
  const items: SecurityChecklistItem[] =
    (checklistItems?.length ?? 0) > 0 ? checklistItems : FALLBACK_ITEMS;

  const completedIds = new Set(
    (userProgress || [])
      .filter((p) => p.isCompleted)
      .map((p) => p.checklistItemId),
  );

  // Canonical weighted score
  const totalWeight = items.reduce((sum, i) => sum + weightFor(i.priority), 0);
  const earnedWeight = items
    .filter((i) => completedIds.has(i.id))
    .reduce((sum, i) => sum + weightFor(i.priority), 0);
  const scorePctRaw = percent(earnedWeight, totalWeight);
  const scorePctDisplay = roundPct(scorePctRaw);

  // High/low impact completion
  const hi = items.filter((i) => i.priority === "high");
  const lo = items.filter((i) => i.priority === "low");
  const hiDone = hi.filter((i) => completedIds.has(i.id)).length;
  const loDone = lo.filter((i) => completedIds.has(i.id)).length;
  const hiPct = roundPct(percent(hiDone, hi.length));
  const loPct = roundPct(percent(loDone, lo.length));

  // Risk tier (drives color + hint)
  const tier = getTier(scorePctDisplay, hiPct);
  const tierClasses = TIER_TEXT[tier];

  // Pie data & color by tier
  const pieData = [
    { name: "Completed", value: scorePctDisplay },
    { name: "Remaining", value: clampPct(100 - scorePctDisplay) },
  ];
  const PIE_COMPLETED = tierClasses.slice;
  const PIE_REMAINING = "#9ca3af";

  // Sector-wise (category % complete)
  const categories = Array.from(
    new Set(items.map((i) => i.category)),
  ) as Category[];
  const sectorData = categories.map((cat) => {
    const list = items.filter((i) => i.category === cat);
    const done = list.filter((i) => completedIds.has(i.id)).length;
    const pct = roundPct(percent(done, list.length));
    return { name: CATEGORY_LABELS[cat] ?? cat, completion: pct };
  });

  // Next steps
  const nextSteps = [...items]
    .filter((i) => !completedIds.has(i.id))
    .sort((a, b) => {
      const wa = weightFor(a.priority);
      const wb = weightFor(b.priority);
      return wb - wa || (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    })
    .slice(0, 5);

  // Subtle hint message (reason + direction)
  const hint =
    tier === "good"
      ? `Great job—${hiDone}/${hi.length} high-impact steps complete. Keep going for full coverage.`
      : tier === "caution"
        ? `You're on your way—${hi.length - hiDone} high-impact step(s) left. Tackle these next.`
        : `Act now ${hi.length - hiDone} high-impact step(s) pending. Address these first for the biggest risk reduction.`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security Overview</h1>
          <p className="text-muted-foreground mt-1">
            Your current protection level and the most impactful next steps.
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link to={CHECKLIST_ROUTE}>
            <Button className="gap-1">
              Open Security Checklist
              <ArrowRightIcon className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Top row: Score donut + sector-wise bars */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Security Score (colored by tier; subtle hint + direction) */}
        <Card className="lg:col-span-1 overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GaugeIcon className="h-5 w-5 text-primary" />
              Security Score{" "}
              <div
                className={`text-3xl font-bold mt-1 ${tierClasses.textClass}`}
              >
                {formatPct(scorePctDisplay)}
              </div>
            </CardTitle>

            <CardDescription>My protection score</CardDescription>
            <div className="text-xs text-muted-foreground mt-1">
              {hint}{" "}
              <Link to={`${CHECKLIST_ROUTE}?priority=high`}>
                <a className="underline underline-offset-2">
                  See high-impact steps →
                </a>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-64">
              {loading ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Calculating…
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      <Cell fill={PIE_COMPLETED} />
                      <Cell fill={PIE_REMAINING} />
                    </Pie>
                    <Tooltip formatter={(val: number) => formatPct(val)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* High/Low impact compliance chips (subtle context) */}
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

        {/* Sector-wise protection */}
        <Card className="lg:col-span-2 overflow-hidden">
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
              {loading ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Loading…
                </div>
              ) : sectorData.length ? (
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
      </div>

      {/* High-priority recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <InfoIcon className="h-5 w-5 text-primary" />
            Most Impactful Next Steps
          </CardTitle>
          <CardDescription>
            Complete these to quickly boost your protection and score.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="text-muted-foreground">Finding best actions…</div>
          ) : nextSteps.length ? (
            nextSteps.map((item) => {
              const Icon = CATEGORY_ICONS[item.category] ?? InfoIcon;
              return (
                <div
                  key={item.id}
                  className="flex items-start gap-3 rounded-lg border p-3"
                >
                  <div className="mt-0.5 rounded-md bg-muted p-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium leading-tight">
                        {item.title}
                      </span>
                      <Badge
                        variant={
                          item.priority === "high"
                            ? "destructive"
                            : item.priority === "medium"
                              ? "default"
                              : "secondary"
                        }
                        className="text-xs"
                      >
                        {item.priority}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {CATEGORY_LABELS[item.category]}
                      </Badge>
                      {item.estimatedTimeMinutes ? (
                        <Badge variant="outline" className="text-xs">
                          {item.estimatedTimeMinutes}m
                        </Badge>
                      ) : null}
                    </div>

                    <p className="text-sm text-muted-foreground mt-1">
                      {item.recommendationText}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {item.toolLaunchUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            window.open(item.toolLaunchUrl!, "_blank")
                          }
                          className="gap-1"
                        >
                          <LinkIcon className="h-4 w-4" />
                          Launch Tool
                        </Button>
                      )}
                      <Link to={`${CHECKLIST_ROUTE}?focus=${item.id}`}>
                        <Button size="sm">View step</Button>
                      </Link>
                      {item.helpUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(item.helpUrl!, "_blank")}
                        >
                          Learn more
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-muted-foreground">
              🎉 You’ve completed the high-impact items! Explore the full
              checklist for more.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
