import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Search, Shield, Phone, Mail, Globe, Clock, CheckCircle, XCircle } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface ApiConfig {
  id: number;
  name: string;
  type: string;
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
  type?: string;
  value?: string;
  error?: string;
}

export default function ScamLookup() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [activeTab, setActiveTab] = useState('phone');
  const [results, setResults] = useState<Record<string, LookupResult>>({});

  // Fetch available API configurations (public endpoint - no auth required)
  const { data: apiConfigs = [], isLoading: isLoadingConfigs } = useQuery<ApiConfig[]>({
    queryKey: ['/api/api-configs/public'],
    queryFn: async () => {
      const response = await apiRequest('/api/api-configs/public');
      return response.json();
    }
  });

  // Mutation for performing lookups
  const lookupMutation = useMutation({
    mutationFn: async ({ type, value }: { type: string; value: string }) => {
      console.log('🔍 Scam lookup request:', { type, value });
      try {
        const response = await apiRequest('/api/scam-lookup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ type, value })
        });
        const result = await response.json();
        console.log('📡 Scam lookup response:', result);
        return result;
      } catch (error) {
        console.error('❌ Scam lookup error:', error);
        // If it's a 400 error, try to parse the error response
        if (error instanceof Error && error.message.includes('400:')) {
          const errorText = error.message.replace('400: ', '');
          try {
            const errorData = JSON.parse(errorText);
            return { success: false, error: errorData.error || 'Request validation failed' };
          } catch {
            return { success: false, error: errorText || 'Invalid request' };
          }
        }
        throw error;
      }
    },
    onSuccess: (data: LookupResponse, variables) => {
      console.log('✅ Mutation success:', { data, variables });
      if (data.success && data.results) {
        // Store results from all APIs
        const newResults: Record<string, LookupResult> = {};
        data.results.forEach(result => {
          newResults[`${variables.type}_${result.apiId || result.apiName}`] = result;
        });
        setResults(prev => ({
          ...prev,
          ...newResults
        }));
      } else {
        // Handle error case
        setResults(prev => ({
          ...prev,
          [variables.type]: {
            success: false,
            error: data.error || 'Lookup failed',
            apiName: 'System'
          }
        }));
      }
    },
    onError: (error, variables) => {
      console.error('💥 Mutation error:', { error, variables });
      setResults(prev => ({
        ...prev,
        [variables.type]: {
          success: false,
          error: error instanceof Error ? error.message : 'Network error occurred',
          apiName: 'System'
        }
      }));
    }
  });

  const handleLookup = async (type: string, value: string) => {
    console.log('🎯 Handle lookup called:', { type, value: `"${value}"`, trimmed: `"${value.trim()}"` });
    if (!value.trim()) {
      console.log('❌ Empty value, skipping lookup');
      return;
    }

    const relevantConfigs = apiConfigs.filter(config => 
      config.type === type && config.enabled
    );

    if (relevantConfigs.length === 0) {
      setResults(prev => ({
        ...prev,
        [type]: {
          success: false,
          error: `No ${type} lookup services are currently available`,
          apiName: 'System'
        }
      }));
      return;
    }

    // Clear previous results for this type
    setResults(prev => {
      const newResults = { ...prev };
      Object.keys(newResults).forEach(key => {
        if (key.startsWith(`${type}_`)) {
          delete newResults[key];
        }
      });
      return newResults;
    });

    // Perform lookup with all available APIs for this type in a single request
    lookupMutation.mutate({ type, value });
  };

  const formatResult = (result: any, type: string) => {
    if (!result || typeof result !== 'object') {
      return <div className="text-sm text-gray-600">No detailed information available</div>;
    }

    // Enhanced result formatting with better visual hierarchy
    const getRiskLevel = (score: number) => {
      if (score >= 75) return { level: 'High Risk', color: 'text-red-600 bg-red-50 border-red-200', icon: '⚠️' };
      if (score >= 50) return { level: 'Medium Risk', color: 'text-yellow-600 bg-yellow-50 border-yellow-200', icon: '⚡' };
      return { level: 'Low Risk', color: 'text-green-600 bg-green-50 border-green-200', icon: '✅' };
    };

    const getReputationBadge = (reputation: string) => {
      const rep = reputation?.toLowerCase();
      if (rep === 'malicious' || rep === 'bad') return 'bg-red-100 text-red-800 border-red-200';
      if (rep === 'suspicious' || rep === 'medium') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      if (rep === 'good' || rep === 'clean') return 'bg-green-100 text-green-800 border-green-200';
      return 'bg-gray-100 text-gray-800 border-gray-200';
    };

    return (
      <div className="space-y-4">
        {/* Risk Score Section */}
        {(result.risk_score !== undefined || result.fraud_score !== undefined) && (
          <div className="border rounded-lg p-3 bg-gray-50">
            <h4 className="font-semibold text-sm text-gray-700 mb-2">Risk Assessment</h4>
            {result.risk_score !== undefined && (
              <div className="mb-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">Risk Score:</span>
                  <span className="font-semibold">{result.risk_score}/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${result.risk_score >= 75 ? 'bg-red-500' : result.risk_score >= 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(result.risk_score, 100)}%` }}
                  ></div>
                </div>
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border mt-2 ${getRiskLevel(result.risk_score).color}`}>
                  <span className="mr-1">{getRiskLevel(result.risk_score).icon}</span>
                  {getRiskLevel(result.risk_score).level}
                </div>
              </div>
            )}
            {result.fraud_score !== undefined && (
              <div className="text-sm">
                <span className="font-medium">Fraud Score: </span>
                <span className={result.fraud_score >= 75 ? 'text-red-600 font-semibold' : result.fraud_score >= 50 ? 'text-yellow-600 font-medium' : 'text-green-600'}>
                  {result.fraud_score}/100
                </span>
              </div>
            )}
          </div>
        )}

        {/* Reputation Section */}
        {result.reputation && (
          <div className="border rounded-lg p-3 bg-gray-50">
            <h4 className="font-semibold text-sm text-gray-700 mb-2">Reputation</h4>
            <Badge className={`${getReputationBadge(result.reputation)} border`}>
              {result.reputation.charAt(0).toUpperCase() + result.reputation.slice(1)}
            </Badge>
          </div>
        )}

        {/* Details Section */}
        <div className="border rounded-lg p-3 bg-gray-50">
          <h4 className="font-semibold text-sm text-gray-700 mb-2">Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            {result.valid !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-600">Valid:</span>
                <span className={result.valid ? 'text-green-600' : 'text-red-600'}>
                  {result.valid ? '✓ Yes' : '✗ No'}
                </span>
              </div>
            )}
            {result.carrier && (
              <div className="flex justify-between">
                <span className="text-gray-600">Carrier:</span>
                <span>{result.carrier}</span>
              </div>
            )}
            {result.country && (
              <div className="flex justify-between">
                <span className="text-gray-600">Country:</span>
                <span>{result.country}</span>
              </div>
            )}
            {result.region && (
              <div className="flex justify-between">
                <span className="text-gray-600">Region:</span>
                <span>{result.region}</span>
              </div>
            )}
            {result.line_type && (
              <div className="flex justify-between">
                <span className="text-gray-600">Line Type:</span>
                <span>{result.line_type}</span>
              </div>
            )}
            {result.mobile !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-600">Mobile:</span>
                <span className={result.mobile ? 'text-blue-600' : 'text-gray-600'}>
                  {result.mobile ? '📱 Yes' : 'No'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Security Indicators */}
        {(result.recent_abuse || result.bot_status || result.proxy) && (
          <div className="border rounded-lg p-3 bg-red-50 border-red-200">
            <h4 className="font-semibold text-sm text-red-700 mb-2">Security Alerts</h4>
            <div className="space-y-1 text-sm">
              {result.recent_abuse && (
                <div className="flex items-center text-red-600">
                  <span className="mr-2">🚨</span>
                  Recent abuse detected
                </div>
              )}
              {result.bot_status && (
                <div className="flex items-center text-orange-600">
                  <span className="mr-2">🤖</span>
                  Bot activity detected
                </div>
              )}
              {result.proxy && (
                <div className="flex items-center text-yellow-600">
                  <span className="mr-2">🌐</span>
                  Proxy connection detected
                </div>
              )}
            </div>
          </div>
        )}

        {/* Raw Data (Collapsed by default) */}
        <details className="border rounded-lg p-3">
          <summary className="font-semibold text-sm text-gray-700 cursor-pointer hover:text-gray-900">
            View Raw Response Data
          </summary>
          <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
            {JSON.stringify(result, null, 2)}
          </pre>
        </details>
      </div>
    );
  };

  const getTabIcon = (type: string) => {
    switch (type) {
      case 'phone': return <Phone className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'url': return <Globe className="h-4 w-4" />;
      default: return <Search className="h-4 w-4" />;
    }
  };

  const availableTypes = [...new Set(apiConfigs.map(config => config.type))];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Shield className="h-8 w-8 text-blue-500 mr-2" />
          <h1 className="text-3xl font-bold">Scam Lookup</h1>
        </div>
        <p className="text-muted-foreground">
          Check phone numbers, emails, and websites against our scam detection services
        </p>
      </div>

      {isLoadingConfigs ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <p>Loading available services...</p>
        </div>
      ) : apiConfigs.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">No Services Available</h3>
            <p className="text-muted-foreground">
              Scam lookup services are currently being configured. Please check back later.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            {availableTypes.includes('phone') && (
              <TabsTrigger value="phone" className="flex items-center gap-2">
                {getTabIcon('phone')}
                Phone
              </TabsTrigger>
            )}
            {availableTypes.includes('email') && (
              <TabsTrigger value="email" className="flex items-center gap-2">
                {getTabIcon('email')}
                Email
              </TabsTrigger>
            )}
            {availableTypes.includes('url') && (
              <TabsTrigger value="url" className="flex items-center gap-2">
                {getTabIcon('url')}
                Website
              </TabsTrigger>
            )}
          </TabsList>

          {availableTypes.includes('phone') && (
            <TabsContent value="phone" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Phone Number Lookup
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="phone"
                        placeholder="Enter phone number (e.g., +1234567890)"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                      />
                      <Button 
                        onClick={() => handleLookup('phone', phoneNumber)}
                        disabled={lookupMutation.isPending}
                      >
                        {lookupMutation.isPending ? 'Checking...' : 'Check'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {Object.entries(results).filter(([key]) => key.startsWith('phone_')).map(([key, result]) => (
                <Card key={key}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        {result.success ? 
                          <CheckCircle className="h-5 w-5 text-green-500" /> : 
                          <XCircle className="h-5 w-5 text-red-500" />
                        }
                        {result.apiName} Results
                      </span>
                      {result.responseTime && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {result.responseTime}ms
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {result.success ? (
                      formatResult(result.data, 'phone')
                    ) : (
                      <div className="text-red-600">{result.error}</div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          )}

          {availableTypes.includes('email') && (
            <TabsContent value="email" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Email Address Lookup
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter email address"
                        value={emailAddress}
                        onChange={(e) => setEmailAddress(e.target.value)}
                      />
                      <Button 
                        onClick={() => handleLookup('email', emailAddress)}
                        disabled={lookupMutation.isPending}
                      >
                        {lookupMutation.isPending ? 'Checking...' : 'Check'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {Object.entries(results).filter(([key]) => key.startsWith('email_')).map(([key, result]) => (
                <Card key={key}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        {result.success ? 
                          <CheckCircle className="h-5 w-5 text-green-500" /> : 
                          <XCircle className="h-5 w-5 text-red-500" />
                        }
                        {result.apiName} Results
                      </span>
                      {result.responseTime && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {result.responseTime}ms
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {result.success ? (
                      formatResult(result.data, 'email')
                    ) : (
                      <div className="text-red-600">{result.error}</div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          )}

          {availableTypes.includes('url') && (
            <TabsContent value="url" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Website Lookup
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="website">Website URL</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="website"
                        placeholder="Enter website URL (e.g., https://example.com)"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                      />
                      <Button 
                        onClick={() => handleLookup('url', website)}
                        disabled={lookupMutation.isPending}
                      >
                        {lookupMutation.isPending ? 'Checking...' : 'Check'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {Object.entries(results).filter(([key]) => key.startsWith('url_')).map(([key, result]) => (
                <Card key={key}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        {result.success ? 
                          <CheckCircle className="h-5 w-5 text-green-500" /> : 
                          <XCircle className="h-5 w-5 text-red-500" />
                        }
                        {result.apiName} Results
                      </span>
                      {result.responseTime && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {result.responseTime}ms
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {result.success ? (
                      formatResult(result.data, 'url')
                    ) : (
                      <div className="text-red-600">{result.error}</div>
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
        <p className="text-sm text-muted-foreground">
          This service uses multiple third-party APIs to provide comprehensive scam detection. 
          Results are provided for informational purposes only.
        </p>
      </div>
    </div>
  );
}