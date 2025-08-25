// src/pages/ScamLookup.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  Search,
  Shield,
  Phone,
  Mail,
  Globe,
  Clock,
  CheckCircle,
  XCircle,
  Lock,
  LogIn,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "wouter";

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

export default function ScamLookup() {
  // Auth state (do NOT early return; hooks must always run)
  const { user } = useAuth();
  const isAuthed = !!user;

  // UI state
  const [phoneNumber, setPhoneNumber] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [website, setWebsite] = useState("");
  const [activeTab, setActiveTab] = useState<LookupType>("phone");
  const [results, setResults] = useState<Record<string, LookupResult>>({});

  // Track whether we've already executed a query-initiated search
  const bootstrappedFromQueryRef = useRef(false);

  // --- Queries (always top-level, never conditional) ---
  const {
    data: apiConfigs = [],
    isLoading: isLoadingConfigs,
    isError: isConfigsError,
    error: configsError,
  } = useQuery<ApiConfig[]>({
    queryKey: ["/api/api-configs/public"],
    queryFn: async () => {
      const response = await apiRequest("/api/api-configs/public");
      if (!response.ok) throw new Error(`Configs failed: ${response.status}`);
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  // Compute available, enabled types
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

  // Ensure active tab is valid once configs load
  useEffect(() => {
    if (availableTypes.length && !availableTypes.includes(activeTab)) {
      setActiveTab(availableTypes[0]);
    }
  }, [availableTypes, activeTab]);

  // --- Mutation for lookups ---
  const lookupMutation = useMutation<
    LookupResponse,
    Error,
    { type: LookupType; value: string }
  >({
    mutationFn: async ({ type, value }) => {
      try {
        const response = await apiRequest("/api/scam-lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, value }),
        });
        return response.json();
      } catch (error) {
        // Surface validation errors that come back as "400: {json}"
        if (error instanceof Error && error.message.includes("400:")) {
          const errorText = error.message.replace("400: ", "");
          try {
            const errorData = JSON.parse(errorText);
            return {
              success: false,
              error: errorData.error || "Request validation failed",
            };
          } catch {
            return { success: false, error: errorText || "Invalid request" };
          }
        }
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      if (data.success && Array.isArray(data.results)) {
        const newResults: Record<string, LookupResult> = {};
        data.results.forEach((result, index) => {
          const cleanApiName = (result.apiName || "unknown").replace(
            /[^a-zA-Z0-9]/g,
            "_",
          );
          const resultKey = `${variables.type}_${cleanApiName}_${index}`;
          newResults[resultKey] = result;
        });
        setResults((prev) => ({ ...prev, ...newResults }));
      } else {
        setResults((prev) => ({
          ...prev,
          [variables.type]: {
            success: false,
            error: data.error || "Lookup failed",
            apiName: "System",
          },
        }));
      }
    },
    onError: (error, variables) => {
      setResults((prev) => ({
        ...prev,
        [variables.type]: {
          success: false,
          error:
            error instanceof Error ? error.message : "Network error occurred",
          apiName: "System",
        },
      }));
    },
  });

  // --- Helpers ---
  const getTabIcon = (type: LookupType) => {
    switch (type) {
      case "phone":
        return <Phone className="h-4 w-4" />;
      case "email":
        return <Mail className="h-4 w-4" />;
      case "url":
        return <Globe className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  const normalizePhone = (raw: string) => raw.replace(/[^\d+]/g, "");
  const normalizeUrl = (raw: string) => raw.trim();
  const normalizeEmail = (raw: string) => raw.trim().toLowerCase();

  const handleLookup = (type: LookupType, value: string) => {
    const v =
      type === "phone"
        ? normalizePhone(value)
        : type === "url"
          ? normalizeUrl(value)
          : normalizeEmail(value);
    if (!v) return;

    const relevantConfigs = apiConfigs.filter(
      (c) => c.enabled && c.type === type,
    );
    if (!relevantConfigs.length) {
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
        (key) => key.startsWith(`${type}_`) && delete next[key],
      );
      return next;
    });

    lookupMutation.mutate({ type, value: v });
  };

  const getReputationBadge = (reputation?: string) => {
    const rep = (reputation || "").toLowerCase();
    if (rep === "malicious" || rep === "bad")
      return "bg-red-100 text-red-800 border-red-200";
    if (rep === "suspicious" || rep === "medium")
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    if (rep === "good" || rep === "clean")
      return "bg-green-100 text-green-800 border-green-200";
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  const formatKV = (label: string, value: React.ReactNode) => (
    <div className="flex justify-between">
      <span className="text-gray-600">{label}:</span>
      <span className="ml-2">{value}</span>
    </div>
  );

  const formatResult = (result: any, type: LookupType) => {
    if (!result || typeof result !== "object") {
      return (
        <div className="text-sm text-gray-600">
          No detailed information available.
        </div>
      );
    }

    const details = result.details || {};
    const status = result.status;
    const reputation = result.reputation;
    const riskScore =
      result.riskScore ??
      details.risk_score ??
      details.fraud_score ??
      details.risk ??
      (typeof details.confidence === "number" ? details.confidence : undefined);

    return (
      <div className="space-y-4">
        {/* Status */}
        <div className="border rounded-lg p-3 bg-gray-50">
          <h4 className="font-semibold text-sm text-gray-700 mb-2">
            Security Status
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
              <Badge className={getReputationBadge(reputation)}>
                {String(reputation).replace(/^\w/, (c: string) =>
                  c.toUpperCase(),
                )}
              </Badge>
            )}
            {typeof riskScore === "number" && (
              <Badge variant="outline">Risk: {riskScore}</Badge>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="border rounded-lg p-3 bg-gray-50">
          <h4 className="font-semibold text-xs text-gray-700 mb-2">
            Security Details
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            {/* Common */}
            {("valid" in details || "valid" in result) &&
              formatKV(
                "Valid",
                (details.valid ?? result.valid) ? (
                  <span className="text-green-600">✓</span>
                ) : (
                  <span className="text-red-600">✗</span>
                ),
              )}
            {("country" in details || "country" in result) &&
              formatKV("Country", details.country ?? result.country)}
            {("recent_abuse" in details || "recent_abuse" in result) &&
              formatKV(
                "Abuse",
                (details.recent_abuse ?? result.recent_abuse) ? (
                  <span className="text-red-600">🚨</span>
                ) : (
                  "None"
                ),
              )}
            {("proxy" in details || "proxy" in result) &&
              formatKV("Proxy", (details.proxy ?? result.proxy) ? "Yes" : "No")}
            {("bot_status" in details || "bot_status" in result) &&
              formatKV(
                "Bot",
                (details.bot_status ?? result.bot_status) ? "Yes" : "No",
              )}
            {("leaked" in details || "leaked" in result) &&
              formatKV(
                "Leaked",
                (details.leaked ?? result.leaked) ? (
                  <span className="text-red-600">🔓</span>
                ) : (
                  "No"
                ),
              )}

            {/* Phone-specific */}
            {type === "phone" && (
              <>
                {("carrier" in details || "carrier" in result) &&
                  formatKV("Carrier", details.carrier ?? result.carrier)}
                {("mobile" in details || "mobile" in result) &&
                  formatKV(
                    "Mobile",
                    (details.mobile ?? result.mobile) ? "Yes" : "No",
                  )}
                {("voip" in details || "voip" in result) &&
                  formatKV(
                    "VOIP",
                    (details.voip ?? result.voip) ? (
                      <span className="text-orange-600">⚠️</span>
                    ) : (
                      "No"
                    ),
                  )}
                {("active" in details || "active" in result) &&
                  formatKV(
                    "Active",
                    (details.active ?? result.active) !== false ? "Yes" : "No",
                  )}
                {("spammer" in details || "spammer" in result) &&
                  formatKV(
                    "Spammer",
                    (details.spammer ?? result.spammer) ? (
                      <span className="text-red-600">🚨</span>
                    ) : (
                      "No"
                    ),
                  )}
              </>
            )}

            {/* Email-specific */}
            {type === "email" && (
              <>
                {("domain" in details || "domain" in result) &&
                  formatKV("Domain", details.domain ?? result.domain)}
                {("disposable" in details || "disposable" in result) &&
                  formatKV(
                    "Disposable",
                    (details.disposable ?? result.disposable) ? "Yes" : "No",
                  )}
                {("mx_found" in details || "mx_found" in result) &&
                  formatKV(
                    "MX Records",
                    (details.mx_found ?? result.mx_found) ? "Yes" : "No",
                  )}
                {("smtp_check" in details || "smtp_check" in result) &&
                  formatKV(
                    "SMTP Check",
                    (details.smtp_check ?? result.smtp_check) ? "Pass" : "Fail",
                  )}
                {("honeypot" in details || "honeypot" in result) &&
                  formatKV(
                    "Honeypot",
                    (details.honeypot ?? result.honeypot) ? "Yes" : "No",
                  )}
              </>
            )}

            {/* URL-specific */}
            {type === "url" && (
              <>
                {("domain" in details || "domain" in result) &&
                  formatKV("Domain", details.domain ?? result.domain)}
                {("category" in details || "category" in result) &&
                  formatKV("Category", details.category ?? result.category)}
                {("phishing" in details || "phishing" in result) &&
                  formatKV(
                    "Phishing",
                    (details.phishing ?? result.phishing) ? (
                      <span className="text-red-600">🚨</span>
                    ) : (
                      "No"
                    ),
                  )}
                {("malware" in details || "malware" in result) &&
                  formatKV(
                    "Malware",
                    (details.malware ?? result.malware) ? (
                      <span className="text-red-600">🚨</span>
                    ) : (
                      "No"
                    ),
                  )}
                {("age_days" in details || "age_days" in result) &&
                  formatKV("Age (days)", details.age_days ?? result.age_days)}
                {("ssl_valid" in details || "ssl_valid" in result) &&
                  formatKV(
                    "SSL Valid",
                    (details.ssl_valid ?? result.ssl_valid) ? "Yes" : "No",
                  )}
              </>
            )}
          </div>

          {/* Raw JSON (collapsible) */}
          <details className="mt-3">
            <summary className="text-xs text-gray-600 cursor-pointer">
              Raw data
            </summary>
            <pre className="mt-2 max-h-64 overflow-auto rounded bg-white p-2 text-[10px] border">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    );
  };

  /* ============================
     Bootstrap from URL (?type, ?q)
     - Runs once after configs load
     - Prefills the right input
     - Automatically triggers search
  ============================ */
  useEffect(() => {
    if (bootstrappedFromQueryRef.current) return;
    if (isLoadingConfigs) return;

    const usp = new URLSearchParams(window.location.search);
    const rawType = (usp.get("type") || "").toLowerCase() as LookupType;
    const rawQ =
      usp.get("q") ??
      usp.get("query") ?? // tolerate alternate name
      usp.get("value") ??
      "";

    const typeFromUrl: LookupType =
      rawType === "phone" || rawType === "email" || rawType === "url"
        ? rawType
        : availableTypes[0] || "phone";

    // If the requested type isn't enabled, fall back gracefully
    const finalType = availableTypes.includes(typeFromUrl)
      ? typeFromUrl
      : availableTypes[0];

    if (!finalType) return;

    // Set active tab & input
    setActiveTab(finalType);

    if (rawQ) {
      if (finalType === "phone") setPhoneNumber(rawQ);
      if (finalType === "email") setEmailAddress(rawQ);
      if (finalType === "url") setWebsite(rawQ);

      // Only auto-run if the user is logged in (the UI already shows a login CTA otherwise)
      if (isAuthed) {
        // Defer one tick so the input states & tab update are applied
        setTimeout(() => {
          handleLookup(finalType, rawQ);
        }, 0);
      }
    }

    bootstrappedFromQueryRef.current = true;
  }, [isLoadingConfigs, availableTypes, isAuthed]);

  // If URL changes while on the page (e.g., client-side nav with new params), re-run once:
  useEffect(() => {
    const onPop = () => {
      bootstrappedFromQueryRef.current = false;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // --- UI ---
  return (
    <div className="container mx-auto px-4 py-4 max-w-5xl">
      <div className="text-center mb-4">
        <div className="flex items-center justify-center mb-1">
          <Shield className="h-5 w-5 text-blue-500 mr-2" />
          <h1 className="text-xl font-bold">Security Check</h1>
        </div>
        <p className="text-xs text-muted-foreground">
          Verify phone numbers, emails, and websites
        </p>
      </div>

      {/* If not authed, show login CTA (but do NOT early return) */}
      {!isAuthed && (
        <div className="max-w-md mx-auto mb-6">
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

      {isLoadingConfigs ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <p>Loading available services...</p>
        </div>
      ) : isConfigsError ? (
        <Card>
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
            <h3 className="text-lg font-medium mb-2">
              Failed to load services
            </h3>
            <p className="text-muted-foreground text-sm">
              {(configsError as Error)?.message || "Unknown error"}
            </p>
          </CardContent>
        </Card>
      ) : availableTypes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">No Services Available</h3>
            <p className="text-muted-foreground">
              Scam lookup services are currently being configured. Please check
              back later.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as LookupType)}
        >
          <TabsList
            className="grid w-full h-10 mb-4"
            style={{
              gridTemplateColumns: `repeat(${availableTypes.length}, 1fr)`,
            }}
          >
            {availableTypes.includes("phone") && (
              <TabsTrigger
                value="phone"
                className="flex items-center gap-1 h-8 text-sm font-medium"
              >
                {getTabIcon("phone")}
                <span className="hidden sm:inline">Phone</span>
                <span className="sm:hidden">Ph</span>
              </TabsTrigger>
            )}
            {availableTypes.includes("email") && (
              <TabsTrigger
                value="email"
                className="flex items-center gap-1 h-8 text-sm font-medium"
              >
                {getTabIcon("email")}
                <span className="hidden sm:inline">Email</span>
                <span className="sm:hidden">Em</span>
              </TabsTrigger>
            )}
            {availableTypes.includes("url") && (
              <TabsTrigger
                value="url"
                className="flex items-center gap-1 h-8 text-sm font-medium"
              >
                {getTabIcon("url")}
                <span className="hidden sm:inline">Website</span>
                <span className="sm:hidden">Web</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* PHONE */}
          {availableTypes.includes("phone") && (
            <TabsContent value="phone" className="space-y-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex gap-2">
                    <Input
                      id="phone"
                      placeholder="Enter phone number (e.g., +1234567890)"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleLookup("phone", phoneNumber)
                      }
                      className="text-sm"
                      disabled={!isAuthed}
                    />
                    <Button
                      onClick={() => handleLookup("phone", phoneNumber)}
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
                .filter(([key]) => key.startsWith("phone_"))
                .map(([key, result]) => (
                  <Card key={key}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          {result.success ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                          {result.apiName} Results
                        </span>
                        {typeof result.responseTime === "number" && (
                          <Badge
                            variant="outline"
                            className="flex items-center gap-1"
                          >
                            <Clock className="h-3 w-3" />
                            {result.responseTime}ms
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {result.success ? (
                        formatResult(result.data, "phone")
                      ) : (
                        <div className="text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="h-5 w-5" />
                            <span className="font-medium">
                              Service Unavailable
                            </span>
                          </div>
                          <p className="text-sm">
                            {result.error?.includes("API")
                              ? "The security service is temporarily unavailable. Please try again later."
                              : result.error ||
                                "Unable to complete security check at this time."}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </TabsContent>
          )}

          {/* EMAIL */}
          {availableTypes.includes("email") && (
            <TabsContent value="email" className="space-y-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex gap-2">
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter email address"
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleLookup("email", emailAddress)
                      }
                      className="text-sm"
                      disabled={!isAuthed}
                    />
                    <Button
                      onClick={() => handleLookup("email", emailAddress)}
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
                .filter(([key]) => key.startsWith("email_"))
                .map(([key, result]) => (
                  <Card key={key}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          {result.success ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                          {result.apiName} Results
                        </span>
                        {typeof result.responseTime === "number" && (
                          <Badge
                            variant="outline"
                            className="flex items-center gap-1"
                          >
                            <Clock className="h-3 w-3" />
                            {result.responseTime}ms
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {result.success ? (
                        formatResult(result.data, "email")
                      ) : (
                        <div className="text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="h-5 w-5" />
                            <span className="font-medium">
                              Service Unavailable
                            </span>
                          </div>
                          <p className="text-sm">
                            {result.error?.includes("API")
                              ? "The security service is temporarily unavailable. Please try again later."
                              : result.error ||
                                "Unable to complete security check at this time."}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </TabsContent>
          )}

          {/* URL */}
          {availableTypes.includes("url") && (
            <TabsContent value="url" className="space-y-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex gap-2">
                    <Input
                      id="website"
                      placeholder="Enter website URL (e.g., https://example.com)"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleLookup("url", website)
                      }
                      className="text-sm"
                      disabled={!isAuthed}
                    />
                    <Button
                      onClick={() => handleLookup("url", website)}
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
                .filter(([key]) => key.startsWith("url_"))
                .map(([key, result]) => (
                  <Card key={key}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          {result.success ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                          {result.apiName} Results
                        </span>
                        {typeof result.responseTime === "number" && (
                          <Badge
                            variant="outline"
                            className="flex items-center gap-1"
                          >
                            <Clock className="h-3 w-3" />
                            {result.responseTime}ms
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {result.success ? (
                        formatResult(result.data, "url")
                      ) : (
                        <div className="text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="h-5 w-5" />
                            <span className="font-medium">
                              Service Unavailable
                            </span>
                          </div>
                          <p className="text-sm">
                            {result.error?.includes("API")
                              ? "The security service is temporarily unavailable. Please try again later."
                              : result.error ||
                                "Unable to complete security check at this time."}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </TabsContent>
          )}
        </Tabs>
      )}

      <div className="mt-8 text-center">
        <Separator className="mb-4" />
        <div className="max-w-2xl mx-auto space-y-2">
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
