import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  SearchIcon, 
  PhoneIcon, 
  MailIcon, 
  BuildingIcon, 
  AlertCircleIcon, 
  ShieldCheckIcon,
  MapPinIcon,
  CalendarIcon
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';

// Types
interface ScamReport {
  id: number;
  scamType: 'phone' | 'email' | 'business';
  scamPhoneNumber: string | null;
  scamEmail: string | null;
  scamBusinessName: string | null;
  incidentDate: string;
  location: string;
  description: string;
  reportedAt: string;
  isVerified: boolean;
  hasProofDocument: boolean;
}

interface ConsolidatedScam {
  id: number;
  scamType: 'phone' | 'email' | 'business';
  identifier: string;
  reportCount: number;
  firstReportedAt: string;
  lastReportedAt: string;
  isVerified: boolean;
}

export default function ScamSearch() {
  // Get search param from URL if present
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialQuery = searchParams.get('q') || '';
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchType, setSearchType] = useState<'all' | 'phone' | 'email' | 'business'>('all');
  const [isSearching, setIsSearching] = useState(false);
  
  // Search results state
  const [searchResults, setSearchResults] = useState<Array<ConsolidatedScam>>([]);
  
  // Helper for normalizing phone numbers
  const normalizePhoneNumber = (phone: string): string => {
    return phone.replace(/\D/g, '');
  };
  
  // Flexible search filtering function
  const filterScamsByQuery = (scams: ConsolidatedScam[], query: string): ConsolidatedScam[] => {
    return scams.filter((scam) => {
      // For exact matches (case insensitive)
      const exactMatch = scam.identifier.toLowerCase().includes(query.toLowerCase());
      
      // For phone number formats (if this is a phone scam)
      let phoneMatch = false;
      if (scam.scamType === 'phone') {
        const normalizedScamPhone = normalizePhoneNumber(scam.identifier);
        const normalizedSearchPhone = normalizePhoneNumber(query);
        
        // Check if the normalized numbers have any overlap
        phoneMatch = normalizedScamPhone.includes(normalizedSearchPhone) || 
                    normalizedSearchPhone.includes(normalizedScamPhone);
      }
      
      // For email addresses (partial matching for domain or username)
      let emailMatch = false;
      if (scam.scamType === 'email') {
        const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 0);
        
        // Check each part of the email separately
        if (scam.identifier.includes('@')) {
          const [username, domain] = scam.identifier.split('@');
          emailMatch = searchTerms.some(term => 
            username.toLowerCase().includes(term) || 
            domain.toLowerCase().includes(term)
          );
        }
      }
      
      // For business names (more lenient matching)
      let businessMatch = false;
      if (scam.scamType === 'business') {
        const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 0);
        
        // Match if any word in the business name matches any search term
        const businessWords = scam.identifier.toLowerCase().split(/\s+/);
        businessMatch = searchTerms.some(term => 
          businessWords.some(word => word.includes(term) || term.includes(word))
        );
      }
      
      const match = exactMatch || phoneMatch || emailMatch || businessMatch;
      console.log(`Matching "${scam.identifier}" with "${query}": ${match} (exact:${exactMatch}, phone:${phoneMatch}, email:${emailMatch}, business:${businessMatch})`);
      return match;
    });
  };
  
  // Effect to update URL when search is performed
  useEffect(() => {
    if (isSearching && searchQuery) {
      const newParams = new URLSearchParams();
      newParams.set('q', searchQuery);
      if (searchType !== 'all') {
        newParams.set('type', searchType);
      }
      const newRelativePathQuery = window.location.pathname + '?' + newParams.toString();
      window.history.pushState(null, '', newRelativePathQuery);
    }
  }, [isSearching, searchQuery, searchType]);
  
  // Perform search when query param changes
  useEffect(() => {
    const performSearch = async () => {
      if (initialQuery) {
        setIsSearching(true);
        
        try {
          let endpoint = '/api/consolidated-scams';
          
          if (searchType !== 'all') {
            endpoint = `/api/consolidated-scams/by-type/${searchType}`;
          }
          
          const response = await apiRequest(endpoint);
          const data = await response.json();
          
          // Filter results by search query with flexible matching
          console.log('API response data (performSearch):', data);
          const filtered = filterScamsByQuery(data, searchQuery);
          
          setSearchResults(filtered);
        } catch (error) {
          console.error('Error searching for scams:', error);
          setSearchResults([]);
        }
      }
    };
    
    if (initialQuery) {
      performSearch();
    }
  }, [initialQuery]);
  
  // Handle form submission
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    try {
      let endpoint = '/api/consolidated-scams';
      
      if (searchType !== 'all') {
        endpoint = `/api/consolidated-scams/by-type/${searchType}`;
      }
      
      const response = await apiRequest(endpoint);
      
      if (!response.ok) {
        throw new Error('Failed to search for scams');
      }
      
      const data = await response.json();
      
      // Filter results using our flexible search function
      console.log('API response data:', data);
      const filtered = filterScamsByQuery(data, searchQuery);
      
      setSearchResults(filtered);
    } catch (error) {
      console.error('Error searching for scams:', error);
      setSearchResults([]);
    }
  };
  
  // Get icon for scam type
  const getScamTypeIcon = (type: 'phone' | 'email' | 'business') => {
    switch (type) {
      case 'phone':
        return <PhoneIcon className="h-5 w-5" />;
      case 'email':
        return <MailIcon className="h-5 w-5" />;
      case 'business':
        return <BuildingIcon className="h-5 w-5" />;
    }
  };
  
  return (
    <div className="space-y-8">
      {/* Hero Search Section */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-8 md:p-12">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Search Scam Database
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Search through thousands of verified scam reports. Enter a phone number, email, or business name to check if it has been reported.
            </p>
          </div>
          
          <Card className="border-2 border-primary/30 shadow-lg bg-background/80 backdrop-blur">
            <CardContent className="p-6">
              <form onSubmit={handleSearch} className="space-y-6">
                <div className="space-y-4">
                  <div className="relative">
                    <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder="Enter phone number, email, or business name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 py-4 text-lg border-2 focus:border-primary"
                    />
                  </div>
                  
                  <Tabs 
                    value={searchType} 
                    onValueChange={(value) => setSearchType(value as 'all' | 'phone' | 'email' | 'business')}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-4 h-12">
                      <TabsTrigger value="all" className="text-sm font-medium">All Types</TabsTrigger>
                      <TabsTrigger value="phone" className="flex items-center gap-1 text-sm font-medium">
                        <PhoneIcon className="h-4 w-4" /> Phone
                      </TabsTrigger>
                      <TabsTrigger value="email" className="flex items-center gap-1 text-sm font-medium">
                        <MailIcon className="h-4 w-4" /> Email
                      </TabsTrigger>
                      <TabsTrigger value="business" className="flex items-center gap-1 text-sm font-medium">
                        <BuildingIcon className="h-4 w-4" /> Business
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                
                <Button type="submit" size="lg" className="w-full py-4 text-lg font-semibold">
                  <SearchIcon className="h-5 w-5 mr-2" />
                  Search Database
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {isSearching && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Search Results</h2>
            <Badge variant="outline">
              {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'} found
            </Badge>
          </div>
          
          {searchResults.length === 0 ? (
            <Card className="bg-card">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-primary/10 p-3 mb-4">
                  <AlertCircleIcon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Good news! We haven't found any scam reports matching '{searchQuery}' in our database. 
                  Please remember that this doesn't guarantee it's safe, as not all scams are reported.
                </p>
                <Button className="mt-6" asChild>
                  <Link href="/report">Report a Scam</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {searchResults.map((result) => (
                <Card key={result.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-full bg-primary/10">
                          {getScamTypeIcon(result.scamType)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{result.identifier}</CardTitle>
                          <CardDescription>
                            <span className="capitalize">{result.scamType}</span> scam
                          </CardDescription>
                        </div>
                      </div>
                      
                      <Badge variant={result.isVerified ? "default" : "outline"}>
                        {result.isVerified ? "Verified" : "Pending"}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pb-3">
                    <div className="flex flex-wrap gap-4 mt-2">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <ShieldCheckIcon className="h-4 w-4" />
                        <span>Reported {result.reportCount} {result.reportCount === 1 ? 'time' : 'times'}</span>
                      </div>
                      
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <CalendarIcon className="h-4 w-4" />
                        <span>First reported {format(new Date(result.firstReportedAt), 'MMM d, yyyy')}</span>
                      </div>
                      
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <CalendarIcon className="h-4 w-4" />
                        <span>Last reported {format(new Date(result.lastReportedAt), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                  </CardContent>
                  
                  <Separator />
                  
                  <CardFooter className="pt-3">
                    <Button asChild variant="outline">
                      <Link href={`/consolidated-scams/${result.id}`}>
                        View Reports
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
      
      {!isSearching && (
        <div className="py-8">
          <div className="rounded-lg border bg-card p-6 flex flex-col items-center text-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
              <div className="p-4 rounded-lg border bg-card space-y-2 flex flex-col items-center">
                <PhoneIcon className="h-8 w-8 text-primary mb-2" />
                <h4 className="font-medium">Phone Numbers</h4>
                <p className="text-sm text-muted-foreground">
                  Search for suspicious calls, robocalls, or telemarketing scams
                </p>
              </div>
              
              <div className="p-4 rounded-lg border bg-card space-y-2 flex flex-col items-center">
                <MailIcon className="h-8 w-8 text-primary mb-2" />
                <h4 className="font-medium">Email Addresses</h4>
                <p className="text-sm text-muted-foreground">
                  Check for phishing attempts and fraudulent messages
                </p>
              </div>
              
              <div className="p-4 rounded-lg border bg-card space-y-2 flex flex-col items-center">
                <BuildingIcon className="h-8 w-8 text-primary mb-2" />
                <h4 className="font-medium">Businesses</h4>
                <p className="text-sm text-muted-foreground">
                  Verify legitimacy of businesses and services
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}