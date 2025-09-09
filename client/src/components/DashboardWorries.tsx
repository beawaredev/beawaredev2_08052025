// client/src/components/DashboardWorries.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
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

type WorryKey =
  | "scam_calls"
  | "wifi_eavesdrop"
  | "spam_phishing"
  | "identity_theft"
  | "weak_passwords"
  | "general_safer";

type Recommendation = {
  slug: string;
  title: string;
  rationale: string;
  est?: string;
  points?: string;
};

const RECOMMENDATIONS: Record<WorryKey, Recommendation[]> = {
  scam_calls: [
    {
      slug: "enable-2fa",
      title: "Turn on 2-Factor Authentication",
      rationale:
        "Even if a scam steals a password, 2FA blocks account takeover.",
      est: "10–15 min",
      points: "+18 pts",
    },
    {
      slug: "freeze-credit",
      title: "Freeze your credit",
      rationale: "Stops new credit in your name after phone/text scams.",
      est: "10 min",
      points: "+15 pts",
    },
    {
      slug: "phone-safety",
      title: "Phone safety basics",
      rationale:
        "Block/report spam, silence unknown callers, enable carrier filters.",
      est: "5–10 min",
      points: "+8 pts",
    },
  ],
  wifi_eavesdrop: [
    {
      slug: "secure-wifi",
      title: "Secure your Wi-Fi router",
      rationale:
        "Change admin password, WPA2/WPA3, disable WPS to stop snooping.",
      est: "10–15 min",
      points: "+12 pts",
    },
    {
      slug: "device-updates",
      title: "Turn on automatic updates",
      rationale:
        "Patches close holes snoopers exploit on phones/laptops/routers.",
      est: "5 min",
      points: "+6 pts",
    },
    {
      slug: "dns-filtering",
      title: "Enable safer DNS / filtering",
      rationale: "Blocks malicious sites for everyone on your network.",
      est: "5–10 min",
      points: "+6 pts",
    },
  ],
  spam_phishing: [
    {
      slug: "email-filters",
      title: "Turn on spam & phishing filters",
      rationale: "Sends obvious scams to junk so fewer reach your inbox.",
      est: "5–10 min",
      points: "+8 pts",
    },
    {
      slug: "enable-2fa",
      title: "Enable 2-Factor Authentication",
      rationale: "Phishing steals passwords; 2FA keeps them out.",
      est: "10–15 min",
      points: "+18 pts",
    },
    {
      slug: "password-manager",
      title: "Use a password manager",
      rationale: "Managers won’t autofill on fake sites, helping spot phish.",
      est: "15–20 min",
      points: "+20 pts",
    },
  ],
  identity_theft: [
    {
      slug: "freeze-credit",
      title: "Freeze your credit",
      rationale:
        "Blocks new credit without your approval—core ID-theft defense.",
      est: "10 min",
      points: "+15 pts",
    },
    {
      slug: "fraud-alerts",
      title: "Add fraud alerts / monitoring",
      rationale: "Alerts you if someone tries to use your identity.",
      est: "5–10 min",
      points: "+6 pts",
    },
    {
      slug: "password-manager",
      title: "Adopt a password manager",
      rationale: "Stops reuse/weak passwords that fuel takeovers.",
      est: "15–20 min",
      points: "+20 pts",
    },
  ],
  weak_passwords: [
    {
      slug: "password-manager",
      title: "Use a password manager",
      rationale: "Generates strong unique passwords automatically.",
      est: "15–20 min",
      points: "+20 pts",
    },
    {
      slug: "enable-2fa",
      title: "Turn on 2-Factor Authentication",
      rationale: "Even if a password leaks, 2FA stops logins.",
      est: "10–15 min",
      points: "+18 pts",
    },
    {
      slug: "update-key-accounts",
      title: "Update your key accounts first",
      rationale: "Secure email/bank/shopping—these protect the rest.",
      est: "10–20 min",
      points: "+10 pts",
    },
  ],
  general_safer: [
    {
      slug: "enable-2fa",
      title: "Enable 2-Factor Authentication",
      rationale: "Biggest single boost to your Security Score across accounts.",
      est: "10–15 min",
      points: "+18 pts",
    },
    {
      slug: "password-manager",
      title: "Use a password manager",
      rationale: "Eliminates weak/reused passwords—the #1 cause of breaches.",
      est: "15–20 min",
      points: "+20 pts",
    },
    {
      slug: "secure-wifi",
      title: "Secure your Wi-Fi router",
      rationale: "Protects everyone at home; stops local snooping.",
      est: "10–15 min",
      points: "+12 pts",
    },
  ],
};

const WORRIES: Array<{
  key: WorryKey;
  label: string;
  icon: React.ReactNode;
  blurb: string;
}> = [
  {
    key: "scam_calls",
    label: "Scam calls or texts",
    icon: <Phone className="h-4 w-4" />,
    blurb: "Verify unknown callers & avoid urgency traps.",
  },
  {
    key: "wifi_eavesdrop",
    label: "Someone snooping on Wi-Fi",
    icon: <WifiIcon className="h-4 w-4" />,
    blurb: "Lock down your router & network basics.",
  },
  {
    key: "spam_phishing",
    label: "Spam / phishing emails",
    icon: <Mail className="h-4 w-4" />,
    blurb: "Filter junk & spot fakes at a glance.",
  },
  {
    key: "identity_theft",
    label: "Identity theft / credit risk",
    icon: <CreditCard className="h-4 w-4" />,
    blurb: "Stop new credit lines & get alerts.",
  },
  {
    key: "weak_passwords",
    label: "Weak / reused passwords",
    icon: <KeyRound className="h-4 w-4" />,
    blurb: "Stronger passwords without memorizing.",
  },
  {
    key: "general_safer",
    label: "Be safer overall",
    icon: <ShieldAlert className="h-4 w-4" />,
    blurb: "Start with the biggest wins first.",
  },
];

export default function DashboardWorries() {
  const [selected, setSelected] = useState<WorryKey | null>(null);
  const recsRef = useRef<HTMLDivElement | null>(null);

  const recs = useMemo(
    () => (selected ? RECOMMENDATIONS[selected] : []),
    [selected],
  );
  const selectedLabel = useMemo(
    () => WORRIES.find((w) => w.key === selected)?.label,
    [selected],
  );

  // Auto-scroll to the animated suggestions after selection
  useEffect(() => {
    if (!selected) return;
    const t = setTimeout(() => {
      recsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
    return () => clearTimeout(t);
  }, [selected]);

  const reset = () => setSelected(null);

  return (
    // Pop-out: the entire card scales and lifts on hover
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
              <CardTitle className="text-2xl md:text-3xl font-extrabold">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600">
                  What worries you the most?
                </span>
              </CardTitle>
            </div>

            <div className="flex items-center gap-2">
              {selected && (
                <Badge variant="secondary" className="text-sm">
                  <CheckCircle2 className="mr-1 h-4 w-4" />
                  {selectedLabel}
                </Badge>
              )}
              {selected && (
                // Fancy hover for "Change"
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
            Tap a card — we’ll prioritize your checklist and show quick wins.
          </p>
        </CardHeader>

        <CardContent className="pt-4">
          {/* Chips with hover/tap pop */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {WORRIES.map((w) => {
              const active = selected === w.key;
              return (
                <motion.button
                  key={w.key}
                  onClick={() => setSelected(w.key)}
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
                      {w.icon}
                    </span>
                    <div className="flex-1">
                      <div className="font-semibold leading-snug">
                        {w.label}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {w.blurb}
                      </p>
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
              {!selected ? (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                  className="rounded-2xl border bg-slate-50 p-4 text-sm text-slate-700 mt-3"
                >
                  <Sparkles className="mr-2 inline-block h-4 w-4" />
                  Select an option to see your personalized next steps.
                </motion.div>
              ) : (
                <motion.div
                  key={selected}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="mt-4">
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className="mb-2"
                    >
                      <h3 className="text-lg md:text-xl font-semibold">
                        Suggested next steps
                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                          (based on “{selectedLabel}”)
                        </span>
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Do the first one or two for the biggest impact today.
                      </p>
                    </motion.div>

                    {/* Staggered recommendation cards */}
                    <motion.div
                      variants={{
                        show: { transition: { staggerChildren: 0.06 } },
                        hidden: {},
                      }}
                      initial="hidden"
                      animate="show"
                      className="grid gap-3 md:grid-cols-2"
                    >
                      {recs.map((item) => (
                        <motion.div
                          key={item.slug}
                          variants={{
                            hidden: { opacity: 0, y: 8, scale: 0.98 },
                            show: { opacity: 1, y: 0, scale: 1 },
                          }}
                          transition={{ duration: 0.25, ease: "easeOut" }}
                          className="rounded-2xl border p-4 bg-white"
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
                          <p className="text-sm text-muted-foreground mt-1">
                            {item.rationale}
                          </p>
                          <div className="mt-3">
                            {/* Button pop on hover */}
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
