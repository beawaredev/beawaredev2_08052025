// /src/pages/AdminPanel.tsx (aligned to Dashboard, full width)
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircleIcon,
  Video,
  ShieldCheckIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  XIcon,
} from "lucide-react";
import { queryClient as globalQueryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { ScamVideoManager } from "@/components/admin/ScamVideoManager";
import { apiRequest } from "@/lib/api-interceptor";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Admin Panel (reports removed)
 * Tabs: Videos, Security Checklist, Scam APIs
 */
export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("security");

  // ===== API Configs state =====
  const [isApiCreateDialogOpen, setIsApiCreateDialogOpen] = useState(false);
  const [isApiEditDialogOpen, setIsApiEditDialogOpen] = useState(false);
  const [editingApiConfig, setEditingApiConfig] = useState<any>(null);
  const [testPhone, setTestPhone] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [testUrl, setTestUrl] = useState("");
  const [testResult, setTestResult] = useState<any>(null);
  const [apiTestResults, setApiTestResults] = useState<Record<number, any>>({});
  const [testingApiIds, setTestingApiIds] = useState<Set<number>>(new Set());
  const [customTestInputs, setCustomTestInputs] = useState<
    Record<number, string>
  >({});
  const [showCustomInputs, setShowCustomInputs] = useState<
    Record<number, boolean>
  >({});

  // ===== API Configs =====
  const {
    data: apiConfigsResponse,
    isLoading: isApiConfigsLoading,
    error: apiConfigsError,
  } = useQuery<any[]>({
    queryKey: ["/api/api-configs"],
    queryFn: async () => {
      const res = await apiRequest("/api/api-configs");
      if (!res.ok)
        throw new Error(
          `Failed to fetch API configs: ${res.status} ${res.statusText}`,
        );
      return res.json();
    },
    enabled: activeTab === "api-configs",
    retry: 3,
    retryDelay: 1000,
  });

  const apiConfigs = apiConfigsResponse || [];

  // ===== API Config forms/mutations =====
  const apiCreateForm = useForm({
    defaultValues: {
      name: "",
      type: "phone",
      url: "",
      apiKey: "",
      description: "",
      rateLimit: 100,
      timeout: 30,
      parameterMapping: '{\n  "phone": "{{input}}",\n  "key": "{{apiKey}}"\n}',
      headers: '{\n  "Content-Type": "application/json"\n}',
    },
  });

  const apiEditForm = useForm({
    defaultValues: {
      name: "",
      type: "phone",
      url: "",
      apiKey: "",
      description: "",
      rateLimit: 100,
      timeout: 30,
      enabled: true,
      parameterMapping: '{\n  "phone": "{{input}}",\n  "key": "{{apiKey}}"\n}',
      headers: '{\n  "Content-Type": "application/json"\n}',
    },
  });

  const apiCreateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("/api/api-configs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok)
        throw new Error(`Create failed: ${res.status} ${res.statusText}`);
      return res.json?.() ?? res;
    },
    onSuccess: () => {
      setIsApiCreateDialogOpen(false);
      apiCreateForm.reset();
      globalQueryClient.invalidateQueries({ queryKey: ["/api/api-configs"] });
      toast({
        title: "API Configuration Created",
        description: "The API configuration has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: `Failed to create API configuration: ${error?.message || error}`,
        variant: "destructive",
      });
    },
  });

  const apiUpdateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest(`/api/api-configs/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok)
        throw new Error(`Update failed: ${res.status} ${res.statusText}`);
      return res.json?.() ?? res;
    },
    onSuccess: () => {
      setIsApiEditDialogOpen(false);
      setEditingApiConfig(null);
      apiEditForm.reset();
      globalQueryClient.invalidateQueries({ queryKey: ["/api/api-configs"] });
      toast({
        title: "API Configuration Updated",
        description: "The API configuration has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: `Failed to update API configuration: ${error?.message || error}`,
        variant: "destructive",
      });
    },
  });

  const apiDeleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest(`/api/api-configs/${id}`, {
        method: "DELETE",
      });
      if (!res.ok)
        throw new Error(`Delete failed: ${res.status} ${res.statusText}`);
      return res.json?.() ?? res;
    },
    onSuccess: () => {
      globalQueryClient.invalidateQueries({ queryKey: ["/api/api-configs"] });
      toast({
        title: "API Configuration Deleted",
        description: "The API configuration has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Deletion Failed",
        description: `Failed to delete API configuration: ${error?.message || error}`,
        variant: "destructive",
      });
    },
  });

  const handleTestLookup = async (type: string, input: string) => {
    if (!input.trim()) return;
    try {
      const res = await apiRequest("/api/scam/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, input }),
      });
      const data = await res.json();
      setTestResult(data?.result ?? data);
      toast({
        title: "Test Completed",
        description: `Scam lookup test completed for ${type}: ${input}`,
      });
    } catch (error: any) {
      toast({
        title: "Test Failed",
        description: `Scam lookup test failed: ${error?.message || error}`,
        variant: "destructive",
      });
    }
  };

  const handleTestApi = async (config: any, customInput?: string) => {
    setTestingApiIds((prev) => new Set(prev).add(config.id));
    const getTestInputForType = (t: string) =>
      t === "phone"
        ? "+1234567890"
        : t === "email"
          ? "test@example.com"
          : t === "url"
            ? "https://example.com"
            : t === "ip"
              ? "192.168.1.1"
              : t === "domain"
                ? "example.com"
                : "test-input";

    const testInput =
      customInput ||
      customTestInputs[config.id] ||
      getTestInputForType(config.type);

    try {
      toast({
        title: "Testing API",
        description: `Testing ${config.name} with input: ${testInput}`,
      });
      const res = await apiRequest(`/api/api-configs/${config.id}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: config.type, testInput }),
      });
      const result = await res.json();
      setApiTestResults((prev) => ({
        ...prev,
        [config.id]: {
          ...result,
          timestamp: new Date().toISOString(),
          testInput,
          apiCallDetails: result?.testResult?.apiCallDetails || null,
        },
      }));
      toast({
        title: result?.success ? "API Test Successful" : "API Test Failed",
        description: result?.success
          ? `${config.name} is working correctly.`
          : result?.message || "Unknown error",
        variant: result?.success ? "default" : "destructive",
      });
    } catch (error: any) {
      setApiTestResults((prev) => ({
        ...prev,
        [config.id]: {
          success: false,
          error: error?.message || String(error),
          timestamp: new Date().toISOString(),
          testInput,
        },
      }));
      toast({
        title: "API Test Error",
        description: `Test failed for ${config.name}: ${error?.message || error}`,
        variant: "destructive",
      });
    } finally {
      setTestingApiIds((prev) => {
        const s = new Set(prev);
        s.delete(config.id);
        return s;
      });
    }
  };

  const handleEditApiConfig = (config: any) => {
    setEditingApiConfig(config);
    apiEditForm.reset({
      name: config.name || "",
      type: config.type || "phone",
      url: config.url || "",
      apiKey: config.apiKey || "",
      description: config.description || "",
      rateLimit: config.rateLimit || 100,
      timeout: config.timeout || 30,
      enabled: config.enabled !== false,
      parameterMapping:
        config.parameterMapping ||
        '{\n  "phone": "{{input}}",\n  "key": "{{apiKey}}"\n}',
      headers: config.headers || '{\n  "Content-Type": "application/json"\n}',
    });
    setIsApiEditDialogOpen(true);
  };

  const onSubmitApiEdit = (data: any) => {
    if (!data.name || !data.type || !data.url || !data.apiKey) {
      toast({
        title: "Validation Error",
        description:
          "Please fill in all required fields (Name, Type, URL, API Key)",
        variant: "destructive",
      });
      return;
    }
    apiUpdateMutation.mutate({ ...data, id: editingApiConfig.id });
  };

  const onSubmitApiCreate = (data: any) => {
    if (!data.name || !data.type || !data.url || !data.apiKey) {
      toast({
        title: "Validation Error",
        description:
          "Please fill in all required fields (Name, Type, URL, API Key)",
        variant: "destructive",
      });
      return;
    }
    apiCreateMutation.mutate(data);
  };

  // ===== Render =====
  return (
    <div className="space-y-6">
      {/* Top heading aligned with Dashboard */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard-----</h1>
          <p className="text-muted-foreground mt-1">
            Manage videos, security checklist items, and scam API integrations.
          </p>
        </div>
      </div>

      <Tabs defaultValue="security" onValueChange={setActiveTab}>
        <TabsList className="mb-6 flex flex-wrap">
          <TabsTrigger value="videos">
            <span className="flex items-center">
              <Video className="h-4 w-4 mr-1" /> Videos
            </span>
          </TabsTrigger>
          <TabsTrigger value="security">
            <span className="flex items-center">
              <ShieldCheckIcon className="h-4 w-4 mr-1" /> Security Checklist
            </span>
          </TabsTrigger>
          <TabsTrigger value="api-configs">
            <span className="flex items-center">
              <AlertCircleIcon className="h-4 w-4 mr-1" /> Scam APIs
            </span>
          </TabsTrigger>
        </TabsList>

        {/* Videos */}
        <TabsContent value="videos" className="mt-6">
          <ScamVideoManager />
        </TabsContent>

        {/* Security Checklist */}
        <TabsContent value="security" className="mt-6">
          <AdminSecurityChecklistPanel />
        </TabsContent>

        {/* Scam API Configs */}
        <TabsContent value="api-configs" className="mt-6">
          <div className="space-y-6">
            {/* Subsection header */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold tracking-tight">
                Scam Detection API Configuration
              </h2>
              <Button onClick={() => setIsApiCreateDialogOpen(true)}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Add API Configuration
              </Button>
            </div>

            {/* Quick Test Tools */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Test Tools</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="test-phone">Test Phone Number</Label>
                    <div className="flex gap-2">
                      <Input
                        id="test-phone"
                        value={testPhone}
                        onChange={(e) => setTestPhone(e.target.value)}
                        placeholder="+1234567890"
                      />
                      <Button
                        onClick={() => handleTestLookup("phone", testPhone)}
                        size="sm"
                      >
                        Test
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="test-email">Test Email</Label>
                    <div className="flex gap-2">
                      <Input
                        id="test-email"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        placeholder="test@example.com"
                      />
                      <Button
                        onClick={() => handleTestLookup("email", testEmail)}
                        size="sm"
                      >
                        Test
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="test-url">Test URL</Label>
                    <div className="flex gap-2">
                      <Input
                        id="test-url"
                        value={testUrl}
                        onChange={(e) => setTestUrl(e.target.value)}
                        placeholder="https://example.com"
                      />
                      <Button
                        onClick={() => handleTestLookup("url", testUrl)}
                        size="sm"
                      >
                        Test
                      </Button>
                    </div>
                  </div>
                </div>

                {testResult && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Test Result:</h4>
                    <pre className="text-sm bg-white p-2 rounded border overflow-auto">
                      {JSON.stringify(testResult, null, 2)}
                    </pre>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge
                        variant={
                          testResult.fraud_score > 75
                            ? "destructive"
                            : testResult.fraud_score > 50
                              ? "secondary"
                              : "default"
                        }
                      >
                        Risk Score: {testResult.fraud_score ?? "N/A"}
                      </Badge>
                      <Badge
                        variant={testResult.valid ? "default" : "destructive"}
                      >
                        {testResult.valid ? "Valid" : "Invalid"}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* API Configurations List */}
            <Card>
              <CardHeader>
                <CardTitle>API Configurations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isApiConfigsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-sm text-muted-foreground">
                        Loading API configurations...
                      </div>
                    </div>
                  ) : apiConfigs.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-sm text-muted-foreground">
                        No API configurations found. Create one to get started.
                      </div>
                    </div>
                  ) : (
                    apiConfigs.map((config: any) => (
                      <div key={config.id} className="border rounded-lg">
                        <div className="flex items-center justify-between p-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{config.name}</h4>
                              <Badge variant="outline">{config.type}</Badge>
                              <Badge
                                variant={
                                  config.enabled ? "default" : "secondary"
                                }
                              >
                                {config.enabled ? "Enabled" : "Disabled"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {config.description}
                            </p>
                            <div className="text-xs text-muted-foreground mt-1">
                              Rate limit: {config.rateLimit}/min • Timeout:{" "}
                              {config.timeout}s
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setShowCustomInputs((prev) => ({
                                  ...prev,
                                  [config.id]: !prev[config.id],
                                }))
                              }
                            >
                              {showCustomInputs[config.id]
                                ? "Hide Input"
                                : "Custom Test"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleTestApi(config)}
                              disabled={testingApiIds.has(config.id)}
                            >
                              {testingApiIds.has(config.id)
                                ? "Testing..."
                                : "Test"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditApiConfig(config)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                apiDeleteMutation.mutate(config.id)
                              }
                            >
                              <XIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Custom Test Input Section */}
                        {showCustomInputs[config.id] && (
                          <div className="px-4 py-3 border-t bg-blue-50 dark:bg-blue-900/20">
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <label className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                  Test Input ({config.type}):
                                </label>
                              </div>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={customTestInputs[config.id] || ""}
                                  onChange={(e) =>
                                    setCustomTestInputs((prev) => ({
                                      ...prev,
                                      [config.id]: e.target.value,
                                    }))
                                  }
                                  placeholder={`Enter ${config.type} to test`}
                                  className="flex-1 px-3 py-2 text-sm border border-blue-200 dark:border-blue-700 rounded bg-white dark:bg-slate-800"
                                />
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleTestApi(
                                      config,
                                      customTestInputs[config.id],
                                    )
                                  }
                                  disabled={testingApiIds.has(config.id)}
                                >
                                  {testingApiIds.has(config.id)
                                    ? "Testing..."
                                    : "Test Now"}
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* API Test Results Display */}
                        {apiTestResults[config.id] && (
                          <div className="px-4 pb-4 border-t bg-slate-50 dark:bg-slate-900/50">
                            <div className="mt-3">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                  Test Results
                                </h5>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(
                                    apiTestResults[config.id].timestamp,
                                  ).toLocaleTimeString()}
                                </span>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium">
                                    Input:
                                  </span>
                                  <code className="text-xs bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded">
                                    {apiTestResults[config.id].testInput}
                                  </code>
                                </div>

                                {apiTestResults[config.id].apiCallDetails && (
                                  <div className="mt-3 p-3 bg-slate-100 dark:bg-slate-800 rounded">
                                    <h6 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                      API Call Details
                                    </h6>
                                    <div className="space-y-1">
                                      <div className="flex items-start gap-2">
                                        <span className="text-xs font-medium min-w-[50px]">
                                          Method:
                                        </span>
                                        <code className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">
                                          {
                                            apiTestResults[config.id]
                                              .apiCallDetails.method
                                          }
                                        </code>
                                      </div>
                                      <div className="flex items-start gap-2">
                                        <span className="text-xs font-medium min-w-[50px]">
                                          URL:
                                        </span>
                                        <code className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded flex-1 break-all">
                                          {
                                            apiTestResults[config.id]
                                              .apiCallDetails.url
                                          }
                                        </code>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium">
                                    Status:
                                  </span>
                                  <Badge
                                    variant={
                                      apiTestResults[config.id].success
                                        ? "default"
                                        : "destructive"
                                    }
                                    className="text-xs"
                                  >
                                    {apiTestResults[config.id].success
                                      ? "Success"
                                      : "Failed"}
                                  </Badge>
                                </div>

                                {apiTestResults[config.id].testResult && (
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-medium">
                                        Provider:
                                      </span>
                                      <span className="text-xs">
                                        {
                                          apiTestResults[config.id].testResult
                                            .provider
                                        }
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-medium">
                                        Status:
                                      </span>
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {
                                          apiTestResults[config.id].testResult
                                            .status
                                        }
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-medium">
                                        Risk Score:
                                      </span>
                                      <span className="text-xs">
                                        {
                                          apiTestResults[config.id].testResult
                                            .riskScore
                                        }
                                      </span>
                                    </div>
                                  </div>
                                )}

                                {apiTestResults[config.id].error && (
                                  <div className="mt-2 text-xs text-red-600 dark:text-red-400 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                                    {apiTestResults[config.id].error}
                                  </div>
                                )}

                                {apiTestResults[config.id].testResult
                                  ?.details && (
                                  <details className="mt-2">
                                    <summary className="text-xs font-medium cursor-pointer">
                                      Raw Response
                                    </summary>
                                    <div className="mt-2 p-2 bg-slate-100 dark:bg-slate-800 rounded">
                                      <pre className="text-xs overflow-x-auto">
                                        {JSON.stringify(
                                          apiTestResults[config.id].testResult
                                            .details,
                                          null,
                                          2,
                                        )}
                                      </pre>
                                    </div>
                                  </details>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}

                  {apiConfigsError && (
                    <div className="text-center py-8 text-red-600">
                      <AlertCircleIcon className="h-12 w-12 mx-auto mb-2" />
                      <p>Error loading API configurations</p>
                      <p className="text-sm mt-2">
                        {(apiConfigsError as Error).message}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* API Create Dialog */}
            <Dialog
              open={isApiCreateDialogOpen}
              onOpenChange={setIsApiCreateDialogOpen}
            >
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add API Configuration</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={apiCreateForm.handleSubmit(onSubmitApiCreate)}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="api-name">API Name *</Label>
                      <Input
                        id="api-name"
                        {...apiCreateForm.register("name", {
                          required: "Name is required",
                        })}
                        placeholder="IPQualityScore Phone"
                      />
                      {apiCreateForm.formState.errors.name && (
                        <p className="text-xs text-red-500 mt-1">
                          {
                            apiCreateForm.formState.errors.name
                              .message as string
                          }
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="api-type">Type *</Label>
                      <Select
                        value={apiCreateForm.watch("type") || "phone"}
                        onValueChange={(value) => {
                          apiCreateForm.setValue("type", value);
                          const templates: Record<string, string> = {
                            phone:
                              '{\n  "phone": "{{input}}",\n  "key": "{{apiKey}}"\n}',
                            email:
                              '{\n  "email": "{{input}}",\n  "key": "{{apiKey}}"\n}',
                            url: '{\n  "url": "{{input}}",\n  "key": "{{apiKey}}"\n}',
                            ip: '{\n  "ip": "{{input}}",\n  "key": "{{apiKey}}"\n}',
                            domain:
                              '{\n  "domain": "{{input}}",\n  "key": "{{apiKey}}"\n}',
                          };
                          apiCreateForm.setValue(
                            "parameterMapping",
                            templates[value] || templates.phone,
                          );
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="phone">Phone</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="url">URL</SelectItem>
                          <SelectItem value="ip">IP Address</SelectItem>
                          <SelectItem value="domain">Domain</SelectItem>
                        </SelectContent>
                      </Select>
                      {apiCreateForm.formState.errors.type && (
                        <p className="text-xs text-red-500 mt-1">
                          {
                            apiCreateForm.formState.errors.type
                              ?.message as string
                          }
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="api-url">API URL *</Label>
                    <Input
                      id="api-url"
                      {...apiCreateForm.register("url", {
                        required: "URL is required",
                      })}
                      placeholder="https://api.example.com/v1/check"
                    />
                    {apiCreateForm.formState.errors.url && (
                      <p className="text-xs text-red-500 mt-1">
                        {apiCreateForm.formState.errors.url.message as string}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="api-key">API Key *</Label>
                    <Input
                      id="api-key"
                      type="password"
                      {...apiCreateForm.register("apiKey", {
                        required: "API Key is required",
                      })}
                      placeholder="your-api-key-here"
                    />
                    {apiCreateForm.formState.errors.apiKey && (
                      <p className="text-xs text-red-500 mt-1">
                        {
                          apiCreateForm.formState.errors.apiKey
                            .message as string
                        }
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="api-description">Description</Label>
                    <Textarea
                      id="api-description"
                      {...apiCreateForm.register("description")}
                      placeholder="Brief description of this API service"
                    />
                  </div>

                  <div>
                    <Label htmlFor="api-params">Parameter Mapping (JSON)</Label>
                    <Textarea
                      id="api-params"
                      {...apiCreateForm.register("parameterMapping")}
                      rows={4}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Use {"{{input}}"} and {"{{apiKey}}"}. Replaced at runtime.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="api-headers">Headers (JSON)</Label>
                    <Textarea
                      id="api-headers"
                      {...apiCreateForm.register("headers")}
                      rows={3}
                      className="font-mono text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="api-rate-limit">
                        Rate Limit (per minute)
                      </Label>
                      <Input
                        id="api-rate-limit"
                        type="number"
                        {...apiCreateForm.register("rateLimit", {
                          valueAsNumber: true,
                        })}
                        placeholder="100"
                      />
                    </div>
                    <div>
                      <Label htmlFor="api-timeout">Timeout (seconds)</Label>
                      <Input
                        id="api-timeout"
                        type="number"
                        {...apiCreateForm.register("timeout", {
                          valueAsNumber: true,
                        })}
                        placeholder="30"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsApiCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={apiCreateMutation.isPending}
                    >
                      {apiCreateMutation.isPending
                        ? "Creating..."
                        : "Create API Config"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {/* Edit API Config */}
            <Dialog
              open={isApiEditDialogOpen}
              onOpenChange={setIsApiEditDialogOpen}
            >
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Edit API Configuration</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={apiEditForm.handleSubmit(onSubmitApiEdit)}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-api-name">API Name *</Label>
                      <Input
                        id="edit-api-name"
                        {...apiEditForm.register("name", {
                          required: "Name is required",
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-api-type">Type *</Label>
                      <Select
                        value={apiEditForm.watch("type") || "phone"}
                        onValueChange={(value) => {
                          apiEditForm.setValue("type", value);
                          const templates: Record<string, string> = {
                            phone:
                              '{\n  "phone": "{{input}}",\n  "key": "{{apiKey}}"\n}',
                            email:
                              '{\n  "email": "{{input}}",\n  "key": "{{apiKey}}"\n}',
                            url: '{\n  "url": "{{input}}",\n  "key": "{{apiKey}}"\n}',
                            ip: '{\n  "ip": "{{input}}",\n  "key": "{{apiKey}}"\n}',
                            domain:
                              '{\n  "domain": "{{input}}",\n  "key": "{{apiKey}}"\n}',
                          };
                          apiEditForm.setValue(
                            "parameterMapping",
                            templates[value] || templates.phone,
                          );
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="phone">Phone</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="url">URL</SelectItem>
                          <SelectItem value="ip">IP</SelectItem>
                          <SelectItem value="domain">Domain</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="edit-api-url">API URL *</Label>
                    <Input
                      id="edit-api-url"
                      {...apiEditForm.register("url", {
                        required: "URL is required",
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-api-key">API Key *</Label>
                    <Input
                      id="edit-api-key"
                      type="password"
                      {...apiEditForm.register("apiKey", {
                        required: "API Key is required",
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-api-description">Description</Label>
                    <Textarea
                      id="edit-api-description"
                      {...apiEditForm.register("description")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-api-params">
                      Parameter Mapping (JSON)
                    </Label>
                    <Textarea
                      id="edit-api-params"
                      {...apiEditForm.register("parameterMapping")}
                      rows={4}
                      className="font-mono text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-api-headers">Headers (JSON)</Label>
                    <Textarea
                      id="edit-api-headers"
                      {...apiEditForm.register("headers")}
                      rows={3}
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="edit-api-rate-limit">Rate Limit</Label>
                      <Input
                        id="edit-api-rate-limit"
                        type="number"
                        {...apiEditForm.register("rateLimit", {
                          valueAsNumber: true,
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-api-timeout">Timeout</Label>
                      <Input
                        id="edit-api-timeout"
                        type="number"
                        {...apiEditForm.register("timeout", {
                          valueAsNumber: true,
                        })}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        id="edit-api-enabled"
                        type="checkbox"
                        {...apiEditForm.register("enabled")}
                        className="rounded"
                      />
                      <Label htmlFor="edit-api-enabled">Enabled</Label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsApiEditDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={apiUpdateMutation.isPending}
                    >
                      {apiUpdateMutation.isPending
                        ? "Updating..."
                        : "Update API Config"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ===== Admin Security Checklist Panel =====
function AdminSecurityChecklistPanel() {
  const queryClient = useQueryClient();
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Fetch checklist items
  const { data: checklistItems = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/security-checklist"],
    queryFn: async () => {
      const res = await apiRequest("/api/security-checklist");
      if (!res.ok)
        throw new Error(
          `Failed to fetch checklist: ${res.status} ${res.statusText}`,
        );
      return res.json();
    },
  });

  // Filter items by category
  const filteredItems =
    selectedCategory === "all"
      ? checklistItems
      : checklistItems.filter(
          (item: any) => item.category === selectedCategory,
        );

  // Unique categories
  const categories = React.useMemo(() => {
    const cats = Array.from(
      new Set(checklistItems.map((item: any) => item.category)),
    );
    return ["all", ...cats];
  }, [checklistItems]);

  // Forms
  const editForm = useForm<any>({
    defaultValues: {
      title: "",
      description: "",
      recommendationText: "",
      helpUrl: "",
      toolLaunchUrl: "",
      youtubeVideoUrl: "",
      estimatedTimeMinutes: 0,
      category: "account_security",
      priority: "medium",
    },
  });

  const createForm = useForm<any>({
    defaultValues: {
      title: "",
      description: "",
      recommendationText: "",
      helpUrl: "",
      toolLaunchUrl: "",
      youtubeVideoUrl: "",
      estimatedTimeMinutes: 15,
      category: "account_security",
      priority: "medium",
      sortOrder: (checklistItems?.length || 0) + 1,
    },
  });

  const handleEditItem = (item: any) => {
    setEditingItem(item);
    editForm.reset({
      title: item.title || "",
      description: item.description || "",
      recommendationText: item.recommendationText || "",
      helpUrl: item.helpUrl || "",
      toolLaunchUrl: item.toolLaunchUrl || "",
      youtubeVideoUrl: item.youtubeVideoUrl || "",
      estimatedTimeMinutes: item.estimatedTimeMinutes || 0,
      category: item.category || "account_security",
      priority: item.priority || "medium",
    });
    setIsEditDialogOpen(true);
  };

  const updateItemMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest(
        `/api/security-checklist/${editingItem.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
      if (!res.ok)
        throw new Error(`Update failed: ${res.status} ${res.statusText}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/security-checklist"] });
      setIsEditDialogOpen(false);
      setEditingItem(null);
      toast({
        title: "Component Updated",
        description:
          "Security checklist component has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: `Failed to update component: ${error?.message || error}`,
        variant: "destructive",
      });
    },
  });

  const createItemMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        title: data.title?.trim(),
        description: data.description?.trim(),
        recommendationText: data.recommendationText?.trim() || null,
        helpUrl: data.helpUrl?.trim() || null,
        toolLaunchUrl: data.toolLaunchUrl?.trim() || null,
        youtubeVideoUrl: data.youtubeVideoUrl?.trim() || null,
        estimatedTimeMinutes: Number(data.estimatedTimeMinutes) || 15,
        category: data.category || "account_security",
        priority: data.priority || "medium",
        sortOrder: data.sortOrder != null ? Number(data.sortOrder) : undefined,
      };

      if (!payload.title || !payload.description) {
        throw new Error("Title and Description are required.");
      }

      const res = await apiRequest("/api/security-checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      return res.json?.() ?? res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/security-checklist"] });
      setIsCreateDialogOpen(false);
      createForm.reset();
      toast({
        title: "Component Created",
        description:
          "New security checklist component has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: `Failed to create component: ${error?.message || error}`,
        variant: "destructive",
      });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: number) => {
      const res = await apiRequest(`/api/security-checklist/${itemId}`, {
        method: "DELETE",
      });
      if (!res.ok)
        throw new Error(`Delete failed: ${res.status} ${res.statusText}`);
      return res.json?.() ?? res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/security-checklist"] });
      toast({
        title: "Component Deleted",
        description:
          "Security checklist component has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Deletion Failed",
        description: `Failed to delete component: ${error?.message || error}`,
        variant: "destructive",
      });
    },
  });

  const onSubmitEdit = (values: any) => {
    updateItemMutation.mutate(values);
  };

  const onSubmitCreate = (values: any) => {
    if (!values.title?.trim() || !values.description?.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide both Title and Description.",
        variant: "destructive",
      });
      return;
    }
    createItemMutation.mutate(values);
  };

  const handleDeleteItem = (itemId: number) => {
    if (
      confirm("Are you sure you want to delete this security checklist item?")
    ) {
      deleteItemMutation.mutate(itemId);
    }
  };

  if (isLoading)
    return (
      <div className="text-center py-8">Loading security checklist...</div>
    );

  return (
    <div className="space-y-6">
      {/* Subsection header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Security Checklist Management
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage digital security checklist items
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Security Component
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {checklistItems.length}
            </div>
            <div className="text-xs text-muted-foreground">
              Total Components
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {checklistItems.filter((i: any) => i.priority === "high").length}
            </div>
            <div className="text-xs text-muted-foreground">High Priority</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {checklistItems.filter((i: any) => i.toolLaunchUrl).length}
            </div>
            <div className="text-xs text-muted-foreground">With Tools</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {checklistItems.filter((i: any) => i.youtubeVideoUrl).length}
            </div>
            <div className="text-xs text-muted-foreground">With Videos</div>
          </CardContent>
        </Card>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {Array.from(
          new Set(["all", ...checklistItems.map((i: any) => i.category)]),
        ).map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category)}
            className="capitalize"
          >
            {String(category).replace("_", " ")}
          </Button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item: any) => (
          <Card key={item.id} className="relative">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-sm font-medium pr-8">
                  {item.title}
                </CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditItem(item)}
                    className="h-6 w-6 p-0"
                  >
                    <EditIcon className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteItem(item.id)}
                    className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                  >
                    <TrashIcon className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="flex gap-1 flex-wrap">
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
                <Badge variant="outline" className="capitalize text-xs">
                  {item.category?.replace("_", " ")}
                </Badge>
                {item.toolLaunchUrl && <span title="Has launch tool">🔗</span>}
                {item.youtubeVideoUrl && <span title="Has video">📹</span>}
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                {item.description}
              </p>
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">Time:</span>{" "}
                {item.estimatedTimeMinutes} min
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Security Component</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={createForm.handleSubmit(onSubmitCreate)}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create-title">Title</Label>
                <Input
                  id="create-title"
                  {...createForm.register("title", { required: true })}
                  placeholder="Component title"
                />
              </div>
              <div>
                <Label htmlFor="create-category">Category</Label>
                <Select
                  value={createForm.watch("category")}
                  onValueChange={(v) => createForm.setValue("category", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="account_security">
                      Account Security
                    </SelectItem>
                    <SelectItem value="password_security">
                      Password Security
                    </SelectItem>
                    <SelectItem value="financial_security">
                      Financial Security
                    </SelectItem>
                    <SelectItem value="network_security">
                      Network Security
                    </SelectItem>
                    <SelectItem value="device_security">
                      Device Security
                    </SelectItem>
                    <SelectItem value="communication_security">
                      Communication Security
                    </SelectItem>
                    <SelectItem value="privacy_settings">
                      Privacy Settings
                    </SelectItem>
                    <SelectItem value="data_protection">
                      Data Protection
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="create-description">Description</Label>
              <Textarea
                id="create-description"
                {...createForm.register("description", { required: true })}
                placeholder="Brief description"
              />
            </div>
            <div>
              <Label htmlFor="create-recommendation">Recommendation Text</Label>
              <Textarea
                id="create-recommendation"
                {...createForm.register("recommendationText")}
                placeholder="Detailed recommendation"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create-priority">Priority</Label>
                <Select
                  value={createForm.watch("priority")}
                  onValueChange={(v) => createForm.setValue("priority", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="create-time">Estimated Time (minutes)</Label>
                <Input
                  id="create-time"
                  type="number"
                  {...createForm.register("estimatedTimeMinutes", {
                    valueAsNumber: true,
                  })}
                  placeholder="15"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="create-help-url">Help URL</Label>
              <Input
                id="create-help-url"
                {...createForm.register("helpUrl")}
                placeholder="https://example.com/help"
              />
            </div>
            <div>
              <Label htmlFor="create-tool-url">
                Tool Launch URL (optional)
              </Label>
              <Input
                id="create-tool-url"
                {...createForm.register("toolLaunchUrl")}
                placeholder="https://tool.example.com"
              />
            </div>
            <div>
              <Label htmlFor="create-video-url">
                YouTube Video URL (optional)
              </Label>
              <Input
                id="create-video-url"
                {...createForm.register("youtubeVideoUrl")}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createItemMutation.isPending}>
                {createItemMutation.isPending
                  ? "Creating..."
                  : "Create Component"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Security Component</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={editForm.handleSubmit(onSubmitEdit)}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  {...editForm.register("title", { required: true })}
                  placeholder="Component title"
                />
              </div>
              <div>
                <Label htmlFor="edit-category">Category</Label>
                <Select
                  value={editForm.watch("category")}
                  onValueChange={(v) => editForm.setValue("category", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="account_security">
                      Account Security
                    </SelectItem>
                    <SelectItem value="password_security">
                      Password Security
                    </SelectItem>
                    <SelectItem value="financial_security">
                      Financial Security
                    </SelectItem>
                    <SelectItem value="network_security">
                      Network Security
                    </SelectItem>
                    <SelectItem value="device_security">
                      Device Security
                    </SelectItem>
                    <SelectItem value="communication_security">
                      Communication Security
                    </SelectItem>
                    <SelectItem value="privacy_settings">
                      Privacy Settings
                    </SelectItem>
                    <SelectItem value="data_protection">
                      Data Protection
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                {...editForm.register("description", { required: true })}
                placeholder="Brief description"
              />
            </div>
            <div>
              <Label htmlFor="edit-recommendation">Recommendation Text</Label>
              <Textarea
                id="edit-recommendation"
                {...editForm.register("recommendationText")}
                placeholder="Detailed recommendation"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-priority">Priority</Label>
                <Select
                  value={editForm.watch("priority")}
                  onValueChange={(v) => editForm.setValue("priority", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-time">Estimated Time (minutes)</Label>
                <Input
                  id="edit-time"
                  type="number"
                  {...editForm.register("estimatedTimeMinutes", {
                    valueAsNumber: true,
                  })}
                  placeholder="15"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-help-url">Help URL</Label>
              <Input
                id="edit-help-url"
                {...editForm.register("helpUrl")}
                placeholder="https://example.com/help"
              />
            </div>
            <div>
              <Label htmlFor="edit-tool-url">Tool Launch URL (optional)</Label>
              <Input
                id="edit-tool-url"
                {...editForm.register("toolLaunchUrl")}
                placeholder="https://tool.example.com"
              />
            </div>
            <div>
              <Label htmlFor="edit-video-url">
                YouTube Video URL (optional)
              </Label>
              <Input
                id="edit-video-url"
                {...editForm.register("youtubeVideoUrl")}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateItemMutation.isPending}>
                {updateItemMutation.isPending
                  ? "Updating..."
                  : "Update Component"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
