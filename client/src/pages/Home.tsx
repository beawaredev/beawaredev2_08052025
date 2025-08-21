import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Shield,
  Search,
  AlertTriangle,
  BarChart,
  Phone,
  Link as LinkIcon,
  Users,
  Lock,
  Bot,
  Building2,
  ArrowRight,
  CheckCircle,
  Clock,
} from "lucide-react";

export default function BeAwareFlashyLanding() {
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

      {/* hero */}
      <section className="px-4 pt-16 md:pt-24 pb-16">
        <div className="mx-auto max-w-7xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
            <CheckCircle className="h-3.5 w-3.5" /> Digital safety, simplified
          </div>
          <h1 className="mt-5 text-4xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-sky-500 to-teal-500">
            BeAware — Stop scams before they happen
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Check suspicious numbers and links, report scams, and follow a
            guided security checklist — plain-English steps that protect you and
            your family.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild>
              <a href="/signup" className="flex items-center gap-2">
                Get started free <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="/secure-your-digital-presence">See how it works</a>
            </Button>
          </div>

          {/* quick checks */}
          <div className="mt-10 grid gap-4 sm:grid-cols-2 max-w-3xl mx-auto">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Phone className="h-4 w-4" /> Check a phone number
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input placeholder="e.g. +1 (555) 123-4567" />
                  <Button variant="secondary" asChild>
                    <a href="/scam-checker">
                      <Search className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" /> Check a link
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input placeholder="Paste a URL" />
                  <Button variant="secondary" asChild>
                    <a href="/scam-checker">
                      <Search className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* problems */}
      <Section
        title="Problems BeAware solves"
        subtitle="Real threats, clear actions."
      >
        <div className="grid gap-6 md:grid-cols-3">
          <ProblemCard
            icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
            title="It's hard to know what's legit"
            desc="Robocalls, spoofed emails, and fake listings are convincing. BeAware helps you verify before you act."
          />
          <ProblemCard
            icon={<Lock className="h-5 w-5 text-emerald-600" />}
            title="Safety steps are scattered"
            desc="Credit freezes, 2FA, device security — all across different sites. We guide you step-by-step."
          />
          <ProblemCard
            icon={<Bot className="h-5 w-5 text-indigo-600" />}
            title="Advice is complex, time is short"
            desc="We skip jargon and surface the highest-impact actions for busy people and families."
          />
        </div>
      </Section>

      {/* how it works */}
      <Section
        title="Get safer in three steps"
        subtitle="Simple flow that builds real protection."
      >
        <ol className="grid gap-6 md:grid-cols-3">
          <StepCard step="1" title="Search or Report">
            Paste a number or URL to check — or file a report to warn others.
          </StepCard>
          <StepCard step="2" title="Follow your checklist">
            Finish essentials like credit freezes, password manager, and 2FA.
          </StepCard>
          <StepCard step="3" title="Stay ahead">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-4 w-4" /> Timely tips
            </span>{" "}
            and reminders tailored to your risk.
          </StepCard>
        </ol>
        <div className="mt-6 text-center">
          <Button size="lg" asChild>
            <a href="/signup">Create Free Account</a>
          </Button>
        </div>
      </Section>

      {/* features */}
      <Section
        title="Features that matter"
        subtitle="Focused on outcomes, not dashboards."
      >
        <div className="grid gap-6 md:grid-cols-3">
          <FeatureCard
            icon={<Shield className="h-5 w-5" />}
            title="Guided security checklist"
            desc="A prioritized plan across identity, passwords, accounts, devices, network, and finances."
            href="/secure-your-digital-presence"
            badge="Popular"
          />
          <FeatureCard
            icon={<Phone className="h-5 w-5" />}
            title="Phone number lookup"
            desc="Spot scam patterns in seconds, powered by community reports and signals."
            href="/scam-checker"
          />
          <FeatureCard
            icon={<LinkIcon className="h-5 w-5" />}
            title="URL reputation"
            desc="Check links before you click or share to avoid phishing and malware."
            href="/scam-checker"
          />
          <FeatureCard
            icon={<Users className="h-5 w-5" />}
            title="Community reporting"
            desc="Share what happened to help others stay safe and reduce repeat victimization."
            href="/report-scam"
          />
          <FeatureCard
            icon={<Building2 className="h-5 w-5" />}
            title="Business verification"
            desc="Look up suspicious businesses and report fraudulent listings."
            href="/report-scam"
          />
          <FeatureCard
            icon={<BarChart className="h-5 w-5" />}
            title="AI help when targeted"
            desc="Plain-English guidance on what to do next if you think you’ve been hit."
            href="/videos"
          />
        </div>
      </Section>

      {/* trust */}
      <div className="border-t">
        <Section
          title="Why people trust BeAware"
          subtitle="Community + clarity = safer online life."
        >
          <div className="grid gap-6 md:grid-cols-3">
            <StatCard value="10,000+" label="scam checks run" />
            <StatCard value="95%" label="feel safer after BeAware" />
            <StatCard value="< 5 min" label="average setup time" />
          </div>
          <p className="text-center text-xs text-slate-500 mt-3">
            *Sample metrics during beta; replace with your live stats.
          </p>
        </Section>
      </div>

      {/* final cta */}
      <section className="px-4 py-16 text-center">
        <Badge variant="secondary" className="mb-3">
          Get started free
        </Badge>
        <h2 className="text-3xl md:text-4xl font-extrabold">
          Be scam-smart today
        </h2>
        <p className="mt-3 text-lg text-slate-600 max-w-2xl mx-auto">
          Check suspicious contacts, report fraud, and protect your digital life
          in minutes.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button size="lg" asChild>
            <a href="/signup">Create Account</a>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a href="/login">Log In</a>
          </Button>
        </div>
      </section>
    </div>
  );
}

/* --- helpers --- */
function Section({ title, subtitle, children }: any) {
  return (
    <section className="px-4 py-14">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-3 text-center max-w-2xl mx-auto text-slate-600">
            {subtitle}
          </p>
        )}
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}
function ProblemCard({ icon, title, desc }: any) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 text-slate-700">
          {icon}
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="text-slate-600">{desc}</CardContent>
    </Card>
  );
}
function StepCard({ step, title, children }: any) {
  return (
    <div className="rounded-xl border bg-card shadow-sm p-5">
      <Badge variant="secondary">Step {step}</Badge>
      <div className="mt-2 font-medium">{title}</div>
      <p className="mt-2 text-sm text-muted-foreground">{children}</p>
    </div>
  );
}
function FeatureCard({ icon, title, desc, href, badge }: any) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 text-foreground">
          {icon}
          <CardTitle className="text-lg">{title}</CardTitle>
          {badge ? <Badge className="ml-auto">{badge}</Badge> : null}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{desc}</p>
        <div className="mt-4">
          <Button variant="ghost" className="px-0" asChild>
            <a href={href} className="inline-flex items-center gap-2">
              Learn more <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
function StatCard({ value, label }: any) {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm text-center">
      <div className="text-3xl font-bold">{value}</div>
      <div className="mt-1 text-muted-foreground">{label}</div>
    </div>
  );
}
