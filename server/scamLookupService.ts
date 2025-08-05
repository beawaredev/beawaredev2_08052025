import { ApiConfig } from './AzureStorage.js';

// Scam lookup service interface
export interface ScamLookupResult {
  type: string;
  input: string;
  provider: string;
  riskScore: number;
  reputation: string;
  status: 'safe' | 'suspicious' | 'malicious' | 'unknown';
  details: {
    isScam?: boolean;
    country?: string;
    region?: string;
    carrier?: string;
    lineType?: string;
    reputation?: string;
    riskFactors?: string[];
    lastSeen?: string;
    reportCount?: number;
  };
  rawResponse?: any;
  timestamp: string;
  apiCallDetails?: {
    method: string;
    url: string;
    headers: any;
    body?: any;
  };
}

export class ScamLookupService {
  private static instance: ScamLookupService;
  
  static getInstance(): ScamLookupService {
    if (!ScamLookupService.instance) {
      ScamLookupService.instance = new ScamLookupService();
    }
    return ScamLookupService.instance;
  }

  async lookupScamData(type: string, input: string, apiConfig: ApiConfig): Promise<ScamLookupResult> {
    console.log(`Starting scam lookup for ${type}: ${input} using ${apiConfig.name}`);
    
    // Check if this has custom parameter mapping - if so, use generic API method
    if (apiConfig.parameterMapping && apiConfig.parameterMapping.trim() !== '' && apiConfig.parameterMapping !== '{}') {
      console.log(`Using generic API method due to custom parameter mapping for ${apiConfig.name}`);
      return this.lookupWithGenericAPI(type, input, apiConfig);
    }
    
    switch (apiConfig.name.toLowerCase()) {
      case 'ipqs':
      case 'ipqualityscore':
        return this.lookupWithIPQS(type, input, apiConfig);
      case 'virustotal':
        return this.lookupWithVirusTotal(type, input, apiConfig);
      case 'abuseipdb':
        return this.lookupWithAbuseIPDB(type, input, apiConfig);
      default:
        return this.lookupWithGenericAPI(type, input, apiConfig);
    }
  }

  private async lookupWithIPQS(type: string, input: string, apiConfig: ApiConfig): Promise<ScamLookupResult> {
    try {
      let endpoint = '';
      let params = new URLSearchParams({
        key: apiConfig.apiKey,
        strictness: '1',
      });

      switch (type) {
        case 'phone':
          endpoint = 'phone';
          params.append('phone', input);
          break;
        case 'email':
          endpoint = 'email';
          params.append('email', input);
          break;
        case 'url':
          endpoint = 'url';
          params.append('url', input);
          break;
        case 'ip':
          endpoint = 'ip';
          params.append('ip', input);
          break;
        default:
          throw new Error(`Unsupported type: ${type}`);
      }

      const fullUrl = `${apiConfig.url}/${endpoint}?${params.toString()}`;
      console.log(`Making IPQS request to: ${fullUrl.replace(apiConfig.apiKey, '[HIDDEN]')}`);

      const headers = {
        'User-Agent': 'BeAware-ScamChecker/1.0',
      };

      const response = await fetch(fullUrl, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout((apiConfig.timeout || 30) * 1000),
      });

      if (!response.ok) {
        throw new Error(`IPQS API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('IPQS response:', data);

      // Create API call details
      const apiCallDetails = {
        method: 'GET',
        url: fullUrl,
        headers,
        body: null
      };

      return this.parseIPQSResponse(type, input, data, apiConfig.name, apiCallDetails);
    } catch (error) {
      console.error('IPQS lookup error:', error);
      // Create basic API call details for error case
      const errorApiCallDetails = {
        method: 'GET',
        url: `${apiConfig.url}/${endpoint || 'unknown'}`,
        headers: { 'User-Agent': 'BeAware-ScamChecker/1.0' },
        body: null
      };
      return this.createErrorResult(type, input, apiConfig.name, error, errorApiCallDetails);
    }
  }

  private parseIPQSResponse(type: string, input: string, data: any, provider: string, apiCallDetails?: any): ScamLookupResult {
    let riskScore = 0;
    let reputation = 'unknown';
    let status: 'safe' | 'suspicious' | 'malicious' | 'unknown' = 'unknown';
    let details: any = {};

    if (data.success === false) {
      return {
        type,
        input,
        provider,
        riskScore: 0,
        reputation: 'error',
        status: 'unknown',
        details: { error: data.message || 'API error' },
        rawResponse: data,
        timestamp: new Date().toISOString(),
        apiCallDetails,
      };
    }

    switch (type) {
      case 'phone':
        riskScore = data.fraud_score || 0;
        details = {
          isScam: data.fraud_score > 75,
          country: data.country,
          region: data.region,
          carrier: data.carrier,
          lineType: data.line_type,
          reputation: data.reputation,
          riskFactors: []
        };
        
        if (data.VOIP) details.riskFactors.push('VOIP');
        if (data.prepaid) details.riskFactors.push('Prepaid');
        if (data.risky) details.riskFactors.push('Risky');
        
        break;

      case 'email':
        riskScore = data.fraud_score || 0;
        details = {
          isScam: data.fraud_score > 75,
          reputation: data.overall_score < 70 ? 'poor' : 'good',
          riskFactors: []
        };
        
        if (data.disposable) details.riskFactors.push('Disposable');
        if (data.suspect) details.riskFactors.push('Suspicious');
        if (data.recent_abuse) details.riskFactors.push('Recent Abuse');
        
        break;

      case 'url':
        riskScore = data.risk_score || 0;
        details = {
          isScam: data.malware || data.phishing || data.suspicious,
          reputation: data.reputation || 'unknown',
          riskFactors: []
        };
        
        if (data.malware) details.riskFactors.push('Malware');
        if (data.phishing) details.riskFactors.push('Phishing');
        if (data.suspicious) details.riskFactors.push('Suspicious');
        
        break;

      case 'ip':
        riskScore = data.fraud_score || 0;
        details = {
          country: data.country_code,
          region: data.region,
          reputation: data.reputation,
          riskFactors: []
        };
        
        if (data.vpn) details.riskFactors.push('VPN');
        if (data.tor) details.riskFactors.push('Tor');
        if (data.proxy) details.riskFactors.push('Proxy');
        if (data.bot_status) details.riskFactors.push('Bot');
        
        break;
    }

    // Determine status based on risk score
    if (riskScore >= 85) {
      status = 'malicious';
      reputation = 'high risk';
    } else if (riskScore >= 50) {
      status = 'suspicious';
      reputation = 'medium risk';
    } else if (riskScore >= 25) {
      status = 'suspicious';
      reputation = 'low risk';
    } else {
      status = 'safe';
      reputation = 'good';
    }

    return {
      type,
      input,
      provider,
      riskScore,
      reputation,
      status,
      details,
      rawResponse: data,
      timestamp: new Date().toISOString(),
      apiCallDetails,
    };
  }

  private async lookupWithVirusTotal(type: string, input: string, apiConfig: ApiConfig): Promise<ScamLookupResult> {
    // VirusTotal implementation placeholder
    console.log('VirusTotal lookup not implemented yet');
    return this.createNotImplementedResult(type, input, apiConfig.name);
  }

  private async lookupWithAbuseIPDB(type: string, input: string, apiConfig: ApiConfig): Promise<ScamLookupResult> {
    // AbuseIPDB implementation placeholder
    console.log('AbuseIPDB lookup not implemented yet');
    return this.createNotImplementedResult(type, input, apiConfig.name);
  }

  private async lookupWithGenericAPI(type: string, input: string, apiConfig: ApiConfig): Promise<ScamLookupResult> {
    try {
      console.log(`🔍 Making API request to ${apiConfig.name}`);
      
      // Parse parameter mapping and headers
      let parameterMapping: any = {};
      let customHeaders: any = {};
      
      try {
        if (apiConfig.parameterMapping) {
          parameterMapping = JSON.parse(apiConfig.parameterMapping);
        }
      } catch (e) {
        console.warn('Invalid parameter mapping JSON:', apiConfig.parameterMapping);
      }
      
      try {
        if (apiConfig.headers) {
          customHeaders = JSON.parse(apiConfig.headers);
        }
      } catch (e) {
        console.warn('Invalid headers JSON:', apiConfig.headers);
      }
      
      // Replace template variables in parameter mapping
      const processedParams: any = {};
      for (const [key, value] of Object.entries(parameterMapping)) {
        if (typeof value === 'string') {
          processedParams[key] = value
            .replace(/\{\{input\}\}/g, input)
            .replace(/\{\{phone\}\}/g, input)
            .replace(/\{\{email\}\}/g, input)
            .replace(/\{\{url\}\}/g, input)
            .replace(/\{\{ip\}\}/g, input)
            .replace(/\{\{domain\}\}/g, input)
            .replace(/\{\{apiKey\}\}/g, apiConfig.apiKey)
            .replace(/\{\{key\}\}/g, apiConfig.apiKey);
        } else {
          processedParams[key] = value;
        }
      }
      
      // Replace template variables in headers
      const processedHeaders: any = {
        'User-Agent': 'BeAware-ScamChecker/1.0',
        ...customHeaders
      };
      
      for (const [key, value] of Object.entries(processedHeaders)) {
        if (typeof value === 'string') {
          processedHeaders[key] = value
            .replace(/\{\{input\}\}/g, input)
            .replace(/\{\{phone\}\}/g, input)
            .replace(/\{\{email\}\}/g, input)
            .replace(/\{\{url\}\}/g, input)
            .replace(/\{\{ip\}\}/g, input)
            .replace(/\{\{domain\}\}/g, input)
            .replace(/\{\{apiKey\}\}/g, apiConfig.apiKey)
            .replace(/\{\{key\}\}/g, apiConfig.apiKey);
        }
      }
      
      // First, always replace template variables in the URL regardless of method
      console.log(`🔄 Original URL: ${apiConfig.url}`);
      console.log(`🔑 API Key: ${apiConfig.apiKey}`);
      console.log(`📞 Input: ${input}`);
      
      let url = apiConfig.url
        .replace(/\{\{input\}\}/g, encodeURIComponent(input))
        .replace(/\{\{phone\}\}/g, encodeURIComponent(input))
        .replace(/\{\{email\}\}/g, encodeURIComponent(input))
        .replace(/\{\{url\}\}/g, encodeURIComponent(input))
        .replace(/\{\{ip\}\}/g, encodeURIComponent(input))
        .replace(/\{\{domain\}\}/g, encodeURIComponent(input))
        .replace(/\{\{apiKey\}\}/g, encodeURIComponent(apiConfig.apiKey))
        .replace(/\{\{key\}\}/g, encodeURIComponent(apiConfig.apiKey));
      
      console.log(`✅ Processed URL: ${url}`);
      
      // Determine method and build request
      const method = Object.keys(processedParams).length > 0 ? 'POST' : 'GET';
      let body: string | undefined;
      
      if (method === 'POST') {
        // POST request with JSON body
        body = JSON.stringify(processedParams);
        processedHeaders['Content-Type'] = 'application/json';
      } else {
        // For GET requests, add API key as query parameter if not already present and no auth header
        if (apiConfig.apiKey && !url.includes('key=') && !processedHeaders['Authorization']) {
          const separator = url.includes('?') ? '&' : '?';
          url += `${separator}key=${encodeURIComponent(apiConfig.apiKey)}`;
        }
      }
      
      console.log(`📡 ${method} ${url}`);
      console.log(`🔑 Headers:`, Object.keys(processedHeaders));
      if (body) console.log(`📦 Body:`, processedParams);
      
      // Store API call details for response
      const apiCallDetails = {
        method,
        url,
        headers: processedHeaders,
        body: body ? JSON.parse(body) : null
      };
      
      console.log(`🎯 Final API call details: ${JSON.stringify(apiCallDetails, null, 2)}`);
      
      const response = await fetch(url, {
        method,
        headers: processedHeaders,
        body,
        signal: AbortSignal.timeout((apiConfig.timeout || 30) * 1000),
      });

      console.log(`📊 Response: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`✅ API response received:`, { keys: Object.keys(data) });
      
      return {
        type,
        input,
        provider: apiConfig.name,
        riskScore: data.risk_score || data.score || 0,
        reputation: data.reputation || 'unknown',
        status: this.determineStatus(data.risk_score || data.score || 0),
        details: data,
        rawResponse: data,
        timestamp: new Date().toISOString(),
        apiCallDetails, // Include the actual API call details
      };
    } catch (error) {
      console.error(`❌ Generic API lookup error for ${apiConfig.name}:`, error);
      // Create basic API call details for error cases
      let errorApiCallDetails;
      try {
        const errorParamMapping = JSON.parse(apiConfig.parameterMapping || '{}');
        const errorHeaders = JSON.parse(apiConfig.headers || '{}');
        
        // Process error parameters with variable substitution
        const processedErrorParams: any = {};
        for (const [key, value] of Object.entries(errorParamMapping)) {
          if (typeof value === 'string') {
            processedErrorParams[key] = value
              .replace(/\{\{input\}\}/g, input)
              .replace(/\{\{phone\}\}/g, input)
              .replace(/\{\{email\}\}/g, input)
              .replace(/\{\{url\}\}/g, input)
              .replace(/\{\{ip\}\}/g, input)
              .replace(/\{\{domain\}\}/g, input)
              .replace(/\{\{apiKey\}\}/g, apiConfig.apiKey)
              .replace(/\{\{key\}\}/g, apiConfig.apiKey);
          } else {
            processedErrorParams[key] = value;
          }
        }
        
        // Process error URL with variable substitution
        const processedErrorUrl = apiConfig.url
          .replace(/\{\{input\}\}/g, input)
          .replace(/\{\{phone\}\}/g, input)
          .replace(/\{\{email\}\}/g, input)
          .replace(/\{\{url\}\}/g, input)
          .replace(/\{\{ip\}\}/g, input)
          .replace(/\{\{domain\}\}/g, input)
          .replace(/\{\{apiKey\}\}/g, apiConfig.apiKey)
          .replace(/\{\{key\}\}/g, apiConfig.apiKey);
        
        errorApiCallDetails = {
          method: Object.keys(errorParamMapping).length > 0 ? 'POST' : 'GET',
          url: processedErrorUrl,
          headers: errorHeaders,
          body: Object.keys(errorParamMapping).length > 0 ? processedErrorParams : null
        };
      } catch (parseError) {
        errorApiCallDetails = {
          method: 'GET',
          url: apiConfig.url
            .replace(/\{\{input\}\}/g, input)
            .replace(/\{\{phone\}\}/g, input)
            .replace(/\{\{email\}\}/g, input)
            .replace(/\{\{url\}\}/g, input)
            .replace(/\{\{ip\}\}/g, input)
            .replace(/\{\{domain\}\}/g, input)
            .replace(/\{\{apiKey\}\}/g, apiConfig.apiKey)
            .replace(/\{\{key\}\}/g, apiConfig.apiKey),
          headers: {},
          body: null
        };
      }
      return this.createErrorResult(type, input, apiConfig.name, error, errorApiCallDetails);
    }
  }

  private determineStatus(riskScore: number): 'safe' | 'suspicious' | 'malicious' | 'unknown' {
    if (riskScore >= 80) return 'malicious';
    if (riskScore >= 50) return 'suspicious';
    if (riskScore >= 20) return 'suspicious';
    return 'safe';
  }

  private createErrorResult(type: string, input: string, provider: string, error: any, apiCallDetails?: any): ScamLookupResult {
    return {
      type,
      input,
      provider,
      riskScore: 0,
      reputation: 'error',
      status: 'unknown',
      details: {
        error: error.message || 'Unknown error',
      },
      timestamp: new Date().toISOString(),
      apiCallDetails,
    };
  }

  private createNotImplementedResult(type: string, input: string, provider: string): ScamLookupResult {
    return {
      type,
      input,
      provider,
      riskScore: 0,
      reputation: 'not implemented',
      status: 'unknown',
      details: {
        error: `${provider} integration not yet implemented`,
      },
      timestamp: new Date().toISOString(),
    };
  }

  // Test function for admin panel
  async testApiConfig(type: string, apiConfig: ApiConfig, customInput?: string): Promise<ScamLookupResult> {
    const testInputs: Record<string, string> = {
      phone: '+1234567890',
      email: 'test@example.com',
      url: 'https://example.com',
      ip: '8.8.8.8',
      domain: 'example.com'
    };

    const testInput = customInput || testInputs[type] || 'test';
    return this.lookupScamData(type, testInput, apiConfig);
  }
}