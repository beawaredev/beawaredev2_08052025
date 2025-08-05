import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'wouter';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PhoneIcon, MailIcon, BuildingIcon, FileTextIcon, EyeIcon, FilterIcon, MapPinIcon, SearchIcon } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

// Types
interface ScamReport {
  id: number;
  userId: number;
  scamType: 'phone' | 'email' | 'business';
  scamPhoneNumber: string | null;
  scamEmail: string | null;
  scamBusinessName: string | null;
  incidentDate: string;
  // Updated location fields
  country: string;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  description: string;
  // hasProofDocument field removed as file upload feature is disabled
  reportedAt: string;
  isVerified: boolean;
  user?: {
    id: number;
    displayName: string;
    email: string;
  };
}

export default function ScamReports() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTab, setCurrentTab] = useState<'all' | 'phone' | 'email' | 'business'>('all');
  const { user } = useAuth();
  
  // Implement infinite scroll pagination for better performance
  const pageSize = 20; // Smaller page size for faster loading
  
  // Use infinite query for scroll pagination
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError
  } = useInfiniteQuery({
    queryKey: ['/api/scam-reports'],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiRequest(`/api/scam-reports?page=${pageParam}&limit=${pageSize}`);
      if (!response.ok) {
        throw new Error('Failed to fetch scam reports');
      }
      return await response.json();
    },
    getNextPageParam: (lastPage, pages) => {
      const pagination = lastPage?.pagination;
      if (pagination && pagination.page < pagination.totalPages) {
        return pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1
  });

  // Flatten all pages into a single array
  const allReports = data?.pages?.flatMap(page => page?.reports || page || []) || [];

  // Infinite scroll detection - only trigger on actual scroll events
  useEffect(() => {
    const handleScroll = () => {
      // Use scrollHeight for better detection
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      
      // Calculate distance from bottom
      const distanceFromBottom = docHeight - (scrollTop + windowHeight);
      
      // Trigger when within 400px of bottom
      if (distanceFromBottom < 400 && hasNextPage && !isFetchingNextPage && !isLoading) {
        console.log('Loading more reports...', { distanceFromBottom });
        fetchNextPage();
      }
    };

    // Add scroll listener with throttling - NO initial call
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    // Only listen to window scroll events
    window.addEventListener('scroll', throttledScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', throttledScroll);
    };
  }, [hasNextPage, isFetchingNextPage, isLoading, fetchNextPage]);
  
  // Filter by type and search term
  // Normalize a phone number for flexible searching
  const normalizePhoneNumber = (phone: string | null): string => {
    if (!phone) return '';
    // Remove all non-numeric characters
    return phone.replace(/\D/g, '');
  };
  
  // Check if a string partially matches search terms
  const flexibleMatch = (text: string | null, searchTerms: string[]): boolean => {
    if (!text) return false;
    
    const normalizedText = text.toLowerCase();
    
    // Check if any search term is found in the text
    return searchTerms.some(term => normalizedText.includes(term));
  };
  
  const filteredReports = allReports ? allReports.filter((report: ScamReport) => {
    // Filter by type first
    const typeMatch = currentTab === 'all' || report.scamType === currentTab;
    
    // Then filter by search term if provided
    if (!searchTerm.trim()) return typeMatch;
    
    // Split search terms by spaces for multi-word searching
    const searchTerms = searchTerm.toLowerCase().split(/\s+/).filter(term => term.length > 0);
    
    // Create a location string for searching
    const locationStr = [
      report.city, 
      report.state, 
      report.zipCode, 
      report.country
    ].filter(Boolean).join(', ').toLowerCase();
    
    // Normalize phone numbers for comparison
    const searchPhoneNormalized = searchTerms
      .map(term => normalizePhoneNumber(term))
      .filter(term => term.length > 0);
      
    const reportPhoneNormalized = normalizePhoneNumber(report.scamPhoneNumber);
    
    // Special case for phone number searching
    const phoneMatch = searchPhoneNormalized.length > 0 && 
      reportPhoneNormalized.length > 0 && 
      searchPhoneNormalized.some(term => reportPhoneNormalized.includes(term));
    
    // Search in various fields with more flexible matching
    return typeMatch && (
      phoneMatch ||
      flexibleMatch(report.scamPhoneNumber, searchTerms) ||
      flexibleMatch(report.scamEmail, searchTerms) ||
      flexibleMatch(report.scamBusinessName, searchTerms) ||
      flexibleMatch(locationStr, searchTerms) ||
      flexibleMatch(report.description, searchTerms)
    );
  }) : [];
  
  // Get identifier based on scam type
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
  
  // Get icon based on scam type
  const getScamTypeIcon = (type: 'phone' | 'email' | 'business') => {
    switch (type) {
      case 'phone':
        return <PhoneIcon className="h-4 w-4" />;
      case 'email':
        return <MailIcon className="h-4 w-4" />;
      case 'business':
        return <BuildingIcon className="h-4 w-4" />;
    }
  };
  
  // Get first 10 words of description
  const getShortDescription = (description: string) => {
    const words = description.split(' ');
    if (words.length <= 10) return description;
    return words.slice(0, 10).join(' ') + '...';
  };
  
  // Format location data into a string
  const formatLocation = (report: ScamReport) => {
    if (report.city && report.state) {
      return `${report.city}, ${report.state}`;
    } else if (report.city) {
      return report.city;
    } else if (report.state) {
      return report.state;
    } else if (report.country) {
      return report.country;
    } else {
      return "Unknown location";
    }
  };
  
  // Navigate to scam report details
  const [, navigate] = useLocation();
  const goToReportDetails = (reportId: number) => {
    navigate(`/reports/${reportId}`);
  };
  
  return (
    <div className="space-y-6">

      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Search by keywords, locations, identifiers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Tabs 
              defaultValue="all" 
              value={currentTab}
              onValueChange={(value) => setCurrentTab(value as 'all' | 'phone' | 'email' | 'business')}
              className="w-full md:w-auto"
            >
              <TabsList className="grid grid-cols-4 w-full md:w-[400px]">
                <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                <TabsTrigger value="phone" className="text-xs flex items-center justify-center">
                  <PhoneIcon className="h-3 w-3 mr-1" /> Phone
                </TabsTrigger>
                <TabsTrigger value="email" className="text-xs flex items-center justify-center">
                  <MailIcon className="h-3 w-3 mr-1" /> Email
                </TabsTrigger>
                <TabsTrigger value="business" className="text-xs flex items-center justify-center">
                  <BuildingIcon className="h-3 w-3 mr-1" /> Business
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>
      
      {isLoading ? (
        <div className="text-center py-12">Loading...</div>
      ) : filteredReports.length === 0 ? (
        <div className="text-center py-12">
          <FileTextIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No matching reports found</h3>
          <p className="text-muted-foreground mt-2">
            {searchTerm ? 'Try a different search term or filter' : 'No reports available'}
          </p>
        </div>
      ) : (
        <Card>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Identifier</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Date Reported</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report: ScamReport) => (
                  <TableRow 
                    key={report.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => goToReportDetails(report.id)}
                  >
                    <TableCell>
                      <Badge className="flex items-center gap-1 w-fit">
                        {getScamTypeIcon(report.scamType)}
                        <span className="capitalize">{report.scamType}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {getScamIdentifier(report)}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      {getShortDescription(report.description)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPinIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        {formatLocation(report)}
                      </div>
                    </TableCell>
                    <TableCell>{(() => {
                      try {
                        const date = new Date(report.reportedAt);
                        return isNaN(date.getTime()) ? 'Date not available' : format(date, 'MMM d, yyyy');
                      } catch {
                        return 'Date not available';
                      }
                    })()}</TableCell>
                    <TableCell>
                      {report.isVerified ? (
                        <Badge variant="outline" className="bg-green-50">Verified</Badge>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                
                {/* Loading indicator for infinite scroll */}
                {isFetchingNextPage && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        <span className="text-sm text-muted-foreground">Loading more reports...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                
                {/* Manual load more button as fallback */}
                {hasNextPage && !isFetchingNextPage && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      <Button 
                        onClick={() => fetchNextPage()}
                        variant="outline"
                        className="w-full max-w-md"
                      >
                        Load More Reports
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
                
                {/* Show message when no more data */}
                {!hasNextPage && allReports.length > 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      <span className="text-sm text-muted-foreground">
                        You've reached the end of the results ({allReports.length} reports total)
                      </span>
                    </TableCell>
                  </TableRow>
                )}
                
                {/* Show empty state */}
                {filteredReports.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      {searchTerm ? 'No reports found matching your search.' : 'No scam reports available.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}