// src/pages/ScamLookup.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  ArrowRight as ArrowRightIcon,
  CheckCircle,
  Clock,
  Globe,
  Globe2,
  Info,
  KeySquare,
  Link as LinkIcon,
  Loader2,
  Mail,
  Phone,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldClose,
  ShieldQuestion,
  Siren as SirenIcon,
  TriangleAlert,
  WifiOff,
  Bot,
  Bug,
  Database,
  ScanFace,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "wouter";

/* ---------------------------
   Types
--------------------------- */
type LookupType = "phone" | "email" | "url";

type ApiConfig = {
  id: number;
  name?: string;
  type: LookupType | string;
  enabled?: boolean;
  isActive?: boolean;
  organizationName?: string;
};

type LookupResult = {
  success: boolean;
  data?: any;
  error?: string;
  apiName?: string;
  name?: string;
  provider?: string;
  responseTime?: number;
  apiId?: number;
  message?: string;
  organizationName?: string;
};

type LookupResponse = {
  success: boolean;
  results?: LookupResult[];
  totalApis?: number;
  type?: LookupType | string;
  value?: string;
  error?: string;
};

const CHECKLIST_ROUTE = "/secure-your-digital-presence";

/* ---------------------------
   Auth-gated redirect (prevents loops)
--------------------------- */
function useAuthGate() {
  const auth = useAuth() as any;
  const user = auth?.user ?? auth?.currentUser ?? null;
  const isAuthed = !!user;
  const authLoading = auth?.loading ?? auth?.isLoading ?? false;

  const [authGateReady, setAuthGateReady] = useState(false);
  useEffect(() => {
    if (authLoading) return;
    const t = setTimeout(() => setAuthGateReady(true), 300);
    return () => clearTimeout(t);
  }, [authLoading]);

  useEffect(() => {
    if (!authGateReady) return;
    if (!isAuthed) {
      const next = window.location.pathname + window.location.search;
      window.location.replace(`/login?next=${encodeURIComponent(next)}`);
    }
  }, [authGateReady, isAuthed]);

  return { isAuthed, authGateReady };
}

/* ---------------------------
   Helpers for tolerant UI
--------------------------- */
function serviceDisplayName(r: LookupResult): string {
  return (
    r.apiName ||
    r.name ||
    r.provider ||
    (r.data && (r.data.provider || r.data.name)) ||
    "Service"
  );
}

function getTabIcon(type: LookupType) {
  if (type === "phone") return <Phone className="h-4 w-4" />;
  if (type === "email") return <Mail className="h-4 w-4" />;
  return <Globe className="h-4 w-4" />;
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

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

function computeVerdict(payload: any, type: LookupType): {
  level: VerdictLevel;
  title: string;
  subtitle: string;
} {
  if (!payload || typeof payload !== "object") {
    return {
      level: "info" as any,
      title: "No structured signals available",
      subtitle: "The provider did not return standard risk fields.",
    };
  }

  const d = payload.details || {};
  const status = (payload.status || "").toLowerCase();
  const rep = (payload.reputation || "").toLowerCase();
  const riskRaw =
    payload.riskScore ??
    d.risk_score ??
    d.fraud_score ??
    d.risk ??
    (typeof d.confidence === "number" ? d.confidence : undefined);
  const risk = typeof riskRaw === "number" ? clamp(riskRaw, 0, 100) : undefined;

  const hasBad =
    rep === "malicious" ||
    status === "risky" ||
    (typeof risk === "number" && risk >= 75) ||
    d.phishing === true ||
    d.malware === true ||
    d.spammer === true ||
    d.honeypot === true ||
    d.recent_abuse === true;

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

  if (hasBad)
    return {
      level: "bad",
      title: "High Risk — proceed with extreme caution",
      subtitle:
        "One or more providers flagged critical issues (phishing/malware, spam, breach, or a high risk score).",
    };
  if (hasWarn)
    return {
      level: "warn",
      title: "Caution — mixed or weak signals",
      subtitle:
        "Some providers raised concerns (new domain, VOIP, invalid checks, or medium risk). Verify before trusting.",
    };

  // If nothing matched, give a gentle message
  return {
    level: "good",
    title: "Looks OK — no major risks detected",
    subtitle:
      "No major red flags were found. Still use judgment before sharing sensitive info.",
  };
}

function BadgeRow({
  status,
  reputation,
  riskScore,
}: {
  status?: string;
  reputation?: string;
  riskScore?: number;
}) {
  const rep = (reputation || "").toLowerCase();
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {status && (
        <Badge
          className={
            status.toLowerCase() === "safe"
              ? "bg-green-100 text-green-800"
              : status.toLowerCase() === "risky"
                ? "bg-red-100 text-red-800"
                : "bg-gray-100 text-gray-800"
          }
        >
          {status}
        </Badge>
      )}
      {reputation && (
        <Badge
          className={
            rep === "malicious" || rep === "bad"
              ? "bg-red-100 text-red-800"
              : rep === "suspicious" || rep === "medium"
                ? "bg-yellow-100 text-yellow-800"
                : rep === "good" || rep === "clean"
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
          }
        >
          {reputation}
        </Badge>
      )}
      {typeof riskScore === "number" && (
        <Badge variant="outline">Risk: {riskScore}</Badge>
      )}
    </div>
  );
}

/* ---------------------------
   Result cards (tolerant)
--------------------------- */
function ResultDetails({ payload, type }: { payload: any; type: LookupType }) {
  if (!payload || typeof payload !== "object") {
    return (
      <div className="text-sm text-gray-600">
        No structured details returned by this provider.
      </div>
    );
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

  const v = computeVerdict(payload, type);
  const tone = verdictTone(v.level);

  return (
    <div className="space-y-4">
      <div className={`border rounded-lg p-3 ${tone.wrap}`}>
        <div className={`flex items-start gap-2 ${tone.text}`}>
          <div className="mt-0.5">{tone.icon}</div>
          <div>
            <div className="font-semibold text-sm">{v.title}</div>
            <div className="text-xs opacity-90">{v.subtitle}</div>
          </div>
        </div>
      </div>

      {(status || reputation || typeof riskScore === "number") && (
        <div className="border rounded-lg p-3 bg-gray-50">
          <h4 className="font-semibold text-sm text-gray-700 mb-2">
            Overall Signals
          </h4>
          <BadgeRow
            status={status}
            reputation={reputation}
            riskScore={
              typeof riskScore === "number" ? clamp(riskScore, 0, 100) : undefined
            }
          />
        </div>
      )}

      {/* Raw section always available for transparency */}
      <div className="border rounded-lg p-3 bg-gray-50">
        <h4 className="font-semibold text-xs text-gray-700 mb-2">Raw data</h4>
        <pre className="mt-2 max-h-64 overflow-auto rounded bg-white p-2 text-[10px] border">
          {JSON.stringify(payload, null, 2)}
        </pre>
      </div>
    </div>
  );
}

function ResultCard({
  r,
  type,
}: {
  r: LookupResult;
  type: LookupType;
}): JSX.Element {
  const title = `${serviceDisplayName(r)} Results`;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            {r.success ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
            {title}
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
        {r.organizationName && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-md text-xs text-blue-800">
            <p className="font-semibold mb-1">Data Source Disclaimer:</p>
            <p>
              This data is provided by <strong>{r.organizationName}</strong>.
              BeAware is a facilitator and is not responsible for the accuracy
              or content of this data.
            </p>
          </div>
        )}
        {r.success ? (
          <ResultDetails payload={r.data ?? { message: r.message }} type={type} />
        ) : (
          <div className="text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Lookup Failed</span>
            </div>
            <p className="text-sm">
              {r.error || r.message || "Unable to complete security check."}
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
  const { isAuthed, authGateReady } = useAuthGate();

  // Inputs
  const [activeTab, setActiveTab] = useState<LookupType>("phone");
  const [values, setValues] = useState<Record<LookupType, string>>({
    phone: "",
    email: "",
    url: "",
  });

  // Results are kept **per type** and replaced on each lookup
  const [resultsByType, setResultsByType] = useState<
    Partial<Record<LookupType, LookupResult[]>>
  >({});

  const bootstrapped = useRef(false);

  // Load available services (only authed)
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
    enabled: isAuthed,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  const availableTypes = useMemo<LookupType[]>(() => {
    const set = new Set<LookupType>();
    for (const c of apiConfigs || []) {
      const enabled = (c.enabled ?? true) && (c.isActive ?? true);
      const t = String(c.type || "").toLowerCase() as LookupType;
      if (enabled && (t === "phone" || t === "email" || t === "url")) {
        set.add(t);
      }
    }
    if (!set.size) return ["phone", "url"]; // reasonable default
    return Array.from(set);
  }, [apiConfigs]);

  // Align active tab with available types
  useEffect(() => {
    if (!availableTypes.length) return;
    if (!availableTypes.includes(activeTab)) {
      setActiveTab(availableTypes[0]);
    }
  }, [availableTypes, activeTab]);

  // Mutation (tolerant of backend response shapes)
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
      if (data?.success && Array.isArray(data.results)) {
        setResultsByType((prev) => ({
          ...prev,
          [vars.type]: data.results as LookupResult[],
        }));
      } else {
        setResultsByType((prev) => ({
          ...prev,
          [vars.type]: [
            {
              success: false,
              error: data?.error || "Lookup failed",
              apiName: "System",
            },
          ],
        }));
      }
    },
    onError: (err, vars) => {
      setResultsByType((prev) => ({
        ...prev,
        [vars.type]: [
          {
            success: false,
            error: err instanceof Error ? err.message : "Network error",
            apiName: "System",
          },
        ],
      }));
    },
  });

  // Input normalizers
  const normalizers: Record<LookupType, (s: string) => string> = {
    phone: (s) => s.replace(/[^\d+]/g, ""),
    email: (s) => s.trim().toLowerCase(),
    url: (s) => s.trim(),
  };

  const handleLookup = (type: LookupType) => {
    const v = normalizers[type](values[type]);
    if (!v) return;
    lookupMutation.mutate({ type, value: v });
  };

  // Bootstrap from URL (?type=&q=) — only after auth + configs
  useEffect(() => {
    if (!authGateReady || !isAuthed) return;
    if (bootstrapped.current || isLoadingConfigs) return;

    const usp = new URLSearchParams(window.location.search);
    const rawType = (usp.get("type") || "").toLowerCase();
    const rawQ = usp.get("q") || usp.get("query") || usp.get("value") || "";

    const typeFromUrl =
      rawType === "phone" || rawType === "email" || rawType === "url"
        ? (rawType as LookupType)
        : availableTypes[0] || "phone";

    const finalType = availableTypes.includes(typeFromUrl)
      ? typeFromUrl
      : availableTypes[0];

    if (finalType) {
      setActiveTab(finalType);
      if (rawQ) {
        setValues((v) => ({ ...v, [finalType]: rawQ }));
        setTimeout(() => handleLookup(finalType), 0);
      }
    }
    bootstrapped.current = true;
  }, [authGateReady, isAuthed, isLoadingConfigs, availableTypes]);

  /* ---------------------------
     Render guards
  --------------------------- */
  if (!authGateReady) {
    return (
      <div className="p-6 flex items-center gap-2 text-sm text-slate-600">
        <Loader2 className="h-4 w-4 animate-spin" />
        Initializing…
      </div>
    );
  }
  if (!isAuthed) return null;

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
      { type: "phone", label: "Phone", placeholder: "e.g., +1 (555) 123-4567" },
      { type: "email", label: "Email", placeholder: "Enter email address" },
      { type: "url", label: "Website", placeholder: "Paste a URL" },
    ].filter((t) => availableTypes.includes(t.type));

  const currentResults = resultsByType[activeTab] || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Scam Lookup</h1>
          <p className="text-muted-foreground mt-1">
            Verify phone numbers, emails, and websites with trusted providers.
          </p>
          <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
            We partner with industry leaders to unlock your digital confidence.
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link href={CHECKLIST_ROUTE}>
            <Button className="gap-1">
              Open Security Checklist
              <ArrowRightIcon className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as LookupType)}>
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
                      onChange={(e) =>
                        setValues((v) => ({ ...v, [type]: e.target.value }))
                      }
                      onKeyDown={(e) => e.key === "Enter" && handleLookup(type)}
                      className="text-sm"
                    />
                    <Button
                      onClick={() => handleLookup(type)}
                      disabled={lookupMutation.isPending}
                      size="sm"
                      className="px-4"
                    >
                      {lookupMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Results */}
              {currentResults.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  Enter a {type} and click Check to see results here.
                </div>
              )}

              {currentResults.map((r, i) => (
                <ResultCard key={`${type}_${i}`} r={r} type={type} />
              ))}
            </TabsContent>
          );
        })}
      </Tabs>

      <div className="mt-4">
        <Separator className="mb-4" />
        <div className="max-w-2xl space-y-2">
          <p className="text-sm text-muted-foreground">
            Results are for informational purposes only. Always use judgment
            before sharing sensitive information or making important decisions.
          </p>
          <p className="text-xs text-muted-foreground">
            We don’t store what you check, and API credentials are protected.
          </p>
        </div>
      </div>
    </div>
  );
}
