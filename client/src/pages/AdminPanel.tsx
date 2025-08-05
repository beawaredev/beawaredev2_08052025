import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  EyeIcon, 
  CheckIcon, 
  XIcon, 
  AlertCircleIcon,
  AlertTriangleIcon,
  FileIcon,
  Video,
  ShieldCheckIcon,
  PlusIcon,
  EditIcon,
  TrashIcon
} from "lucide-react";
import { format } from "date-fns";
import { queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { ScamVideoManager } from "@/components/admin/ScamVideoManager";
import { apiRequest } from '@/lib/api-interceptor';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import React from "react";

// Types
interface User {
  id: number;
  displayName: string;
  email: string;
  beawareUsername: string;
}

interface ScamReport {
  id: number;
  userId: number;
  scamType: 'phone' | 'email' | 'business';
  scamPhoneNumber: string | null;
  scamEmail: string | null;
  scamBusinessName: string | null;
  incidentDate: string;
  location: string;
  description: string;
  hasProofDocument: boolean;
  proofDocumentPath: string | null;
  proofDocumentType: string | null;
  reportedAt: string;
  isVerified: boolean;
  verifiedBy: number | null;
  verifiedAt: string | null;
  user?: User;
}

interface ApiResponse {
  reports: ScamReport[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("pending");
  
  // API Configuration management state
  const [isApiCreateDialogOpen, setIsApiCreateDialogOpen] = useState(false);
  const [isApiEditDialogOpen, setIsApiEditDialogOpen] = useState(false);
  const [editingApiConfig, setEditingApiConfig] = useState<any>(null);
  const [testPhone, setTestPhone] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [testUrl, setTestUrl] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [apiTestResults, setApiTestResults] = useState<Record<number, any>>({});
  const [testingApiIds, setTestingApiIds] = useState<Set<number>>(new Set());
  const [customTestInputs, setCustomTestInputs] = useState<Record<number, string>>({});
  const [showCustomInputs, setShowCustomInputs] = useState<Record<number, boolean>>({});
  
  // Fetch API configurations from database using authenticated request
  const { data: apiConfigsResponse, isLoading: isApiConfigsLoading, error: apiConfigsError } = useQuery<any[]>({
    queryKey: ['/api/api-configs'],
    queryFn: async () => {
      console.log('Fetching API configs with authentication...');
      const response = await apiRequest('/api/api-configs');
      if (!response.ok) {
        console.error('API configs fetch failed:', response.status, response.statusText);
        throw new Error(`Failed to fetch API configs: ${response.status} ${response.statusText}`);
      }
      return response.json();
    },
    enabled: activeTab === "api-configs",
    retry: 3,
    retryDelay: 1000
  });
  
  const apiConfigs = apiConfigsResponse || [];
  
  // Fetch scam reports using authenticated requests
  const { data: pendingResponse, isLoading: isPendingLoading } = useQuery<ApiResponse>({
    queryKey: ['/api/scam-reports', 'pending'],
    queryFn: async () => {
      const response = await apiRequest('/api/scam-reports?isVerified=false');
      return response.json();
    },
    enabled: activeTab === "pending"
  });
  
  const { data: verifiedResponse, isLoading: isVerifiedLoading } = useQuery<ApiResponse>({
    queryKey: ['/api/scam-reports', 'verified'],
    queryFn: async () => {
      const response = await apiRequest('/api/scam-reports?isVerified=true');
      return response.json();
    },
    enabled: activeTab === "verified"
  });
  
  const pendingReports = (pendingResponse as any)?.reports || [];
  const verifiedReports = (verifiedResponse as any)?.reports || [];
  
  // Mutation for verifying reports
  const verifyMutation = useMutation({
    mutationFn: async (reportId: number) => {
      const response = await fetch(`/api/scam-reports/${reportId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isVerified: true }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to verify report');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scam-reports?isVerified=false'] });
      queryClient.invalidateQueries({ queryKey: ['/api/scam-reports?isVerified=true'] });
      toast({
        title: "Report Verified",
        description: "The scam report has been verified successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Verification Failed",
        description: `An error occurred: ${error.toString()}`,
        variant: "destructive",
      });
    },
  });
  
  // Dialog state for verification confirmation
  const [reportToVerify, setReportToVerify] = useState<number | null>(null);
  
  // API Configuration form
  const apiCreateForm = useForm({
    defaultValues: {
      name: '',
      type: 'phone',
      url: '',
      apiKey: '',
      description: '',
      rateLimit: 100,
      timeout: 30,
      parameterMapping: '{\n  "phone": "{{input}}",\n  "key": "{{apiKey}}"\n}',
      headers: '{\n  "Content-Type": "application/json"\n}'
    }
  });
  
  // API Configuration mutations
  const apiCreateMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('Sending API config data:', data);
      const response = await apiRequest('/api/api-configs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      return response;
    },
    onSuccess: () => {
      setIsApiCreateDialogOpen(false);
      apiCreateForm.reset();
      // Invalidate the API configs cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/api-configs'] });
      toast({
        title: "API Configuration Created",
        description: "The API configuration has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Creation Failed",
        description: `Failed to create API configuration: ${error}`,
        variant: "destructive",
      });
    },
  });

  // API Configuration edit form
  const apiEditForm = useForm({
    defaultValues: {
      name: '',
      type: 'phone',
      url: '',
      apiKey: '',
      description: '',
      rateLimit: 100,
      timeout: 30,
      enabled: true,
      parameterMapping: '{\n  "phone": "{{input}}",\n  "key": "{{apiKey}}"\n}',
      headers: '{\n  "Content-Type": "application/json"\n}'
    }
  });

  const apiUpdateMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('Updating API config:', data);
      const response = await apiRequest(`/api/api-configs/${data.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      return response;
    },
    onSuccess: () => {
      setIsApiEditDialogOpen(false);
      setEditingApiConfig(null);
      apiEditForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/api-configs'] });
      toast({
        title: "API Configuration Updated",
        description: "The API configuration has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: `Failed to update API configuration: ${error}`,
        variant: "destructive",
      });
    },
  });

  const apiDeleteMutation = useMutation({
    mutationFn: async (id: number) => {
      console.log('Deleting API config:', id);
      const response = await apiRequest(`/api/api-configs/${id}`, {
        method: 'DELETE'
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/api-configs'] });
      toast({
        title: "API Configuration Deleted",
        description: "The API configuration has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Deletion Failed",
        description: `Failed to delete API configuration: ${error}`,
        variant: "destructive",
      });
    },
  });
  
  const handleVerify = (reportId: number) => {
    setReportToVerify(reportId);
    
    toast({
      title: "Confirm Report Verification",
      description: (
        <div className="flex flex-col gap-2">
          <p>Are you sure you want to verify this report? This will make it publicly visible.</p>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={() => setReportToVerify(null)}>
              Cancel
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => {
                verifyMutation.mutate(reportId);
                setReportToVerify(null);
              }}
            >
              Verify
            </Button>
          </div>
        </div>
      ),
      duration: 10000,
    });
  };
  
  // API Configuration handlers
  const handleTestLookup = async (type: string, input: string) => {
    if (!input.trim()) return;
    
    try {
      const response = await apiRequest('/api/scam/check', {
        method: 'POST',
        body: JSON.stringify({ type, input })
      });
      setTestResult(response.result);
      toast({
        title: "Test Completed",
        description: `Scam lookup test completed for ${type}: ${input}`,
      });
    } catch (error) {
      toast({
        title: "Test Failed",
        description: `Scam lookup test failed: ${error}`,
        variant: "destructive",
      });
    }
  };
  
  const handleTestApi = async (config: any, customInput?: string) => {
    console.log('Testing API config:', config);
    
    // Add to testing state
    setTestingApiIds(prev => new Set(prev).add(config.id));
    
    const testInput = customInput || customTestInputs[config.id] || getTestInputForType(config.type);
    
    try {
      // Show loading state
      toast({
        title: "Testing API",
        description: `Testing ${config.name} with input: ${testInput}`,
      });
      
      const response = await apiRequest(`/api/api-configs/${config.id}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          type: config.type,
          testInput: testInput
        })
      });
      
      console.log('API test response:', response);
      
      const result = await response.json();
      
      // Store the result for display with API call details
      setApiTestResults(prev => ({
        ...prev,
        [config.id]: {
          ...result,
          timestamp: new Date().toISOString(),
          testInput: testInput,
          apiCallDetails: result.testResult?.apiCallDetails || null
        }
      }));
      
      if (result.success) {
        toast({
          title: "API Test Successful",
          description: `${config.name} is working correctly. Check results below.`,
        });
      } else {
        toast({
          title: "API Test Failed",
          description: `${config.name} test failed: ${result.message || 'Unknown error'}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('API test error:', error);
      
      // Store error result
      setApiTestResults(prev => ({
        ...prev,
        [config.id]: {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
          testInput: testInput
        }
      }));
      
      toast({
        title: "API Test Error",
        description: `Test failed for ${config.name}: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    } finally {
      // Remove from testing state
      setTestingApiIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(config.id);
        return newSet;
      });
    }
  };

  // Helper function to get test input based on API type
  const getTestInputForType = (type: string): string => {
    switch (type) {
      case 'phone':
        return '+1234567890';
      case 'email':
        return 'test@example.com';
      case 'url':
        return 'https://example.com';
      case 'ip':
        return '192.168.1.1';
      case 'domain':
        return 'example.com';
      default:
        return 'test-input';
    }
  };
  
  const handleEditApiConfig = (config: any) => {
    console.log('Edit API config:', config);
    setEditingApiConfig(config);
    
    // Populate the edit form with existing values
    apiEditForm.reset({
      name: config.name || '',
      type: config.type || 'phone',
      url: config.url || '',
      apiKey: config.apiKey || '',
      description: config.description || '',
      rateLimit: config.rateLimit || 100,
      timeout: config.timeout || 30,
      enabled: config.enabled !== false,
      parameterMapping: config.parameterMapping || '{\n  "phone": "{{input}}",\n  "key": "{{apiKey}}"\n}',
      headers: config.headers || '{\n  "Content-Type": "application/json"\n}'
    });
    
    setIsApiEditDialogOpen(true);
  };

  const onSubmitApiEdit = (data: any) => {
    console.log('Form data being submitted for edit:', data);
    if (!data.name || !data.type || !data.url || !data.apiKey) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Name, Type, URL, API Key)",
        variant: "destructive",
      });
      return;
    }
    apiUpdateMutation.mutate({ ...data, id: editingApiConfig.id });
  };
  
  const handleDeleteApiConfig = (configId: number) => {
    if (confirm('Are you sure you want to delete this API configuration?')) {
      apiDeleteMutation.mutate(configId);
    }
  };
  
  const onSubmitApiCreate = (data: any) => {
    console.log('Form data being submitted:', data);
    // Ensure all required fields are present
    if (!data.name || !data.type || !data.url || !data.apiKey) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Name, Type, URL, API Key)",
        variant: "destructive",
      });
      return;
    }
    apiCreateMutation.mutate(data);
  };
  
  // Helper to get scam identifier based on type
  const getScamIdentifier = (report: ScamReport) => {
    switch (report.scamType) {
      case 'phone':
        return report.scamPhoneNumber;
      case 'email':
        return report.scamEmail;
      case 'business':
        return report.scamBusinessName;
      default:
        return 'Unknown';
    }
  };
  
  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      <Tabs defaultValue="pending" onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="pending">Pending Reports</TabsTrigger>
          <TabsTrigger value="verified">Verified Reports</TabsTrigger>
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
        
        <TabsContent value="pending" className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Pending Reports</h2>
          {isPendingLoading ? (
            <div className="text-center py-8">Loading pending reports...</div>
          ) : pendingReports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircleIcon className="h-12 w-12 mx-auto mb-2" />
              <p>No pending reports found</p>
              <p className="text-sm mt-2">All scam reports have been reviewed</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {pendingReports.map((report: ScamReport) => (
                <Card key={report.id} className="border-yellow-200">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>
                          <p className="text-sm text-muted-foreground">ID: #{report.id}</p>
                        </div>
                        <CardTitle className="flex items-center gap-2">
                          <Badge variant="outline">{report.scamType}</Badge>
                          {getScamIdentifier(report)}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Reported on {format(new Date(report.reportedAt), 'MMM d, yyyy')} by {report.user?.displayName || 'Unknown User'}
                        </p>
                      </div>
                      <div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:text-red-800"
                          onClick={() => window.open(`/reports/${report.id}`, '_blank')}
                        >
                          <AlertTriangleIcon className="h-4 w-4 mr-1" /> Unverified
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-2">
                      <div>
                        <span className="font-medium">Incident Date:</span> {format(new Date(report.incidentDate), 'MMM d, yyyy')}
                      </div>
                      <div>
                        <span className="font-medium">Location:</span> {report.location}
                      </div>
                    </div>
                    <p className="text-sm">
                      <span className="font-medium">Description:</span> {report.description}
                    </p>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2 justify-end">
                      <Button 
                        variant="outline"
                        onClick={() => window.open(`/reports/${report.id}`, '_blank')}
                      >
                        <EyeIcon className="h-4 w-4 mr-2" /> View Details
                      </Button>
                      <Button 
                        variant="default"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleVerify(report.id)}
                        disabled={verifyMutation.isPending}
                      >
                        <CheckIcon className="h-4 w-4 mr-2" /> 
                        {verifyMutation.isPending ? 'Verifying...' : 'Approve & Verify'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="verified" className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Verified Reports</h2>
          {isVerifiedLoading ? (
            <div className="text-center py-8">Loading verified reports...</div>
          ) : !verifiedReports || !Array.isArray(verifiedReports) || verifiedReports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckIcon className="h-12 w-12 mx-auto mb-2" />
              <p>No verified reports found</p>
              <p className="text-sm mt-2">Verified reports will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {verifiedReports.map((report: ScamReport) => (
                <Card key={report.id} className="border-green-200">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Verified</Badge>
                          <p className="text-sm text-muted-foreground">ID: #{report.id}</p>
                        </div>
                        <CardTitle className="flex items-center gap-2">
                          <Badge variant="outline">{report.scamType}</Badge>
                          {getScamIdentifier(report)}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Verified on {report.verifiedAt ? format(new Date(report.verifiedAt), 'MMM d, yyyy') : 'Unknown'} 
                        </p>
                      </div>
                      <div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800"
                          onClick={() => window.open(`/reports/${report.id}`, '_blank')}
                        >
                          <CheckIcon className="h-4 w-4 mr-1" /> Verified
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-2">
                      <div>
                        <span className="font-medium">Incident Date:</span> {format(new Date(report.incidentDate), 'MMM d, yyyy')}
                      </div>
                      <div>
                        <span className="font-medium">Location:</span> {report.location}
                      </div>
                    </div>
                    <p className="text-sm">
                      <span className="font-medium">Description:</span> {report.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="videos" className="mt-6">
          <ScamVideoManager />
        </TabsContent>
        
        <TabsContent value="security" className="mt-6">
          <AdminSecurityChecklistPanel />
        </TabsContent>
        
        <TabsContent value="api-configs" className="mt-6">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Scam Detection API Configuration</h2>
              <Button onClick={() => setIsApiCreateDialogOpen(true)}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Add API Configuration
              </Button>
            </div>

            {/* API Testing Section */}
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
                      <Button onClick={() => handleTestLookup('phone', testPhone)} size="sm">
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
                      <Button onClick={() => handleTestLookup('email', testEmail)} size="sm">
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
                      <Button onClick={() => handleTestLookup('url', testUrl)} size="sm">
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
                      <Badge variant={testResult.fraud_score > 75 ? "destructive" : testResult.fraud_score > 50 ? "secondary" : "default"}>
                        Risk Score: {testResult.fraud_score || 'N/A'}
                      </Badge>
                      <Badge variant={testResult.valid ? "default" : "destructive"}>
                        {testResult.valid ? 'Valid' : 'Invalid'}
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
                      <div className="text-sm text-muted-foreground">Loading API configurations...</div>
                    </div>
                  ) : apiConfigs.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-sm text-muted-foreground">No API configurations found. Create one to get started.</div>
                    </div>
                  ) : (
                    apiConfigs.map((config: any) => (
                    <div key={config.id} className="border rounded-lg">
                      <div className="flex items-center justify-between p-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{config.name}</h4>
                            <Badge variant="outline">{config.type}</Badge>
                            <Badge variant={config.enabled ? "default" : "secondary"}>
                              {config.enabled ? 'Enabled' : 'Disabled'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{config.description}</p>
                          <div className="text-xs text-muted-foreground mt-1">
                            Rate limit: {config.rateLimit}/min • Timeout: {config.timeout}s
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setShowCustomInputs(prev => ({ ...prev, [config.id]: !prev[config.id] }))}
                          >
                            {showCustomInputs[config.id] ? 'Hide Input' : 'Custom Test'}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleTestApi(config)}
                            disabled={testingApiIds.has(config.id)}
                          >
                            {testingApiIds.has(config.id) ? 'Testing...' : 'Test'}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleEditApiConfig(config)}>
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDeleteApiConfig(config.id)}
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
                                value={customTestInputs[config.id] || ''}
                                onChange={(e) => setCustomTestInputs(prev => ({ ...prev, [config.id]: e.target.value }))}
                                placeholder={`Enter ${config.type} to test (e.g., ${getTestInputForType(config.type)})`}
                                className="flex-1 px-3 py-2 text-sm border border-blue-200 dark:border-blue-700 rounded bg-white dark:bg-slate-800"
                              />
                              <Button 
                                size="sm" 
                                onClick={() => handleTestApi(config, customTestInputs[config.id])}
                                disabled={testingApiIds.has(config.id)}
                              >
                                {testingApiIds.has(config.id) ? 'Testing...' : 'Test Now'}
                              </Button>
                            </div>
                            <div className="text-xs text-blue-600 dark:text-blue-400">
                              Leave empty to use default test value: {getTestInputForType(config.type)}
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
                                {new Date(apiTestResults[config.id].timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium">Input:</span>
                                <code className="text-xs bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded">
                                  {apiTestResults[config.id].testInput}
                                </code>
                              </div>
                              
                              {/* API Call Details Section */}
                              {apiTestResults[config.id].apiCallDetails && (
                                <div className="mt-3 p-3 bg-slate-100 dark:bg-slate-800 rounded">
                                  <h6 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    API Call Details
                                  </h6>
                                  <div className="space-y-1">
                                    <div className="flex items-start gap-2">
                                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400 min-w-[50px]">Method:</span>
                                      <code className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">
                                        {apiTestResults[config.id].apiCallDetails.method}
                                      </code>
                                    </div>
                                    <div className="flex items-start gap-2">
                                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400 min-w-[50px]">URL:</span>
                                      <code className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded flex-1 break-all">
                                        {apiTestResults[config.id].apiCallDetails.url}
                                      </code>
                                    </div>
                                    {Object.keys(apiTestResults[config.id].apiCallDetails.headers || {}).length > 0 && (
                                      <details className="mt-2">
                                        <summary className="text-xs font-medium cursor-pointer text-slate-600 dark:text-slate-400">
                                          Headers ({Object.keys(apiTestResults[config.id].apiCallDetails.headers).length})
                                        </summary>
                                        <div className="mt-1 p-2 bg-slate-50 dark:bg-slate-900 rounded">
                                          <pre className="text-xs text-slate-700 dark:text-slate-300">
                                            {JSON.stringify(apiTestResults[config.id].apiCallDetails.headers, null, 2)}
                                          </pre>
                                        </div>
                                      </details>
                                    )}
                                    {apiTestResults[config.id].apiCallDetails.body && (
                                      <details className="mt-2">
                                        <summary className="text-xs font-medium cursor-pointer text-slate-600 dark:text-slate-400">
                                          Request Body
                                        </summary>
                                        <div className="mt-1 p-2 bg-slate-50 dark:bg-slate-900 rounded">
                                          <pre className="text-xs text-slate-700 dark:text-slate-300">
                                            {typeof apiTestResults[config.id].apiCallDetails.body === 'string' 
                                              ? apiTestResults[config.id].apiCallDetails.body
                                              : JSON.stringify(apiTestResults[config.id].apiCallDetails.body, null, 2)}
                                          </pre>
                                        </div>
                                      </details>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium">Status:</span>
                                <Badge 
                                  variant={apiTestResults[config.id].success ? "default" : "destructive"}
                                  className="text-xs"
                                >
                                  {apiTestResults[config.id].success ? 'Success' : 'Failed'}
                                </Badge>
                              </div>
                              
                              {apiTestResults[config.id].testResult && (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium">Provider:</span>
                                    <span className="text-xs">{apiTestResults[config.id].testResult.provider}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium">Status:</span>
                                    <Badge variant="outline" className="text-xs">
                                      {apiTestResults[config.id].testResult.status}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium">Risk Score:</span>
                                    <span className="text-xs">{apiTestResults[config.id].testResult.riskScore}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium">Reputation:</span>
                                    <span className="text-xs">{apiTestResults[config.id].testResult.reputation}</span>
                                  </div>
                                </div>
                              )}
                              
                              {apiTestResults[config.id].error && (
                                <div className="mt-2">
                                  <span className="text-xs font-medium text-red-600 dark:text-red-400">Error:</span>
                                  <div className="text-xs text-red-600 dark:text-red-400 mt-1 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                                    {apiTestResults[config.id].error}
                                  </div>
                                </div>
                              )}
                              
                              {apiTestResults[config.id].testResult?.details && (
                                <details className="mt-2">
                                  <summary className="text-xs font-medium cursor-pointer text-slate-600 dark:text-slate-400">
                                    Raw Response
                                  </summary>
                                  <div className="mt-2 p-2 bg-slate-100 dark:bg-slate-800 rounded">
                                    <pre className="text-xs text-slate-700 dark:text-slate-300 overflow-x-auto">
                                      {JSON.stringify(apiTestResults[config.id].testResult.details, null, 2)}
                                    </pre>
                                  </div>
                                </details>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )))}
                  
                  {isApiConfigsLoading && (
                    <div className="text-center py-8 text-muted-foreground">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                      <p>Loading API configurations...</p>
                    </div>
                  )}
                  
                  {apiConfigsError && (
                    <div className="text-center py-8 text-red-600">
                      <AlertCircleIcon className="h-12 w-12 mx-auto mb-2" />
                      <p>Error loading API configurations</p>
                      <p className="text-sm mt-2">{apiConfigsError.message}</p>
                      <p className="text-xs mt-2 text-gray-600">Check authentication and try refreshing the page</p>
                    </div>
                  )}
                  
                  {apiConfigs.length === 0 && !isApiConfigsLoading && !apiConfigsError && (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertCircleIcon className="h-12 w-12 mx-auto mb-2" />
                      <p>No API configurations found</p>
                      <p className="text-sm">Add your first API configuration to enable scam lookup</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* API Create Dialog */}
            <Dialog open={isApiCreateDialogOpen} onOpenChange={setIsApiCreateDialogOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add API Configuration</DialogTitle>
                </DialogHeader>
                <form onSubmit={apiCreateForm.handleSubmit(onSubmitApiCreate)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="api-name">API Name *</Label>
                      <Input
                        id="api-name"
                        {...apiCreateForm.register("name", { required: "Name is required" })}
                        placeholder="IPQualityScore Phone"
                      />
                      {apiCreateForm.formState.errors.name && (
                        <p className="text-xs text-red-500 mt-1">{apiCreateForm.formState.errors.name.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="api-type">Type *</Label>
                      <Select
                        value={apiCreateForm.watch("type") || "phone"}
                        onValueChange={(value) => {
                          apiCreateForm.setValue("type", value);
                          // Update parameter mapping template based on type
                          const templates: Record<string, string> = {
                            phone: '{\n  "phone": "{{input}}",\n  "key": "{{apiKey}}"\n}',
                            email: '{\n  "email": "{{input}}",\n  "key": "{{apiKey}}"\n}',
                            url: '{\n  "url": "{{input}}",\n  "key": "{{apiKey}}"\n}',
                            ip: '{\n  "ip": "{{input}}",\n  "key": "{{apiKey}}"\n}',
                            domain: '{\n  "domain": "{{input}}",\n  "key": "{{apiKey}}"\n}'
                          };
                          apiCreateForm.setValue("parameterMapping", templates[value] || templates.phone);
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
                        <p className="text-xs text-red-500 mt-1">{apiCreateForm.formState.errors.type.message}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="api-url">API URL *</Label>
                    <Input
                      id="api-url"
                      {...apiCreateForm.register("url", { required: "URL is required" })}
                      placeholder="https://api.example.com/v1/check"
                    />
                    {apiCreateForm.formState.errors.url && (
                      <p className="text-xs text-red-500 mt-1">{apiCreateForm.formState.errors.url.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="api-key">API Key *</Label>
                    <Input
                      id="api-key"
                      type="password"
                      {...apiCreateForm.register("apiKey", { required: "API Key is required" })}
                      placeholder="your-api-key-here"
                    />
                    {apiCreateForm.formState.errors.apiKey && (
                      <p className="text-xs text-red-500 mt-1">{apiCreateForm.formState.errors.apiKey.message}</p>
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
                      placeholder='{"phone": "{{input}}", "key": "{{apiKey}}"}'
                      rows={4}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Use {`{{input}}`} for user input and {`{{apiKey}}`} for the API key. These will be replaced at runtime.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="api-headers">Headers (JSON)</Label>
                    <Textarea
                      id="api-headers"
                      {...apiCreateForm.register("headers")}
                      placeholder='{"Content-Type": "application/json", "Authorization": "Bearer {{apiKey}}"}'
                      rows={3}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Optional HTTP headers for the API request.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="api-rate-limit">Rate Limit (per minute)</Label>
                      <Input
                        id="api-rate-limit"
                        type="number"
                        {...apiCreateForm.register("rateLimit", { valueAsNumber: true })}
                        placeholder="100"
                      />
                    </div>
                    <div>
                      <Label htmlFor="api-timeout">Timeout (seconds)</Label>
                      <Input
                        id="api-timeout"
                        type="number"
                        {...apiCreateForm.register("timeout", { valueAsNumber: true })}
                        placeholder="30"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsApiCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={apiCreateMutation.isPending}>
                      {apiCreateMutation.isPending ? 'Creating...' : 'Create API Config'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {/* Edit API Configuration Dialog */}
            <Dialog open={isApiEditDialogOpen} onOpenChange={setIsApiEditDialogOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Edit API Configuration</DialogTitle>
                </DialogHeader>
                <form onSubmit={apiEditForm.handleSubmit(onSubmitApiEdit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-api-name">API Name *</Label>
                      <Input
                        id="edit-api-name"
                        {...apiEditForm.register("name", { required: "Name is required" })}
                        placeholder="IPQualityScore Phone"
                      />
                      {apiEditForm.formState.errors.name && (
                        <p className="text-xs text-red-500 mt-1">{apiEditForm.formState.errors.name.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="edit-api-type">Type *</Label>
                      <Select
                        value={apiEditForm.watch("type") || "phone"}
                        onValueChange={(value) => {
                          apiEditForm.setValue("type", value);
                          // Update parameter mapping template based on type
                          const templates: Record<string, string> = {
                            phone: '{\n  "phone": "{{input}}",\n  "key": "{{apiKey}}"\n}',
                            email: '{\n  "email": "{{input}}",\n  "key": "{{apiKey}}"\n}',
                            url: '{\n  "url": "{{input}}",\n  "key": "{{apiKey}}"\n}',
                            ip: '{\n  "ip": "{{input}}",\n  "key": "{{apiKey}}"\n}',
                            domain: '{\n  "domain": "{{input}}",\n  "key": "{{apiKey}}"\n}'
                          };
                          apiEditForm.setValue("parameterMapping", templates[value] || templates.phone);
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
                      {apiEditForm.formState.errors.type && (
                        <p className="text-xs text-red-500 mt-1">{apiEditForm.formState.errors.type.message}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="edit-api-url">API URL *</Label>
                    <Input
                      id="edit-api-url"
                      {...apiEditForm.register("url", { required: "URL is required" })}
                      placeholder="https://api.example.com/v1/check"
                    />
                    {apiEditForm.formState.errors.url && (
                      <p className="text-xs text-red-500 mt-1">{apiEditForm.formState.errors.url.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="edit-api-key">API Key *</Label>
                    <Input
                      id="edit-api-key"
                      type="password"
                      {...apiEditForm.register("apiKey", { required: "API Key is required" })}
                      placeholder="your-api-key-here"
                    />
                    {apiEditForm.formState.errors.apiKey && (
                      <p className="text-xs text-red-500 mt-1">{apiEditForm.formState.errors.apiKey.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="edit-api-description">Description</Label>
                    <Textarea
                      id="edit-api-description"
                      {...apiEditForm.register("description")}
                      placeholder="Brief description of this API service"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-api-params">Parameter Mapping (JSON)</Label>
                    <Textarea
                      id="edit-api-params"
                      {...apiEditForm.register("parameterMapping")}
                      placeholder='{"phone": "{{input}}", "key": "{{apiKey}}"}'
                      rows={4}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Use {`{{input}}`} for user input and {`{{apiKey}}`} for the API key. These will be replaced at runtime.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="edit-api-headers">Headers (JSON)</Label>
                    <Textarea
                      id="edit-api-headers"
                      {...apiEditForm.register("headers")}
                      placeholder='{"Content-Type": "application/json", "Authorization": "Bearer {{apiKey}}"}'
                      rows={3}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Optional HTTP headers for the API request.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="edit-api-rate-limit">Rate Limit (per minute)</Label>
                      <Input
                        id="edit-api-rate-limit"
                        type="number"
                        {...apiEditForm.register("rateLimit", { valueAsNumber: true })}
                        placeholder="100"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-api-timeout">Timeout (seconds)</Label>
                      <Input
                        id="edit-api-timeout"
                        type="number"
                        {...apiEditForm.register("timeout", { valueAsNumber: true })}
                        placeholder="30"
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
                    <Button type="button" variant="outline" onClick={() => setIsApiEditDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={apiUpdateMutation.isPending}>
                      {apiUpdateMutation.isPending ? 'Updating...' : 'Update API Config'}
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

// Admin Security Checklist Panel Component
function AdminSecurityChecklistPanel() {
  const queryClient = useQueryClient();
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Fetch checklist items
  const { data: checklistItems = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/security-checklist"],
  });

  // Filter items by category
  const filteredItems = selectedCategory === "all" 
    ? checklistItems 
    : checklistItems.filter((item: any) => item.category === selectedCategory);

  // Get unique categories
  const categories = React.useMemo(() => {
    const cats = Array.from(new Set(checklistItems.map((item: any) => item.category)));
    return ["all", ...cats];
  }, [checklistItems]);

  // Edit form
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

  // Create form
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
      sortOrder: checklistItems.length + 1,
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
      return apiRequest(`/api/security-checklist/${editingItem.id}`, {
        method: 'PUT',
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/security-checklist"] });
      setIsEditDialogOpen(false);
      setEditingItem(null);
      toast({
        title: "Component Updated",
        description: "Security checklist component has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: `Failed to update component: ${error}`,
        variant: "destructive",
      });
    },
  });

  const createItemMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/security-checklist', {
        method: 'POST',
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/security-checklist"] });
      setIsCreateDialogOpen(false);
      createForm.reset();
      toast({
        title: "Component Created",
        description: "New security checklist component has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Creation Failed",
        description: `Failed to create component: ${error}`,
        variant: "destructive",
      });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: number) => {
      return apiRequest(`/api/security-checklist/${itemId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/security-checklist"] });
      toast({
        title: "Component Deleted",
        description: "Security checklist component has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Deletion Failed",
        description: `Failed to delete component: ${error}`,
        variant: "destructive",
      });
    },
  });

  const onSubmitEdit = (values: any) => {
    updateItemMutation.mutate(values);
  };

  const onSubmitCreate = (values: any) => {
    createItemMutation.mutate(values);
  };

  const handleDeleteItem = (itemId: number) => {
    if (confirm('Are you sure you want to delete this security checklist item?')) {
      deleteItemMutation.mutate(itemId);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading security checklist...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Security Checklist Management</h2>
          <p className="text-sm text-muted-foreground">Manage digital security checklist items</p>
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
            <div className="text-2xl font-bold text-blue-600">{checklistItems.length}</div>
            <div className="text-xs text-muted-foreground">Total Components</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {checklistItems.filter((item: any) => item.priority === 'high').length}
            </div>
            <div className="text-xs text-muted-foreground">High Priority</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {checklistItems.filter((item: any) => item.toolLaunchUrl).length}
            </div>
            <div className="text-xs text-muted-foreground">With Tools</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {checklistItems.filter((item: any) => item.youtubeVideoUrl).length}
            </div>
            <div className="text-xs text-muted-foreground">With Videos</div>
          </CardContent>
        </Card>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category)}
            className="capitalize"
          >
            {category.replace('_', ' ')}
          </Button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item: any) => (
          <Card key={item.id} className="relative">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-sm font-medium pr-8">{item.title}</CardTitle>
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
                <Badge variant={item.priority === 'high' ? 'destructive' : item.priority === 'medium' ? 'default' : 'secondary'} className="text-xs">
                  {item.priority}
                </Badge>
                <Badge variant="outline" className="capitalize text-xs">
                  {item.category?.replace('_', ' ')}
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
                <span className="font-medium">Time:</span> {item.estimatedTimeMinutes} min
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
          <form onSubmit={createForm.handleSubmit(onSubmitCreate)} className="space-y-4">
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
                  onValueChange={(value) => createForm.setValue("category", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="account_security">Account Security</SelectItem>
                    <SelectItem value="password_security">Password Security</SelectItem>
                    <SelectItem value="financial_security">Financial Security</SelectItem>
                    <SelectItem value="network_security">Network Security</SelectItem>
                    <SelectItem value="device_security">Device Security</SelectItem>
                    <SelectItem value="communication_security">Communication Security</SelectItem>
                    <SelectItem value="privacy_settings">Privacy Settings</SelectItem>
                    <SelectItem value="data_protection">Data Protection</SelectItem>
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
                  onValueChange={(value) => createForm.setValue("priority", value)}
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
                  {...createForm.register("estimatedTimeMinutes", { valueAsNumber: true })}
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
              <Label htmlFor="create-tool-url">Tool Launch URL (optional)</Label>
              <Input
                id="create-tool-url"
                {...createForm.register("toolLaunchUrl")}
                placeholder="https://tool.example.com"
              />
            </div>
            <div>
              <Label htmlFor="create-video-url">YouTube Video URL (optional)</Label>
              <Input
                id="create-video-url"
                {...createForm.register("youtubeVideoUrl")}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createItemMutation.isPending}>
                {createItemMutation.isPending ? 'Creating...' : 'Create Component'}
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
          <form onSubmit={editForm.handleSubmit(onSubmitEdit)} className="space-y-4">
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
                  onValueChange={(value) => editForm.setValue("category", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="account_security">Account Security</SelectItem>
                    <SelectItem value="password_security">Password Security</SelectItem>
                    <SelectItem value="financial_security">Financial Security</SelectItem>
                    <SelectItem value="network_security">Network Security</SelectItem>
                    <SelectItem value="device_security">Device Security</SelectItem>
                    <SelectItem value="communication_security">Communication Security</SelectItem>
                    <SelectItem value="privacy_settings">Privacy Settings</SelectItem>
                    <SelectItem value="data_protection">Data Protection</SelectItem>
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
                  onValueChange={(value) => editForm.setValue("priority", value)}
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
                  {...editForm.register("estimatedTimeMinutes", { valueAsNumber: true })}
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
              <Label htmlFor="edit-video-url">YouTube Video URL (optional)</Label>
              <Input
                id="edit-video-url"
                {...editForm.register("youtubeVideoUrl")}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateItemMutation.isPending}>
                {updateItemMutation.isPending ? 'Updating...' : 'Update Component'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}