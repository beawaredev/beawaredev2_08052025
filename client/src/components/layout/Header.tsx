// src/components/layout/Header.tsx
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MenuIcon,
  Search,
  LogOut,
  Home as HomeIcon,
  GaugeIcon,
} from "lucide-react";
import beawareLogo from "@assets/Logo_Main.svg";
import { apiRequest } from "@/lib/queryClient";

interface HeaderProps {
  onMobileMenuToggle: () => void;
}

/** ---------- Score helpers (aligned to your app route) ---------- */
type Priority = "high" | "medium" | "low";
type Category =
  | "identity_protection"
  | "password_security"
  | "account_security"
  | "device_security"
  | "network_security"
  | "financial_security";

/* NOTE: Your app uses /secure-your-digital-presence for the checklist */
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

const TIER_STYLE = {
  good: {
    text: "text-green-700",
    icon: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-200",
  },
  caution: {
    text: "text-yellow-700",
    icon: "text-yellow-700",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
  },
  risk: {
    text: "text-red-700",
    icon: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
  },
} as const;

/** ---------- Types used by queries ---------- */
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

/** Small header pill that shows a colored, explanatory Security Score */
function HeaderSecurityScore() {
  // Public checklist (unauthed users can still see the structure)
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

  // User progress (401 => [])
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

  // Canonical weighted score
  const completedIds = new Set(
    (userProgress || [])
      .filter((p) => p.isCompleted)
      .map((p) => p.checklistItemId),
  );
  const totalWeight = checklistItems.reduce(
    (sum, i) => sum + weightFor(i.priority),
    0,
  );
  const earnedWeight = checklistItems
    .filter((i) => completedIds.has(i.id))
    .reduce((sum, i) => sum + weightFor(i.priority), 0);
  const scorePctRaw = percent(earnedWeight, totalWeight);
  const scorePctDisplay = roundPct(scorePctRaw);

  // High-impact completion
  const hi = checklistItems.filter((i) => i.priority === "high");
  const hiDone = hi.filter((i) => completedIds.has(i.id)).length;
  const hiPct = roundPct(percent(hiDone, hi.length));

  // Tier & styling
  const tier = getTier(scorePctDisplay, hiPct);
  const style = TIER_STYLE[tier];

  // Smart deep-link: if not "good", send to high-impact filter
  const href =
    tier === "good" ? CHECKLIST_ROUTE : `${CHECKLIST_ROUTE}?priority=high`;

  const titleText =
    "Security Score: percentage of weighted checklist complete. " +
    "Color reflects overall protection and high-impact completion. Click to view details.";

  return (
    <Link href={href}>
      <a
        className={`hidden sm:flex items-center gap-2 rounded-md border px-3 py-1.5 transition-colors ${style.bg} ${style.border}`}
        title={titleText}
        aria-label={`${formatPct(scorePctDisplay)} of weighted checklist complete. High-impact ${formatPct(hiPct)}.`}
      >
        <GaugeIcon className={`h-4 w-4 ${style.icon}`} />
        <span className="text-sm font-medium">Security Score</span>
        {loading ? (
          <span className="text-sm text-muted-foreground">…</span>
        ) : (
          <span className={`text-sm font-semibold ${style.text}`}>
            {formatPct(scorePctDisplay)}
          </span>
        )}
      </a>
    </Link>
  );
}

export default function Header({ onMobileMenuToggle }: HeaderProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [query, setQuery] = useState("");

  const guestTopLinks = [
    { name: "Home", path: "/" },
    { name: "Scam Lookup", path: "/scam-lookup" },
    { name: "Educational Videos", path: "/scam-videos" },
    { name: "Scam Help", path: "/help" },
    { name: "Contact Us", path: "/contact" },
  ];

  const isActive = (path: string) => location === path;

  const submitLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    window.location.href = `/scam-lookup?q=${encodeURIComponent(q)}`;
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm h-16 flex items-center">
      <div className="w-full flex items-center justify-between px-4 h-full">
        {/* Left: Logo + navigation */}
        <div className="flex items-center gap-6 h-full">
          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-600 hover:text-gray-900 focus:outline-none"
            onClick={onMobileMenuToggle}
            aria-label="Open menu"
          >
            <MenuIcon className="h-6 w-6" />
          </button>

          {/* Show logo ONLY if user is not logged in */}
          {!user && (
            <Link
              href="/"
              className="flex items-center gap-2 shrink-0"
              aria-label="BeAware Home"
            >
              <img
                src={beawareLogo}
                alt="BeAware Logo"
                className="h-12 md:h-16 w-auto object-contain"
                decoding="async"
                loading="eager"
                draggable={false}
              />
            </Link>
          )}

          {/* Guest navigation links */}
          {!user && (
            <nav className="hidden md:flex items-center gap-6 h-full">
              {guestTopLinks.map((l) => (
                <Link
                  key={l.path}
                  href={l.path}
                  className={`text-sm inline-flex items-center gap-1 h-full border-b-2 ${
                    isActive(l.path)
                      ? "text-primary font-medium border-primary"
                      : "text-gray-700 hover:text-primary border-transparent"
                  }`}
                >
                  {l.name === "Home" && <HomeIcon className="h-4 w-4" />}
                  {l.name}
                </Link>
              ))}
            </nav>
          )}
        </div>

        {/* Right: Search + Auth / user actions */}
        <div className="flex items-center space-x-3 h-full">
          {/* 🔍 Scam Lookup search (both guests and users) */}
          <form
            onSubmit={submitLookup}
            className="hidden md:flex items-center"
            role="search"
            aria-label="Scam Lookup"
          >
            <Input
              type="text"
              inputMode="search"
              placeholder="Search phone or link…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 rounded-r-none w-56"
              aria-label="Enter phone number or URL"
            />
            <Button type="submit" className="h-9 rounded-l-none">
              <Search className="h-4 w-4 mr-1" />
              Search
            </Button>
          </form>

          {/* Mobile quick access to Scam Lookup */}
          {location !== "/scam-lookup" && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="md:hidden"
              title="Open Scam Lookup"
            >
              <Link href="/scam-lookup" className="flex items-center gap-1">
                <Search className="h-4 w-4" />
                <span>Lookup</span>
              </Link>
            </Button>
          )}

          {!user ? (
            <>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="hidden sm:flex"
              >
                <Link href="/login">Log In</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Sign Up</Link>
              </Button>
            </>
          ) : (
            <>
              {/* Consistent, colored, explanatory score pill */}
              <HeaderSecurityScore />

              {/* Quick button to open Scam Lookup */}
              {location !== "/scam-lookup" && (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="hidden sm:flex"
                  title="Go to Scam Lookup"
                >
                  <Link href="/scam-lookup" className="flex items-center gap-1">
                    <Search className="h-4 w-4" />
                    <span>Scam Lookup</span>
                  </Link>
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="flex items-center gap-1 text-muted-foreground hover:text-destructive"
                title="Log out"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Log Out</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
