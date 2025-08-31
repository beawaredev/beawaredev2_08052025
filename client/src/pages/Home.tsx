import React, { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Logo from "@assets/OnlyBeAware.svg";
import { useAuth } from "@/contexts/AuthContext"; // if your path is singular, change to "@/context/AuthContext"

import {
  Shield,
  Search,
  AlertTriangle,
  BarChart,
  Phone,
  Link as LinkIcon,
  Users,
  Lock,
  ArrowRight,
  CheckCircle,
  Percent,
  Sparkles,
  Target,
  ListChecks,
  Gauge,
  CheckCircle2,
} from "lucide-react";

/**
 * Home.tsx — Public landing page with strong focus-highlight sections
 * + Per-card fade-in animations (whileInView) with staggered delays
 */
export default function Home() {
  const [phoneQuery, setPhoneQuery] = useState("");
  const [urlQuery, setUrlQuery] = useState("");

  // --- Robust auth detection across different context shapes ---
  const auth = (useAuth?.() as any) ?? {};
  const isAuthed: boolean = !!(
    auth?.isAuthenticated ??
    auth?.user ??
    auth?.currentUser
  );

  const goPhoneLookup = () => {
    const q = phoneQuery.trim();
    if (!q) return;
    window.location.href = `/scam-lookup?type=phone&q=${encodeURIComponent(q)}`;
  };

  const goUrlLookup = () => {
    const q = urlQuery.trim();
    if (!q) return;
    window.location.href = `/scam-lookup?type=url&q=${encodeURIComponent(q)}`;
  };

  return (
    <div className="relative bg-white text-slate-900">
      {/* backdrop glow */}
      <motion.div
        className="fixed inset-0 -z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.15),transparent_40%),radial-gradient(circle_at_80%_30%,rgba(217,70,239,0.15),transparent_35%),radial-gradient(circle_at_50%_80%,rgba(16,185,129,0.12),transparent_35%)]" />
      </motion.div>

      {/* HERO */}
      <section className="px-4 pt-10 md:pt-16 pb-12">
        <div className="mx-auto max-w-7xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
            <CheckCircle className="h-3.5 w-3.5" /> Your guided path to safer
            digital life
          </div>

          <h1 className="mt-5 text-4xl md:text-6xl font-extrabold tracking-tight flex items-center justify-center gap-3">
            <img
              src={Logo}
              alt="BeAware logo"
              className="h-12 md:h-16 w-auto block"
              loading="eager"
              decoding="async"
            />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-sky-500 to-teal-500">
              Your Guided Path to Online Safety
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-3xl text-lg text-slate-600">
            Raising awareness and making protection easy with clear checklists
            and expert tools.
          </p>

          {/* HERO CTAs — show ONLY checklist when logged in */}
          {isAuthed ? (
            <div className="mt-7 flex items-center justify-center">
              <Button size="lg" asChild>
                <a
                  href="/secure-your-digital-presence"
                  className="flex items-center gap-2"
                >
                  Open Security Checklist <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </div>
          ) : (
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" asChild>
                <a href="/register" className="flex items-center gap-2">
                  Get started free <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#checklist">See the checklist</a>
              </Button>
            </div>
          )}

          {/* quick checks */}
          <div className="mt-10 grid gap-4 sm:grid-cols-2 max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.35, ease: "easeOut", delay: 0 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Phone className="h-4 w-4" /> Check a phone number
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. +1 (555) 123-4567"
                      value={phoneQuery}
                      onChange={(e) => setPhoneQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && goPhoneLookup()}
                    />
                    <Button
                      variant="secondary"
                      onClick={goPhoneLookup}
                      aria-label="Lookup phone"
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.35, ease: "easeOut", delay: 0.05 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" /> Check a link
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Paste a URL"
                      value={urlQuery}
                      onChange={(e) => setUrlQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && goUrlLookup()}
                    />
                    <Button
                      variant="secondary"
                      onClick={goUrlLookup}
                      aria-label="Scan URL"
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* WHY THIS MATTERS */}
      <Section
        title="Why the checklist matters"
        subtitle="Real threats, clear priorities. Take action that actually improves your protection."
        focusTone="slate"
      >
        <div className="grid gap-6 md:grid-cols-3">
          <ProblemCard
            icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
            title="Hard to know what's legit"
            desc="Scammers exploit urgency and trust. Verify before you act with quick phone/URL checks."
            delay={0}
          />
          <ProblemCard
            icon={<ListChecks className="h-5 w-5 text-emerald-600" />}
            title="Steps are scattered"
            desc="Credit freeze, 2FA, passwords, device & Wi-Fi—your checklist brings it together, step by step."
            delay={0.05}
          />
          <ProblemCard
            icon={<Gauge className="h-5 w-5 text-indigo-600" />}
            title="No sense of progress"
            desc="See the payoff as you complete high-impact actions and lock down your identity."
            delay={0.1}
          />
        </div>
      </Section>

      {/* CHECKLIST PREVIEW + SCORE */}
      <Section
        id="checklist"
        title="Your Guided Security Checklist"
        subtitle="Concrete tasks that strengthen your security"
        focusTone="indigo"
      >
        <div className="grid gap-6 md:grid-cols-2">
          {/* Score panel */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0 }}
          >
            <Card className="h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Gauge className="h-5 w-5 text-teal-600" />
                  <CardTitle className="text-lg">Security Score</CardTitle>
                  <Badge className="ml-auto" variant="secondary">
                    Beta
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Your score reflects how well your identity, accounts, devices,
                  network, and finances are protected. Each completed task adds
                  points—prioritized by impact.
                </p>
                <ul className="mt-4 space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5" />
                    <span>
                      <b>High impact first:</b> 2FA, password manager, and
                      credit freeze deliver the biggest gains.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5" />
                    <span>
                      <b>Real-time feedback:</b> See progress as you finish
                      steps.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5" />
                    <span>
                      <b>Plain English:</b> Clear instructions and estimated
                      time.
                    </span>
                  </li>
                </ul>
                <div className="mt-5">
                  <Button asChild>
                    <a href="/secure-your-digital-presence">
                      Open my checklist
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Checklist cards preview (staggered) */}
          <div className="grid gap-4">
            <MiniTask
              icon={<Lock className="h-4 w-4 text-slate-700" />}
              title="Use a password manager"
              points="+20 pts • 15–20 min"
              desc="Generate unique passwords automatically and store them securely."
              delay={0}
            />
            <MiniTask
              icon={<Shield className="h-4 w-4 text-slate-700" />}
              title="Enable 2-Factor Authentication"
              points="+18 pts • 10–15 min"
              desc="Add a one-time code from an authenticator app on key accounts."
              delay={0.05}
            />
            <MiniTask
              icon={<Target className="h-4 w-4 text-slate-700" />}
              title="Freeze your credit"
              points="+15 pts • 10 min"
              desc="Block new lines of credit in your name to stop identity fraud."
              delay={0.1}
            />
            <MiniTask
              icon={<WifiIcon />}
              title="Secure your Wi-Fi & devices"
              points="+12 pts • 10–15 min"
              desc="Strong router password, auto updates, and screen locks across devices."
              delay={0.15}
            />
          </div>
        </div>
      </Section>

      {/* FEATURES */}
      <Section
        title="Tools that help you act fast"
        subtitle="Outcomes over dashboards."
        focusTone="zinc"
      >
        <div className="grid gap-6 md:grid-cols-3">
          <FeatureCard
            icon={<Phone className="h-5 w-5" />}
            title="Phone number lookup"
            desc="Spot scam patterns in seconds."
            href="/scam-lookup?type=phone"
            delay={0}
          />
          <FeatureCard
            icon={<LinkIcon className="h-5 w-5" />}
            title="URL reputation"
            desc="Check links before you click or share."
            href="/scam-lookup?type=url"
            delay={0.05}
          />
          <FeatureCard
            icon={<BarChart className="h-5 w-5" />}
            title="AI help when targeted"
            desc="Plain-English guidance on what to do next if you think you’ve been hit."
            href="/scam-videos"
            delay={0.1}
          />
        </div>
      </Section>

      {/* PARTNER PERKS */}
      <Section
        title="Vetted partners. Member pricing."
        subtitle="We work with industry security experts so you get the right tools—at lower cost."
        focusTone="emerald"
      >
        <div className="grid gap-6 md:grid-cols-3">
          <PerkCard
            icon={<Percent className="h-5 w-5 text-slate-700" />}
            title="Member discounts"
            desc="Save on password managers, identity monitoring, and privacy tools."
            delay={0}
          />
          <PerkCard
            icon={<Shield className="h-5 w-5 text-slate-700" />}
            title="Expert-approved"
            desc="We vet tools for security, privacy, and value—no pay-to-play listings."
            delay={0.05}
          />
          <PerkCard
            icon={<Sparkles className="h-5 w-5 text-slate-700" />}
            title="Only what matters"
            desc="Focused on essentials that protect you from real threats—no fluff, no noise."
            delay={0.1}
          />
        </div>

        {/* Partner CTA — no register shown when logged in */}
        <div className="mt-6 text-center">
          {isAuthed ? (
            <Button asChild>
              <a
                href="/secure-your-digital-presence"
                className="inline-flex items-center gap-2"
              >
                Open Security Checklist <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          ) : (
            <Button asChild>
              <a href="/register" className="inline-flex items-center gap-2">
                See partner deals <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </Section>

      {/* THE BEAWARE DIFFERENCE */}
      <div className="border-t">
        <Section
          title="The BeAware Difference"
          subtitle="Why people choose us to protect their digital life."
          focusTone="slate"
        >
          <div className="grid gap-6 md:grid-cols-3">
            <PerkCard
              icon={<Shield className="h-5 w-5 text-slate-700" />}
              title="Backed by experts"
              desc="Every tool and step is reviewed by security professionals—no shortcuts, no gimmicks."
              delay={0}
            />
            <PerkCard
              icon={<Users className="h-5 w-5 text-slate-700" />}
              title="Built for everyone"
              desc="Clear, step-by-step guidance in plain English—so anyone can protect themselves."
              delay={0.05}
            />
            <PerkCard
              icon={<Lock className="h-5 w-5 text-slate-700" />}
              title="Privacy first"
              desc="Your safety comes first. We never sell your data or allow pay-to-play placements."
              delay={0.1}
            />
          </div>
        </Section>
      </div>

      {/* FINAL CTA */}
      <section className="px-4 py-12 md:py-16 text-center">
        <Badge variant="secondary" className="mb-3">
          Get started free
        </Badge>
        <h2 className="text-3xl md:text-4xl font-extrabold">
          Start your guided protection today
        </h2>
        <p className="mt-3 text-lg text-slate-600 max-w-2xl mx-auto">
          Open your checklist, complete high-impact steps, and unlock trusted
          tools at better prices.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          {isAuthed ? (
            <>
              <Button size="lg" asChild>
                <a href="/secure-your-digital-presence">
                  Open Security Checklist
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="/dashboard">Go to Dashboard</a>
              </Button>
            </>
          ) : (
            <>
              <Button size="lg" asChild>
                <a href="/register">Create Account</a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="/login">Log In</a>
              </Button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

/* --- Strong focus-aware Section helper (tinted bg + left bar + ring + micro-scale) --- */
function Section({
  id,
  title,
  subtitle,
  children,
  focusTone = "indigo", // "indigo" | "emerald" | "slate" | "zinc"
}: {
  id?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  focusTone?: "indigo" | "emerald" | "slate" | "zinc";
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { amount: 0.45, margin: "0px 0px -15% 0px" });

  const tones: Record<
    string,
    { bg: string; ring: string; bar: string; grad: string }
  > = {
    indigo: {
      bg: "bg-indigo-100",
      ring: "ring-indigo-300",
      bar: "from-indigo-400 to-indigo-600",
      grad: "from-white/70 via-indigo-50 to-white/70",
    },
    emerald: {
      bg: "bg-emerald-100",
      ring: "ring-emerald-300",
      bar: "from-emerald-400 to-emerald-600",
      grad: "from-white/70 via-emerald-50 to-white/70",
    },
    slate: {
      bg: "bg-slate-100",
      ring: "ring-slate-300",
      bar: "from-slate-400 to-slate-600",
      grad: "from-white/70 via-slate-50 to-white/70",
    },
    zinc: {
      bg: "bg-zinc-100",
      ring: "ring-zinc-300",
      bar: "from-zinc-400 to-zinc-600",
      grad: "from-white/70 via-zinc-50 to-white/70",
    },
  };

  const t = tones[focusTone] ?? tones.indigo;

  return (
    <section
      id={id}
      ref={ref}
      className={[
        "relative px-4 py-12 md:py-16 transition-colors duration-500",
        inView ? t.bg : "bg-white",
      ].join(" ")}
    >
      {/* Left accent bar */}
      <div
        className={[
          "absolute left-0 top-0 h-full w-1 md:w-1.5 bg-gradient-to-b transition-colors duration-500",
          inView ? t.bar : "from-transparent to-transparent",
        ].join(" ")}
      />
      {/* Content container with soft gradient + ring when in view */}
      <motion.div
        initial={{ opacity: 0.6, scale: 0.995, y: 1 }}
        animate={
          inView
            ? { opacity: 1, scale: 1, y: 0 }
            : { opacity: 0.9, scale: 0.997, y: 1 }
        }
        transition={{ duration: 0.35, ease: "easeOut" }}
        className={[
          "max-w-7xl mx-auto rounded-2xl transition-all duration-500 p-6 md:p-8",
          "bg-gradient-to-br",
          inView ? t.grad : "from-white to-white",
          inView ? `ring-2 ${t.ring} shadow-lg` : "ring-0 shadow-sm",
          "backdrop-blur-sm",
        ].join(" ")}
      >
        <h2 className="text-3xl md:text-4xl font-extrabold text-center">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-3 text-center max-w-2xl mx-auto text-slate-700">
            {subtitle}
          </p>
        )}
        <div className="mt-8">{children}</div>
      </motion.div>
    </section>
  );
}

/* --- Cards & helpers (now animated with optional delay) --- */
function ProblemCard({
  icon,
  title,
  desc,
  delay = 0,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.35, ease: "easeOut", delay }}
    >
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 text-slate-700">
            {icon}
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="text-slate-600">{desc}</CardContent>
      </Card>
    </motion.div>
  );
}

function MiniTask({
  icon,
  title,
  points,
  desc,
  delay = 0,
}: {
  icon: React.ReactNode;
  title: string;
  points: string;
  desc: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2, margin: "0px 0px -5% 0px" }}
      transition={{ duration: 0.3, ease: "easeOut", delay }}
    >
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <div className="font-medium">{title}</div>
          </div>
          <Badge variant="outline">{points}</Badge>
        </div>
        <p className="mt-2 text-sm text-slate-600">{desc}</p>
      </div>
    </motion.div>
  );
}

// simple inline to avoid extra import clash
function WifiIcon() {
  return (
    <span className="inline-block text-slate-700 text-lg leading-none">📶</span>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
  href,
  delay = 0,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  href?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.35, ease: "easeOut", delay }}
    >
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 text-foreground">
            {icon}
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{desc}</p>
          {href && (
            <div className="mt-4">
              <Button variant="ghost" className="px-0" asChild>
                <a href={href} className="inline-flex items-center gap-2">
                  Learn more <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function PerkCard({
  icon,
  title,
  desc,
  delay = 0,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.35, ease: "easeOut", delay }}
    >
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          {icon}
          <div className="font-medium">{title}</div>
        </div>
        <p className="mt-2 text-sm text-slate-600">{desc}</p>
      </div>
    </motion.div>
  );
}
