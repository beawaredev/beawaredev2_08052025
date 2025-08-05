import { Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PhoneIcon, MailIcon, BuildingIcon, Calendar, MapPin, ArrowLeft, AlertCircle, Info, FileText } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';

// Types
interface User {
  id: number;
  displayName: string;
  email: string;
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
  // File upload feature has been disabled
  hasProofDocument: boolean;
  // Proof document fields kept for database compatibility but feature is disabled
  proofDocumentPath: string | null;
  proofDocumentType: string | null;
  reportedAt: string;
  isVerified: boolean;
  verifiedBy: number | null;
  verifiedAt: string | null;
  user: User;
}

interface ConsolidatedScam {
  id: number;
  scamType: 'phone' | 'email' | 'business';
  identifier: string;
  reportCount: number;
  firstReportedAt: string;
  lastReportedAt: string;
  isVerified: boolean;
  reports: ScamReport[];
}

interface ConsolidatedScamDetailProps {
  id: string;
}

export default function ConsolidatedScamDetail({ id }: ConsolidatedScamDetailProps) {
  const [_, setLocation] = useLocation();

  // Fetch consolidated scam details
  const { data: consolidatedScam, isLoading, isError } = useQuery({
    queryKey: ['/api/consolidated-scams', id],
    queryFn: async () => {
      const response = await apiRequest(`/api/consolidated-scams/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch consolidated scam details');
      }
      return await response.json();
    }
  });

  // Helper function to get icon based on scam type
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

  // Helper function to format the scam identifier for display
  const formatIdentifier = (scam: ConsolidatedScam) => {
    if (scam.scamType === 'phone') {
      return `Phone: ${scam.identifier}`;
    } else if (scam.scamType === 'email') {
      return `Email: ${scam.identifier}`;
    } else {
      return `Business: ${scam.identifier}`;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <p>Loading consolidated scam details...</p>
      </div>
    );
  }

  if (isError || !consolidatedScam) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-bold">Error Loading Consolidated Scam</h2>
        <p className="text-muted-foreground">The consolidated scam could not be found or there was an error loading it.</p>
        <Button asChild>
          <Link href="/search">Back to Search</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with navigation */}
      <div className="flex flex-col space-y-2">
        <Button 
          variant="ghost" 
          className="w-fit -ml-2 mb-1"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        
        <div className="flex items-center gap-2">
          <Badge className="h-6 px-2 py-1 flex items-center">
            {getScamTypeIcon(consolidatedScam.scamType)}
            <span className="ml-1 capitalize">{consolidatedScam.scamType}</span>
          </Badge>
          {consolidatedScam.isVerified && (
            <Badge variant="outline" className="bg-green-50">Verified</Badge>
          )}
        </div>
        
        <h1 className="text-2xl md:text-3xl font-bold break-all">
          {consolidatedScam.identifier}
        </h1>
      </div>
      
      {/* Consolidated Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Consolidated Information</CardTitle>
          <CardDescription>
            Summary of all reports for this {consolidatedScam.scamType}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Report Count</p>
                <p className="text-sm text-muted-foreground">
                  {consolidatedScam.reportCount} {consolidatedScam.reportCount === 1 ? 'report' : 'reports'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">First Reported</p>
                <p className="text-sm text-muted-foreground">
                  {(() => {
                    try {
                      const date = new Date(consolidatedScam.firstReportedAt);
                      return isNaN(date.getTime()) ? 'Date not available' : format(date, 'MMMM d, yyyy');
                    } catch {
                      return 'Date not available';
                    }
                  })()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Last Reported</p>
                <p className="text-sm text-muted-foreground">
                  {(() => {
                    try {
                      const date = new Date(consolidatedScam.lastReportedAt);
                      return isNaN(date.getTime()) ? 'Date not available' : format(date, 'MMMM d, yyyy');
                    } catch {
                      return 'Date not available';
                    }
                  })()}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Individual Reports Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Individual Reports</CardTitle>
          <CardDescription>
            All reports for this {consolidatedScam.scamType}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {consolidatedScam.reports && consolidatedScam.reports.length > 0 ? (
            <div className="space-y-4">
              {consolidatedScam.reports.map((report: ScamReport) => (
                <Card key={report.id} className="overflow-hidden">
                  <div className="bg-muted px-4 py-2 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">
                        Reported on {(() => {
                          try {
                            const date = new Date(report.reportedAt);
                            return isNaN(date.getTime()) ? 'Date not available' : format(date, 'MMM d, yyyy');
                          } catch {
                            return 'Date not available';
                          }
                        })()}
                      </p>
                      {report.isVerified && (
                        <Badge variant="outline" className="bg-green-50">Verified</Badge>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/reports/${report.id}`}>View Details</Link>
                    </Button>
                  </div>
                  <CardContent className="space-y-2 pt-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{report.location}</span>
                    </div>
                    <p className="text-sm line-clamp-2">
                      {report.description}
                    </p>
                    {/* Proof Documents have been removed from the application */}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No individual reports available</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-4">
          <Button asChild variant="outline">
            <Link href="/search">Search More Scams</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}