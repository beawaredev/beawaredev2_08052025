// src/pages/ScamLookup.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  Search,
  Phone,
  Mail,
  Globe,
  Clock,
  CheckCircle,
  XCircle,
  Lock,
  LogIn,
  ArrowRight as ArrowRightIcon,
  Handshake as HandshakeIcon,
  ShieldAlert,
  ShieldCheck,
  Shield,
  Bot,
  Bug,
  Siren as SirenIcon,
  WifiOff,
  ShieldQuestion,
  Globe2,
  ScanFace,
  Database,
  KeySquare,
  ShieldClose,
  Info,
  TriangleAlert,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";

type LookupType = "phone" | "email" | "url";

interface ApiConfig {
  id: number;
  name: string;
  type: LookupType;
  description?: string;
  enabled: boolean;
}

interface LookupResult {
  success: boolean;
  data?: any;
  error?: string;
  apiName: string;
  responseTime?: number;
  apiId?: number;
}

interface LookupResponse {
  success: boolean;
  results?: LookupResult[];
  totalApis?: number;
  type?: LookupType;
  value?: string;
  error?: string;
}

const CHECKLIST_ROUTE = "/secure-your-digital-presence";

/* ---------------------------
   Header (aligned with Dashboard)
--------------------------- */
const PageHeader = () => (
  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
    <div>
      <h1 className="text-3xl font-bold">Security Check</h1>
      <p className="text-muted-foreground mt-1">
        Verify phone numbers, emails, and websites.
      </p>
      <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
        <HandshakeIcon className="h-4 w-4 text-primary" />
        We research and partner with industry leaders to provide security at a
        cheaper price — unlocking your digital confidence.
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
);

/* ---------------------------
   Small helpers
--------------------------- */
function getTabIcon(type: LookupType) {
  if (type === "phone") return <Phone className="h-4 w-4" />;
  if (type === "email") return <Mail className="h-4 w-4" />;
  return <Globe className="h-4 w-4" />;
}

const repBadgeClass = (reputation?: string) => {
  const rep = (reputation || "").toLowerCase();
  if (rep === "malicious" || rep === "bad")
    return "bg-red-100 text-red-800 border-red-200";
  if (rep === "suspicious" || rep === "medium")
    return "bg-yellow-100 text-yellow-800 border-yellow-200";
  if (rep === "good" || rep === "clean")
    return "bg-green-100 text-green-800 border-green-200";
  return "bg-gray-100 text-gray-800 border-gray-200";
};

const KV = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex justify-between text-xs">
    <span className="text-gray-600">{label}:</span>
    <span className="ml-2">{value}</span>
  </div>
);

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

/* ---------------------------
   Highlights
--------------------------- */
type Highlight = {
  label: string;
  severity: "bad" | "warn" | "good" | "info";
  icon: React.ReactNode;
};

function severityClass(s: Highlight["severity"]) {
  switch (s) {
    case "bad":
      return "bg-red-50 text-red-700 border-red-200";
    case "warn":
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
    case "good":
      return "bg-green-50 text-green-700 border-green-200";
    default:
      return "bg-blue-50 text-blue-700 border-blue-200";
  }
}

function makeHighlights(payload: any, type: LookupType): Highlight[] {
  const d = payload?.details || {};
  const status = payload?.status as string | undefined;
  const reputation = (payload?.reputation as string | undefined)?.toLowerCase();
  const riskScore =
    payload?.riskScore ??
    d.risk_score ??
    d.fraud_score ??
    d.risk ??
    (typeof d.confidence === "number" ? d.confidence : undefined);

  const H: Highlight[] = [];

  // Universal
  if (status) {
    H.push({
      label: `Status: ${status}`,
      severity:
        status.toLowerCase() === "safe"
          ? "good"
          : status.toLowerCase() === "risky"
            ? "bad"
            : "info",
      icon:
        status.toLowerCase() === "safe" ? (
          <ShieldCheck className="h-4 w-4" />
        ) : status.toLowerCase() === "risky" ? (
          <ShieldAlert className="h-4 w-4" />
        ) : (
          <ShieldQuestion className="h-4 w-4" />
        ),
    });
  }

  if (reputation) {
    H.push({
      label: `Reputation: ${reputation}`,
      severity:
        reputation === "malicious" || reputation === "bad"
          ? "bad"
          : reputation === "suspicious" || reputation === "medium"
            ? "warn"
            : reputation === "good" || reputation === "clean"
              ? "good"
              : "info",
      icon:
        reputation === "malicious" || reputation === "bad" ? (
          <ShieldClose className="h-4 w-4" />
        ) : reputation === "suspicious" || reputation === "medium" ? (
          <SirenIcon className="h-4 w-4" />
        ) : (
          <ShieldCheck className="h-4 w-4" />
        ),
    });
  }

  if (typeof riskScore === "number") {
    H.push({
      label: `Risk: ${riskScore}`,
      severity: riskScore >= 75 ? "bad" : riskScore >= 40 ? "warn" : "good",
      icon: <Shield className="h-4 w-4" />,
    });
  }

  // Phone-specific
  if (type === "phone") {
    if (d.spammer ?? payload?.spammer)
      H.push({
        label: "Spammer: Yes",
        severity: "bad",
        icon: <SirenIcon className="h-4 w-4" />,
      });
    if (d.voip ?? payload?.voip)
      H.push({
        label: "VOIP: Yes",
        severity: "warn",
        icon: <WifiOff className="h-4 w-4" />,
      });
    if (d.recent_abuse ?? payload?.recent_abuse)
      H.push({
        label: "Recent abuse",
        severity: "bad",
        icon: <SirenIcon className="h-4 w-4" />,
      });
    if (d.valid === false || payload?.valid === false)
      H.push({
        label: "Invalid number",
        severity: "warn",
        icon: <ShieldQuestion className="h-4 w-4" />,
      });
    if (d.carrier || payload?.carrier)
      H.push({
        label: `Carrier: ${d.carrier ?? payload?.carrier}`,
        severity: "info",
        icon: <Globe2 className="h-4 w-4" />,
      });
    if (d.country || payload?.country)
      H.push({
        label: `Country: ${d.country ?? payload?.country}`,
        severity: "info",
        icon: <Globe2 className="h-4 w-4" />,
      });
  }

  // Email-specific
  if (type === "email") {
    if (d.leaked ?? payload?.leaked)
      H.push({
        label: "Found in leaks",
        severity: "bad",
        icon: <Database className="h-4 w-4" />,
      });
    if (d.disposable ?? payload?.disposable)
      H.push({
        label: "Disposable address",
        severity: "warn",
        icon: <ScanFace className="h-4 w-4" />,
      });
    if (d.smtp_check === false || payload?.smtp_check === false)
      H.push({
        label: "SMTP check failed",
        severity: "warn",
        icon: <ShieldAlert className="h-4 w-4" />,
      });
    if (d.mx_found === false || payload?.mx_found === false)
      H.push({
        label: "No MX records",
        severity: "warn",
        icon: <ShieldAlert className="h-4 w-4" />,
      });
    if (d.honeypot ?? payload?.honeypot)
      H.push({
        label: "Honeypot flagged",
        severity: "bad",
        icon: <Bot className="h-4 w-4" />,
      });
    if (d.domain || payload?.domain)
      H.push({
        label: `Domain: ${d.domain ?? payload?.domain}`,
        severity: "info",
        icon: <Globe2 className="h-4 w-4" />,
      });
  }

  // URL-specific
  if (type === "url") {
    if (d.phishing ?? payload?.phishing)
      H.push({
        label: "Phishing detected",
        severity: "bad",
        icon: <ShieldClose className="h-4 w-4" />,
      });
    if (d.malware ?? payload?.malware)
      H.push({
        label: "Malware detected",
        severity: "bad",
        icon: <Bug className="h-4 w-4" />,
      });
    if (d.ssl_valid === false || payload?.ssl_valid === false)
      H.push({
        label: "SSL invalid",
        severity: "warn",
        icon: <KeySquare className="h-4 w-4" />,
      });
    const ageDays = d.age_days ?? payload?.age_days;
    if (typeof ageDays === "number") {
      H.push({
        label: `Domain age: ${ageDays}d`,
        severity: ageDays < 30 ? "warn" : "info",
        icon: <Info className="h-4 w-4" />,
      });
    }
    if (d.category || payload?.category)
      H.push({
        label: `Category: ${d.category ?? payload?.category}`,
        severity: "info",
        icon: <Globe2 className="h-4 w-4" />,
      });
  }

  // Sort: bad → warn → good → info
  const rank: Record<Highlight["severity"], number> = {
    bad: 0,
    warn: 1,
    good: 2,
    info: 3,
  };
  H.sort((a, b) => rank[a.severity] - rank[b.severity]);
  return H;
}

function ResultHighlights({
  payload,
  type,
}: {
  payload: any;
  type: LookupType;
}) {
  const highlights = makeHighlights(payload, type);
  if (!highlights.length) return null;
  return (
    <div className="mb-3 flex flex-wrap gap-2">
      {highlights.slice(0, 6).map((h, i) => (
        <span
          key={i}
          className={`inline-flex items-center gap-1 text-xs font-medium border rounded-full px-2 py-1 ${severityClass(
            h.severity,
          )}`}
        >
          {h.icon}
          {h.label}
        </span>
      ))}
    </div>
  );
}

/* ---------------------------
   Overall Verdict (NEW)
--------------------------- */
type VerdictLevel = "good" | "warn" | "bad";
function verdictTone(level: VerdictLevel) {
  if (level === "bad")
    return {
      wrap: "bg-red-50 border-red-200",
      text: "text-red-800",
      icon: <ShieldAlert className="h-5 w-5" />,
    };
  if (level === "warn")
    return {
      wrap: "bg-yellow-50 border-yellow-200",
      text: "text-yellow-800",
      icon: <TriangleAlert className="h-5 w-5" />,
    };
  return {
    wrap: "bg-green-50 border-green-200",
    text: "text-green-800",
    icon: <ShieldCheck className="h-5 w-5" />,
  };
}

function computeVerdict(
  payload: any,
  type: LookupType,
): { level: VerdictLevel; title: string; subtitle: string } {
  const d = payload?.details || {};
  const status = (payload?.status || "").toLowerCase();
  const rep = (payload?.reputation || "").toLowerCase();
  const riskRaw =
    payload?.riskScore ??
    d.risk_score ??
    d.fraud_score ??
    d.risk ??
    (typeof d.confidence === "number" ? d.confidence : undefined);
  const risk = typeof riskRaw === "number" ? clamp(riskRaw, 0, 100) : undefined;

  // Bad signals
  const hasBad =
    rep === "malicious" ||
    status === "risky" ||
    (typeof risk === "number" && risk >= 75) ||
    d.phishing === true ||
    d.malware === true ||
    d.spammer === true ||
    d.honeypot === true ||
    d.recent_abuse === true;

  // Warn signals
  const hasWarn =
    rep === "suspicious" ||
    (typeof risk === "number" && risk >= 40) ||
    d.voip === true ||
    d.ssl_valid === false ||
    (typeof d.age_days === "number" && d.age_days < 30) ||
    d.disposable === true ||
    d.smtp_check === false ||
    d.mx_found === false ||
    payload?.valid === false ||
    d.valid === false;

  // Verdict
  if (hasBad)
    return {
      level: "bad",
      title: "High Risk — proceed with extreme caution",
      subtitle:
        "One or more providers flagged critical issues (e.g., phishing/malware, spammer, breach, or very high risk score).",
    };
  if (hasWarn)
    return {
      level: "warn",
      title: "Caution — mixed or weak signals",
      subtitle:
        "Some providers raised concerns (new domain, VOIP, invalid email checks, or medium risk). Verify before trusting.",
    };
  return {
    level: "good",
    title: "Looks OK — no major risks detected",
    subtitle:
      "Providers did not flag major issues. Still use judgment and avoid sharing sensitive info unless you trust the source.",
  };
}

function VerdictBanner({ payload, type }: { payload: any; type: LookupType }) {
  const v = computeVerdict(payload, type);
  const tone = verdictTone(v.level);
  return (
    <div className={`border rounded-lg p-3 mb-3 ${tone.wrap}`}>
      <div className={`flex items-start gap-2 ${tone.text}`}>
        <div className="mt-0.5">{tone.icon}</div>
        <div>
          <div className="font-semibold text-sm">{v.title}</div>
          <div className="text-xs opacity-90">{v.subtitle}</div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------
   Details (with Verdict + Highlights)
--------------------------- */
function ResultDetails({ payload, type }: { payload: any; type: LookupType }) {
  if (!payload || typeof payload !== "object") {
    return <div className="text-sm text-gray-600">No details available.</div>;
  }

  const details = payload.details || {};
  const status = payload.status;
  const reputation = payload.reputation;
  const riskScore =
    payload.riskScore ??
    details.risk_score ??
    details.fraud_score ??
    details.risk ??
    (typeof details.confidence === "number" ? details.confidence : undefined);

  return (
    <div className="space-y-4">
      {/* Overall verdict */}
      <VerdictBanner payload={payload} type={type} />

      {/* Highlights strip */}
      <ResultHighlights payload={payload} type={type} />

      {/* Signals panel */}
      <div className="border rounded-lg p-3 bg-gray-50">
        <h4 className="font-semibold text-sm text-gray-700 mb-2">
          Overall Signals
        </h4>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            className={
              status === "safe"
                ? "bg-green-100 text-green-800"
                : status === "risky"
                  ? "bg-red-100 text-red-800"
                  : "bg-gray-100 text-gray-800"
            }
          >
            {status || "Unknown"}
          </Badge>
          {reputation && reputation !== "unknown" && (
            <Badge className={repBadgeClass(reputation)}>{reputation}</Badge>
          )}
          {typeof riskScore === "number" && (
            <Badge variant="outline">Risk: {riskScore}</Badge>
          )}
        </div>
      </div>

      {/* Detail grid */}
      <div className="border rounded-lg p-3 bg-gray-50">
        <h4 className="font-semibold text-xs text-gray-700 mb-2">
          Security Details
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {/* Common */}
          {("valid" in details || "valid" in payload) && (
            <KV
              label="Valid"
              value={
                (details.valid ?? payload.valid) ? (
                  <span className="text-green-600">✓</span>
                ) : (
                  <span className="text-red-600">✗</span>
                )
              }
            />
          )}
          {("country" in details || "country" in payload) && (
            <KV label="Country" value={details.country ?? payload.country} />
          )}
          {("recent_abuse" in details || "recent_abuse" in payload) && (
            <KV
              label="Recent abuse"
              value={
                (details.recent_abuse ?? payload.recent_abuse) ? "🚨" : "No"
              }
            />
          )}
          {("proxy" in details || "proxy" in payload) && (
            <KV
              label="Proxy"
              value={(details.proxy ?? payload.proxy) ? "Yes" : "No"}
            />
          )}
          {("bot_status" in details || "bot_status" in payload) && (
            <KV
              label="Bot"
              value={(details.bot_status ?? payload.bot_status) ? "Yes" : "No"}
            />
          )}
          {("leaked" in details || "leaked" in payload) && (
            <KV
              label="Leaked"
              value={(details.leaked ?? payload.leaked) ? "🔓" : "No"}
            />
          )}

          {/* Phone */}
          {type === "phone" && (
            <>
              {("carrier" in details || "carrier" in payload) && (
                <KV
                  label="Carrier"
                  value={details.carrier ?? payload.carrier}
                />
              )}
              {("mobile" in details || "mobile" in payload) && (
                <KV
                  label="Mobile"
                  value={(details.mobile ?? payload.mobile) ? "Yes" : "No"}
                />
              )}
              {("voip" in details || "voip" in payload) && (
                <KV
                  label="VOIP"
                  value={(details.voip ?? payload.voip) ? "⚠️" : "No"}
                />
              )}
              {("active" in details || "active" in payload) && (
                <KV
                  label="Active"
                  value={
                    (details.active ?? payload.active) !== false ? "Yes" : "No"
                  }
                />
              )}
              {("spammer" in details || "spammer" in payload) && (
                <KV
                  label="Spammer"
                  value={(details.spammer ?? payload.spammer) ? "🚨" : "No"}
                />
              )}
            </>
          )}

          {/* Email */}
          {type === "email" && (
            <>
              {("domain" in details || "domain" in payload) && (
                <KV label="Domain" value={details.domain ?? payload.domain} />
              )}
              {("disposable" in details || "disposable" in payload) && (
                <KV
                  label="Disposable"
                  value={
                    (details.disposable ?? payload.disposable) ? "Yes" : "No"
                  }
                />
              )}
              {("mx_found" in details || "mx_found" in payload) && (
                <KV
                  label="MX Records"
                  value={(details.mx_found ?? payload.mx_found) ? "Yes" : "No"}
                />
              )}
              {("smtp_check" in details || "smtp_check" in payload) && (
                <KV
                  label="SMTP Check"
                  value={
                    (details.smtp_check ?? payload.smtp_check) ? "Pass" : "Fail"
                  }
                />
              )}
              {("honeypot" in details || "honeypot" in payload) && (
                <KV
                  label="Honeypot"
                  value={(details.honeypot ?? payload.honeypot) ? "Yes" : "No"}
                />
              )}
            </>
          )}

          {/* URL */}
          {type === "url" && (
            <>
              {("domain" in details || "domain" in payload) && (
                <KV label="Domain" value={details.domain ?? payload.domain} />
              )}
              {("category" in details || "category" in payload) && (
                <KV
                  label="Category"
                  value={details.category ?? payload.category}
                />
              )}
              {("phishing" in details || "phishing" in payload) && (
                <KV
                  label="Phishing"
                  value={(details.phishing ?? payload.phishing) ? "🚨" : "No"}
                />
              )}
              {("malware" in details || "malware" in payload) && (
                <KV
                  label="Malware"
                  value={(details.malware ?? payload.malware) ? "🚨" : "No"}
                />
              )}
              {("age_days" in details || "age_days" in payload) && (
                <KV
                  label="Age (days)"
                  value={details.age_days ?? payload.age_days}
                />
              )}
              {("ssl_valid" in details || "ssl_valid" in payload) && (
                <KV
                  label="SSL Valid"
                  value={
                    (details.ssl_valid ?? payload.ssl_valid) ? "Yes" : "No"
                  }
                />
              )}
            </>
          )}
        </div>

        {/* Raw JSON */}
        <details className="mt-3">
          <summary className="text-xs text-gray-600 cursor-pointer">
            Raw data
          </summary>
          <pre className="mt-2 max-h-64 overflow-auto rounded bg-white p-2 text-[10px] border">
            {JSON.stringify(payload, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}

function ResultCard({ r, type }: { r: LookupResult; type: LookupType }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            {r.success ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            {r.apiName} Results
          </span>
          {typeof r.responseTime === "number" && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {r.responseTime}ms
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {r.success ? (
          <ResultDetails payload={r.data} type={type} />
        ) : (
          <div className="text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Service Unavailable</span>
            </div>
            <p className="text-sm">
              {r.error?.includes("API")
                ? "The security service is temporarily unavailable. Please try again later."
                : r.error || "Unable to complete security check at this time."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------------------------
   Page
--------------------------- */
export default function ScamLookup() {
  // Auth (hooks must always run)
  const { user } = useAuth();
  const isAuthed = !!user;

  // Inputs + state
  const [activeTab, setActiveTab] = useState<LookupType>("phone");
  const [values, setValues] = useState<Record<LookupType, string>>({
    phone: "",
    email: "",
    url: "",
  });
  const [results, setResults] = useState<Record<string, LookupResult>>({});
  const bootstrapped = useRef(false);

  // Configs
  const {
    data: apiConfigs = [],
    isLoading: isLoadingConfigs,
    isError: isConfigsError,
    error: configsError,
  } = useQuery<ApiConfig[]>({
    queryKey: ["/api/api-configs/public"],
    queryFn: async () => {
      const res = await apiRequest("/api/api-configs/public");
      if (!res.ok) throw new Error(`Configs failed: ${res.status}`);
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const availableTypes = useMemo<LookupType[]>(
    () =>
      Array.from(
        new Set(
          (apiConfigs || [])
            .filter((c) => c.enabled)
            .map((c) => c.type as LookupType),
        ),
      ),
    [apiConfigs],
  );

  useEffect(() => {
    if (availableTypes.length && !availableTypes.includes(activeTab)) {
      setActiveTab(availableTypes[0]);
    }
  }, [availableTypes, activeTab]);

  // Lookup mutation
  const lookupMutation = useMutation<
    LookupResponse,
    Error,
    { type: LookupType; value: string }
  >({
    mutationFn: async ({ type, value }) => {
      const response = await apiRequest("/api/scam-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, value }),
      });
      return response.json();
    },
    onSuccess: (data, vars) => {
      if (data.success && Array.isArray(data.results)) {
        const merged: Record<string, LookupResult> = {};
        data.results.forEach((r, i) => {
          const name = (r.apiName || "unknown").replace(/[^a-zA-Z0-9]/g, "_");
          merged[`${vars.type}_${name}_${i}`] = r;
        });
        setResults((prev) => ({ ...prev, ...merged }));
      } else {
        setResults((prev) => ({
          ...prev,
          [vars.type]: {
            success: false,
            error: data.error || "Lookup failed",
            apiName: "System",
          },
        }));
      }
    },
    onError: (err, vars) => {
      setResults((prev) => ({
        ...prev,
        [vars.type]: {
          success: false,
          error: err instanceof Error ? err.message : "Network error",
          apiName: "System",
        },
      }));
    },
  });

  // Helpers
  const normalizers: Record<LookupType, (s: string) => string> = {
    phone: (s) => s.replace(/[^\d+]/g, ""),
    email: (s) => s.trim().toLowerCase(),
    url: (s) => s.trim(),
  };

  const handleLookup = (type: LookupType) => {
    const raw = values[type];
    const v = normalizers[type](raw);
    if (!v) return;

    const hasProvider = apiConfigs.some((c) => c.enabled && c.type === type);
    if (!hasProvider) {
      setResults((prev) => ({
        ...prev,
        [type]: {
          success: false,
          error: `No ${type} lookup services are currently available`,
          apiName: "System",
        },
      }));
      return;
    }

    // Clear previous results for this type
    setResults((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach(
        (k) => k.startsWith(`${type}_`) && delete next[k],
      );
      return next;
    });

    lookupMutation.mutate({ type, value: v });
  };

  // Bootstrap from URL (?type, ?q)
  useEffect(() => {
    if (bootstrapped.current || isLoadingConfigs) return;

    const usp = new URLSearchParams(window.location.search);
    const rawType = (usp.get("type") || "").toLowerCase() as LookupType;
    const rawQ = usp.get("q") || usp.get("query") || usp.get("value") || "";

    const typeFromUrl: LookupType =
      rawType === "phone" || rawType === "email" || rawType === "url"
        ? rawType
        : availableTypes[0] || "phone";

    const finalType = availableTypes.includes(typeFromUrl)
      ? typeFromUrl
      : availableTypes[0];
    if (!finalType) return;

    setActiveTab(finalType);
    if (rawQ) {
      setValues((v) => ({ ...v, [finalType]: rawQ }));
      if (isAuthed) setTimeout(() => handleLookup(finalType), 0);
    }
    bootstrapped.current = true;
  }, [isLoadingConfigs, availableTypes, isAuthed]);

  /* ---------------------------
     UI
  --------------------------- */
  if (isLoadingConfigs)
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2" />
        <p>Loading available services...</p>
      </div>
    );

  if (isConfigsError)
    return (
      <Card>
        <CardContent className="text-center py-8">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
          <h3 className="text-lg font-medium mb-2">Failed to load services</h3>
          <p className="text-muted-foreground text-sm">
            {(configsError as Error)?.message || "Unknown error"}
          </p>
        </CardContent>
      </Card>
    );

  if (!availableTypes.length)
    return (
      <Card>
        <CardContent className="text-center py-8">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium mb-2">No Services Available</h3>
          <p className="text-muted-foreground">
            Scam lookup services are being configured. Please check back later.
          </p>
        </CardContent>
      </Card>
    );

  const TABS: Array<{ type: LookupType; label: string; placeholder: string }> =
    [
      {
        type: "phone",
        label: "Phone",
        placeholder: "Enter phone (e.g., +123...)",
      },
      { type: "email", label: "Email", placeholder: "Enter email address" },
      { type: "url", label: "Website", placeholder: "Enter website URL" },
    ].filter((t) => availableTypes.includes(t.type));

  return (
    <div className="space-y-6">
      <PageHeader />

      {/* Login CTA (do not early-return) */}
      {!isAuthed && (
        <div className="max-w-md">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-2xl font-bold">
                Login Required
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600">
                You need to be logged in to access the scam lookup feature.
              </p>
              <p className="text-sm text-gray-500">
                This service is available exclusively to registered users to
                ensure quality and prevent abuse.
              </p>
              <div className="flex gap-3 justify-center">
                <Link
                  to={`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`}
                >
                  <Button className="flex items-center gap-2">
                    <LogIn className="w-4 h-4" />
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="outline" className="flex items-center gap-2">
                    Sign Up
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as LookupType)}
      >
        <TabsList
          className="grid w-full h-10 mb-4"
          style={{ gridTemplateColumns: `repeat(${TABS.length}, 1fr)` }}
        >
          {TABS.map((t) => (
            <TabsTrigger
              key={t.type}
              value={t.type}
              className="flex items-center gap-1 h-8 text-sm font-medium"
            >
              {getTabIcon(t.type)}
              <span className="hidden sm:inline">{t.label}</span>
              <span className="sm:hidden">
                {t.label === "Website" ? "Web" : t.label.slice(0, 2)}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map((t) => {
          const type = t.type;
          return (
            <TabsContent key={type} value={type} className="space-y-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder={t.placeholder}
                      value={values[type]}
                      disabled={!isAuthed}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, [type]: e.target.value }))
                      }
                      onKeyDown={(e) => e.key === "Enter" && handleLookup(type)}
                      className="text-sm"
                    />
                    <Button
                      onClick={() => handleLookup(type)}
                      disabled={lookupMutation.isPending || !isAuthed}
                      size="sm"
                      className="px-4"
                    >
                      {lookupMutation.isPending
                        ? "Checking..."
                        : isAuthed
                          ? "Check"
                          : "Login to Check"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {Object.entries(results)
                .filter(([k]) => k.startsWith(`${type}_`))
                .map(([k, r]) => (
                  <ResultCard key={k} r={r} type={type} />
                ))}
            </TabsContent>
          );
        })}
      </Tabs>

      <div className="mt-4">
        <Separator className="mb-4" />
        <div className="max-w-2xl space-y-2">
          <p className="text-sm text-muted-foreground">
            Our security checks use trusted third-party services to analyze
            phone numbers, emails, and websites. Results are for informational
            purposes only and should not be the sole basis for important
            decisions.
          </p>
          <p className="text-xs text-muted-foreground">
            Your privacy is protected — we do not store what you check, and
            sensitive API credentials are never exposed.
          </p>
        </div>
      </div>
    </div>
  );
}
