// client/src/components/RefineRecommendations.tsx
import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  Wifi as WifiIcon,
  Mail,
  CreditCard,
  KeyRound,
  ShieldAlert,
  Sparkles,
  ArrowRight,
} from "lucide-react";

type WorryKey =
  | "scam_calls"
  | "wifi_eavesdrop"
  | "spam_phishing"
  | "identity_theft"
  | "weak_passwords"
  | "general_safer";

export type Recommendation = {
  slug: string; // anchor id on the checklist page
  title: string;
  rationale: string; // plain-English “why”
  est?: string;
  points?: string;
};

type Props = {
  // Called with selected worry and its recommendations
  onApply?: (args: {
    worry: WorryKey;
    recommendations: Recommendation[];
  }) => void;
  // Optional: override default mapping by fetching server-side
  fetchRecommendations?: (worry: WorryKey) => Promise<Recommendation[]>;
  // Optional: default to a specific worry (e.g., coming from Dashboard)
  defaultWorry?: WorryKey | null;
  // Render variant: "chip" (small pill) or "button" (regular)
  variant?: "chip" | "button";
};

const LOCAL_RECOMMENDATIONS: Record<WorryKey, Recommendation[]> = {
  scam_calls: [
    {
      slug: "enable-2fa",
      title: "Turn on 2-Factor Authentication",
      rationale: "If a scam steals a password, 2FA blocks account takeover.",
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
      rationale: "Blocks malicious sites at the network for everyone at home.",
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

const WORRIES: Array<{ key: WorryKey; label: string; icon: React.ReactNode }> =
  [
    {
      key: "scam_calls",
      label: "Scam calls or texts",
      icon: <Phone className="h-4 w-4" />,
    },
    {
      key: "wifi_eavesdrop",
      label: "Someone snooping on my Wi-Fi",
      icon: <WifiIcon className="h-4 w-4" />,
    },
    {
      key: "spam_phishing",
      label: "Spam / phishing emails",
      icon: <Mail className="h-4 w-4" />,
    },
    {
      key: "identity_theft",
      label: "Identity theft / credit risk",
      icon: <CreditCard className="h-4 w-4" />,
    },
    {
      key: "weak_passwords",
      label: "Weak / reused passwords",
      icon: <KeyRound className="h-4 w-4" />,
    },
    {
      key: "general_safer",
      label: "Just be safer overall",
      icon: <ShieldAlert className="h-4 w-4" />,
    },
  ];

export default function RefineRecommendations({
  onApply,
  fetchRecommendations,
  defaultWorry = null,
  variant = "chip",
}: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<WorryKey | null>(defaultWorry);
  const selectedLabel = useMemo(
    () => WORRIES.find((w) => w.key === selected)?.label,
    [selected],
  );

  async function handleApply() {
    const worry = selected ?? "general_safer";
    const recs = fetchRecommendations
      ? await fetchRecommendations(worry)
      : (LOCAL_RECOMMENDATIONS[worry] ?? []);
    onApply?.({ worry, recommendations: recs });
    setOpen(false);
  }

  const Trigger = (
    <Button
      variant={variant === "chip" ? "outline" : "default"}
      size={variant === "chip" ? "sm" : "default"}
      className={variant === "chip" ? "rounded-full" : ""}
    >
      {variant === "chip"
        ? "Refine recommendations"
        : "Refine my recommendations"}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{Trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>What are you worried about today?</DialogTitle>
          <DialogDescription>
            Pick one — we’ll re-rank your checklist to show the best next steps.
          </DialogDescription>
        </DialogHeader>

        {/* Chips */}
        <div className="mt-2 flex flex-wrap gap-2">
          {WORRIES.map((w) => {
            const active = selected === w.key;
            return (
              <button
                key={w.key}
                onClick={() => setSelected(w.key)}
                className={[
                  "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition",
                  active
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white hover:bg-slate-50",
                ].join(" ")}
                aria-pressed={active}
              >
                {w.icon}
                <span>{w.label}</span>
              </button>
            );
          })}
        </div>

        {/* Selection hint */}
        <div className="mt-3 text-sm text-muted-foreground">
          {selected ? (
            <>
              Selected: <Badge variant="secondary">{selectedLabel}</Badge>
            </>
          ) : (
            <>
              <Sparkles className="inline-block h-4 w-4 mr-1" />
              Tip: If you’re not sure, choose “Just be safer overall.”
            </>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply} className="gap-2" disabled={!selected}>
            Apply <ArrowRight className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
