import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Search, Shield, Phone, Mail, Globe, Clock, CheckCircle, XCircle, Lock, LogIn } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'wouter';

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
  const { user } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [activeTab, setActiveTab] = useState('phone');
  const [results, setResults] = useState<Record<string, LookupResult>>({});

  // Check if user is authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Lock className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle className="text-2xl font-bold">Login Required</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-gray-600">
                  You need to be logged in to access the scam lookup feature.
                </p>
                <p className="text-sm text-gray-500">
                  This service is available exclusively to registered users to ensure quality and prevent abuse.
                </p>
                <div className="flex gap-3 justify-center">
                  <Link to="/login">
                    <Button className="flex items-center gap-2">
                      <LogIn className="w-4 h-4" />
                      Login
                    </Button>
                  </Link>
                  <Link to="/signup">
                    <Button variant="outline" className="flex items-center gap-2">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

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
      console.log('📊 Processing response data:', { data, hasResults: !!data.results, resultsLength: data.results?.length });
      if (data.success && data.results && Array.isArray(data.results)) {
        // Store results from all APIs
        const newResults: Record<string, LookupResult> = {};
        data.results.forEach((result, index) => {
          console.log(`📋 Processing result ${index}:`, result);
          // Create clean unique key for each result (remove spaces and special chars)
          const cleanApiName = (result.apiName || 'unknown').replace(/[^a-zA-Z0-9]/g, '_');
          const resultKey = `${variables.type}_${cleanApiName}_${index}`;
          newResults[resultKey] = result;
        });
        console.log('💾 Setting new results:', newResults);
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
    console.log('🎨 Formatting result:', { result, type });
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

    // Extract scores from result data - handle nested details object
    const riskScore = result.riskScore || result.details?.risk_score || result.details?.fraud_score || 0;
    const fraudScore = result.details?.fraud_score;
    const reputation = result.reputation;
    const status = result.status;

    return (
      <div className="space-y-4">
        {/* Basic Status */}
        <div className="border rounded-lg p-3 bg-gray-50">
          <h4 className="font-semibold text-sm text-gray-700 mb-2">Security Status</h4>
          <div className="flex items-center gap-2">
            <Badge className={status === 'safe' ? 'bg-green-100 text-green-800' : status === 'risky' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}>
              {status || 'Unknown'}
            </Badge>
            {reputation && reputation !== 'unknown' && (
              <Badge className={getReputationBadge(reputation)}>
                {reputation.charAt(0).toUpperCase() + reputation.slice(1)}
              </Badge>
            )}
          </div>
        </div>

        {/* Risk Score Section */}
        {(riskScore > 0 || fraudScore !== undefined) && (
          <div className="border rounded-lg p-3 bg-gray-50">
            <h4 className="font-semibold text-sm text-gray-700 mb-2">Risk Assessment</h4>
            {riskScore > 0 && (
              <div className="mb-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">Risk Score:</span>
                  <span className="font-semibold">{riskScore}/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${riskScore >= 75 ? 'bg-red-500' : riskScore >= 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(riskScore, 100)}%` }}
                  ></div>
                </div>
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border mt-2 ${getRiskLevel(riskScore).color}`}>
                  <span className="mr-1">{getRiskLevel(riskScore).icon}</span>
                  {getRiskLevel(riskScore).level}
                </div>
              </div>
            )}
            {fraudScore !== undefined && fraudScore > 0 && (
              <div className="text-sm">
                <span className="font-medium">Fraud Score: </span>
                <span className={fraudScore >= 75 ? 'text-red-600 font-semibold' : fraudScore >= 50 ? 'text-yellow-600 font-medium' : 'text-green-600'}>
                  {fraudScore}/100
                </span>
              </div>
            )}
          </div>
        )}

        {/* Details Section */}
        <div className="border rounded-lg p-3 bg-gray-50">
          <h4 className="font-semibold text-sm text-gray-700 mb-2">Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            {(result.details?.valid !== undefined || result.valid !== undefined) && (
              <div className="flex justify-between">
                <span className="text-gray-600">Valid:</span>
                <span className={result.details?.valid || result.valid ? 'text-green-600' : 'text-red-600'}>
                  {result.details?.valid || result.valid ? '✓ Yes' : '✗ No'}
                </span>
              </div>
            )}
            {(result.details?.carrier || result.carrier) && (
              <div className="flex justify-between">
                <span className="text-gray-600">Carrier:</span>
                <span>{result.details?.carrier || result.carrier}</span>
              </div>
            )}
            {(result.details?.country || result.country) && (
              <div className="flex justify-between">
                <span className="text-gray-600">Country:</span>
                <span>{result.details?.country || result.country}</span>
              </div>
            )}
            {(result.details?.region || result.region) && (
              <div className="flex justify-between">
                <span className="text-gray-600">Region:</span>
                <span>{result.details?.region || result.region}</span>
              </div>
            )}
            {(result.details?.lineType || result.details?.line_type || result.line_type) && (
              <div className="flex justify-between">
                <span className="text-gray-600">Line Type:</span>
                <span>{result.details?.lineType || result.details?.line_type || result.line_type}</span>
              </div>
            )}
            {(result.details?.mobile !== undefined || result.mobile !== undefined) && (
              <div className="flex justify-between">
                <span className="text-gray-600">Mobile:</span>
                <span className={(result.details?.mobile || result.mobile) ? 'text-blue-600' : 'text-gray-600'}>
                  {(result.details?.mobile || result.mobile) ? '📱 Yes' : 'No'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Security Indicators */}
        {(result.details?.recent_abuse || result.details?.bot_status || result.details?.proxy || result.recent_abuse || result.bot_status || result.proxy) && (
          <div className="border rounded-lg p-3 bg-red-50 border-red-200">
            <h4 className="font-semibold text-sm text-red-700 mb-2">Security Alerts</h4>
            <div className="space-y-1 text-sm">
              {(result.details?.recent_abuse || result.recent_abuse) && (
                <div className="flex items-center text-red-600">
                  <span className="mr-2">🚨</span>
                  Recent abuse detected
                </div>
              )}
              {(result.details?.bot_status || result.bot_status) && (
                <div className="flex items-center text-orange-600">
                  <span className="mr-2">🤖</span>
                  Bot activity detected
                </div>
              )}
              {(result.details?.proxy || result.proxy) && (
                <div className="flex items-center text-yellow-600">
                  <span className="mr-2">🌐</span>
                  Proxy connection detected
                </div>
              )}
            </div>
          </div>
        )}

        {/* Additional Information (Collapsed by default) */}
        {(result.country || result.region || result.carrier || result.line_type || result.lineType) && (
          <details className="border rounded-lg p-3">
            <summary className="font-semibold text-sm text-gray-700 cursor-pointer hover:text-gray-900">
              Additional Information
            </summary>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              {result.country && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Location:</span>
                  <span>{result.country}</span>
                </div>
              )}
              {result.region && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Region:</span>
                  <span>{result.region}</span>
                </div>
              )}
              {result.carrier && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Service Provider:</span>
                  <span>{result.carrier}</span>
                </div>
              )}
              {(result.line_type || result.lineType) && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Connection Type:</span>
                  <span>{result.line_type || result.lineType}</span>
                </div>
              )}
            </div>
          </details>
        )}
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
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center mb-2">
          <Shield className="h-6 w-6 text-blue-500 mr-2" />
          <h1 className="text-2xl font-bold">Security Check</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Verify phone numbers, emails, and websites against security databases
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
          <TabsList className="grid w-full h-14 mb-6" style={{ gridTemplateColumns: `repeat(${availableTypes.length}, 1fr)` }}>
            {availableTypes.includes('phone') && (
              <TabsTrigger value="phone" className="flex items-center gap-2 h-12 text-base font-medium">
                {getTabIcon('phone')}
                <span className="hidden sm:inline">Phone Number</span>
                <span className="sm:hidden">Phone</span>
              </TabsTrigger>
            )}
            {availableTypes.includes('email') && (
              <TabsTrigger value="email" className="flex items-center gap-2 h-12 text-base font-medium">
                {getTabIcon('email')}
                <span className="hidden sm:inline">Email Address</span>
                <span className="sm:hidden">Email</span>
              </TabsTrigger>
            )}
            {availableTypes.includes('url') && (
              <TabsTrigger value="url" className="flex items-center gap-2 h-12 text-base font-medium">
                {getTabIcon('url')}
                <span className="hidden sm:inline">Website URL</span>
                <span className="sm:hidden">Website</span>
              </TabsTrigger>
            )}
          </TabsList>

          {availableTypes.includes('phone') && (
            <TabsContent value="phone" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex gap-2">
                    <Input
                      id="phone"
                      placeholder="Enter phone number (e.g., +1234567890)"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="text-base"
                    />
                    <Button 
                      onClick={() => handleLookup('phone', phoneNumber)}
                      disabled={lookupMutation.isPending}
                      size="lg"
                      className="px-8"
                    >
                      {lookupMutation.isPending ? 'Checking...' : 'Check Security'}
                    </Button>
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
                      <div className="text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="h-5 w-5" />
                          <span className="font-medium">Service Unavailable</span>
                        </div>
                        <p className="text-sm">
                          {result.error?.includes('API') ? 
                            'The security service is temporarily unavailable. Please try again later.' : 
                            result.error || 'Unable to complete security check at this time.'
                          }
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          )}

          {availableTypes.includes('email') && (
            <TabsContent value="email" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex gap-2">
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter email address"
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                      className="text-base"
                    />
                    <Button 
                      onClick={() => handleLookup('email', emailAddress)}
                      disabled={lookupMutation.isPending}
                      size="lg"
                      className="px-8"
                    >
                      {lookupMutation.isPending ? 'Checking...' : 'Check Security'}
                    </Button>
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
                      <div className="text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="h-5 w-5" />
                          <span className="font-medium">Service Unavailable</span>
                        </div>
                        <p className="text-sm">
                          {result.error?.includes('API') ? 
                            'The security service is temporarily unavailable. Please try again later.' : 
                            result.error || 'Unable to complete security check at this time.'
                          }
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          )}

          {availableTypes.includes('url') && (
            <TabsContent value="url" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex gap-2">
                    <Input
                      id="website"
                      placeholder="Enter website URL (e.g., https://example.com)"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="text-base"
                    />
                    <Button 
                      onClick={() => handleLookup('url', website)}
                      disabled={lookupMutation.isPending}
                      size="lg"
                      className="px-8"
                    >
                      {lookupMutation.isPending ? 'Checking...' : 'Check Security'}
                    </Button>
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
                      <div className="text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="h-5 w-5" />
                          <span className="font-medium">Service Unavailable</span>
                        </div>
                        <p className="text-sm">
                          {result.error?.includes('API') ? 
                            'The security service is temporarily unavailable. Please try again later.' : 
                            result.error || 'Unable to complete security check at this time.'
                          }
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
            Our security checks use trusted third-party services to analyze phone numbers, emails, and websites. 
            Results are for informational purposes only and should not be the sole basis for important decisions.
          </p>
          <p className="text-xs text-muted-foreground">
            Your privacy is protected - we do not store the information you check, and sensitive API details are never displayed.
          </p>
        </div>
      </div>
    </div>
  );
}