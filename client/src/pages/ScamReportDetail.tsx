import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, PhoneIcon, MailIcon, BuildingIcon, Calendar, MapPin, FileText, User, CheckCircle, ArrowLeft, MessageSquare, AlertTriangle, FileIcon, Download, Eye } from 'lucide-react';
import { apiRequest } from '@/lib/api-interceptor';
import { format } from 'date-fns';

// Types
interface User {
  id: number;
  displayName: string;
  email: string;
  beawareUsername: string;
}

interface Comment {
  id: number;
  userId: number;
  content: string;
  createdAt: string;
  user: User;
}

interface ConsolidatedInfo {
  id: number;
  identifier: string;
  reportCount: number;
}

interface ScamReport {
  id: number;
  userId: number;
  scamType: 'phone' | 'email' | 'business';
  scamPhoneNumber: string | null;
  scamEmail: string | null;
  scamBusinessName: string | null;
  incidentDate: string;
  city: string;
  state: string;
  zipCode: string;
  location?: string; // For backward compatibility
  description: string;
  hasProofDocument: boolean;
  proofFilePath: string | null;
  proofFileName: string | null;
  proofFileType: string | null;
  proofFileSize: number | null;
  reportedAt: string;
  isVerified: boolean;
  verifiedBy: number | null;
  verifiedAt: string | null;
  isPublished: boolean;
  publishedBy: number | null;
  publishedAt: string | null;
  user: User;
  comments: Comment[];
  consolidatedInfo?: ConsolidatedInfo | null;
}

interface ScamReportDetailProps {
  id: string;
}

export default function ScamReportDetail({ id }: ScamReportDetailProps) {
  const [_, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [comment, setComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const queryClient = useQueryClient();

  // Fetch report details
  const { data: report, isLoading, isError } = useQuery({
    queryKey: ['/api/scam-reports', id],
    queryFn: async () => {
      const response = await apiRequest(`/api/scam-reports/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch report details');
      }
      const data = await response.json();
      console.log('Scam report data received:', data);
      return data;
    }
  });

  // Handle comment submission
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!comment.trim()) return;
    
    try {
      setIsSubmittingComment(true);
      
      const response = await apiRequest('/api/scam-comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scamReportId: parseInt(id),
          content: comment
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to post comment');
      }
      
      // Reset form and refresh data
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['/api/scam-reports', id] });
      
      toast({
        title: 'Comment Added',
        description: 'Your comment has been posted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to post comment',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Verify report mutation (admin only)
  const verifyMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(`/api/scam-reports/${id}/verify`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to verify report');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scam-reports', id] });
      
      toast({
        title: 'Report Verified',
        description: 'The scam report has been verified successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Verification Failed',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
    }
  });
  
  // Publish report mutation (admin only)
  const publishMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(`/api/scam-reports/${id}/publish`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to publish report');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scam-reports', id] });
      
      toast({
        title: 'Report Published',
        description: 'The scam report has been published successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Publishing Failed',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
    }
  });
  
  // Unpublish report mutation (admin only)
  const unpublishMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(`/api/scam-reports/${id}/unpublish`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to unpublish report');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scam-reports', id] });
      
      toast({
        title: 'Report Unpublished',
        description: 'The scam report has been unpublished successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Unpublishing Failed',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
    }
  });

  // Helper function to get the proper identifier based on scam type
  const getScamIdentifier = () => {
    if (!report) return 'Unknown';
    
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <p>Loading report details...</p>
      </div>
    );
  }

  if (isError || !report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-bold">Error Loading Report</h2>
        <p className="text-muted-foreground">The scam report could not be found or there was an error loading it.</p>
        <Button asChild>
          <Link href="/reports">Back to Reports</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild className="gap-1">
          <Link href="/reports">
            <ArrowLeft className="h-4 w-4" />
            Back to Reports
          </Link>
        </Button>
      </div>
      
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">Scam Report</h1>
            <div className="flex flex-wrap gap-2 ml-2">
              {report.isVerified ? (
                <Badge className="bg-green-500">Verified</Badge>
              ) : (
                <Badge variant="outline">Pending Verification</Badge>
              )}
              {/* Only show publish/unpublish badge to admin users */}
              {user?.role === 'admin' && (
                report.isPublished !== false ? (
                  <Badge className="bg-blue-500">Published</Badge>
                ) : (
                  <Badge variant="outline" className="bg-gray-200 text-gray-700">Unpublished</Badge>
                )
              )}
            </div>
          </div>
          <p className="text-muted-foreground">
            Reported on {(() => {
              try {
                const date = new Date(report.reportedAt);
                return isNaN(date.getTime()) ? 'Date not available' : format(date, 'MMMM d, yyyy');
              } catch {
                return 'Date not available';
              }
            })()}
          </p>
        </div>
        
        <div className="flex flex-col gap-2 sm:flex-row">
          {user?.role === 'admin' && !report.isVerified && (
            <Button 
              onClick={() => verifyMutation.mutate()}
              disabled={verifyMutation.isPending}
              className="gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              {verifyMutation.isPending ? 'Verifying...' : 'Verify Report'}
            </Button>
          )}
          
          {user?.role === 'admin' && (
            report.isPublished !== false ? (
              <Button 
                onClick={() => unpublishMutation.mutate()}
                disabled={unpublishMutation.isPending}
                className="gap-2"
                variant="outline"
                title="Make this report private and hide it from public view"
              >
                <AlertCircle className="h-4 w-4" />
                {unpublishMutation.isPending ? 'Unpublishing...' : 'Unpublish'}
              </Button>
            ) : (
              <Button 
                onClick={() => publishMutation.mutate()}
                disabled={publishMutation.isPending}
                className="gap-2"
                variant="outline"
                title="Make this report public and visible to all users"
              >
                <Eye className="h-4 w-4" />
                {publishMutation.isPending ? 'Publishing...' : 'Publish'}
              </Button>
            )
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main report details */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="p-2">
                {getScamTypeIcon(report.scamType)}
              </Badge>
              <div>
                <CardTitle className="text-xl">{getScamIdentifier()}</CardTitle>
                <CardDescription className="text-base font-medium">
                  <span className="capitalize">{report.scamType}</span> Scam Report
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Incident Date</p>
                  <p className="text-sm text-muted-foreground">
                    {(() => {
                      try {
                        const date = new Date(report.incidentDate);
                        return isNaN(date.getTime()) ? 'Date not available' : format(date, 'MMMM d, yyyy');
                      } catch {
                        return 'Date not available';
                      }
                    })()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">
                    {(() => {
                      const parts = [];
                      if (report.city) parts.push(report.city);
                      if (report.state) parts.push(report.state);
                      if (report.zipCode) parts.push(report.zipCode);
                      if (report.country && parts.length === 0) parts.push(report.country);
                      return parts.length > 0 ? parts.join(', ') : 'Location not specified';
                    })()}
                  </p>
                </div>
              </div>
              
              {/* Only show Reported By if user is logged in */}
              {user && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Reported By</p>
                    <p className="text-sm text-muted-foreground">
                      @{report.user?.beawareUsername || 'anonymous'}
                      {user?.role === 'admin' && report.user?.displayName && (
                        <span className="ml-1">({report.user.displayName})</span>
                      )}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Only show Proof Document if user is logged in and document exists */}
              {user && report.hasProofDocument && report.proofFileName && (
                <div className="md:col-span-2 border rounded-md p-4 mt-2 bg-blue-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileIcon className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium">Proof Document</p>
                        <p className="text-sm text-muted-foreground">
                          {report.proofFileName?.split('/').pop()} 
                          {report.proofFileSize && (
                            <span className="ml-1">
                              ({Math.round(report.proofFileSize / 1024)} KB)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="gap-1"
                        onClick={() => {
                          const filename = report.proofFileName?.split('/').pop();
                          if (filename) {
                            window.open(`/api/files/${filename}`, '_blank');
                          }
                        }}
                      >
                        <Eye className="h-4 w-4" />
                        View Document
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Show login prompt for non-logged-in users */}
              {!user && (
                <div className="md:col-span-2 mt-2 border border-dashed rounded-md p-4 bg-muted/50">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link> to view who reported this scam 
                      {report.hasProofDocument ? " and access proof documents" : ""}
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <div>
              <h3 className="text-md font-medium mb-2">Description</h3>
              <div className="bg-muted p-3 rounded-md text-sm whitespace-pre-wrap">
                {report.description}
              </div>
            </div>
            
            {report.isVerified && (
              <div className="border rounded-md p-3 bg-green-50">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <p className="text-sm font-medium">Verified Report</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  This report has been verified by our team on {report.verifiedAt ? (() => {
                    try {
                      const date = new Date(report.verifiedAt);
                      return isNaN(date.getTime()) ? 'Date not available' : format(date, 'MMMM d, yyyy');
                    } catch {
                      return 'Date not available';
                    }
                  })() : 'N/A'}
                </p>
              </div>
            )}
            
            {!report.isVerified && (
              <div className="border rounded-md p-3 bg-yellow-50">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <p className="text-sm font-medium">Pending Verification</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  This report is currently being reviewed by our team
                </p>
              </div>
            )}
            
            {/* Publication status - only shown to admin users */}
            {user?.role === 'admin' && (
              report.isPublished !== false ? (
                <div className="border rounded-md p-3 bg-blue-50">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-blue-500" />
                    <p className="text-sm font-medium">Published Report</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    This report is publicly visible to all users
                    {report.publishedAt && <span> since {(() => {
                      try {
                        const date = new Date(report.publishedAt);
                        return isNaN(date.getTime()) ? 'Date not available' : format(date, 'MMMM d, yyyy');
                      } catch {
                        return 'Date not available';
                      }
                    })()}</span>}
                  </p>
                </div>
              ) : (
                <div className="border rounded-md p-3 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-gray-500" />
                    <p className="text-sm font-medium">Unpublished Report</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    This report is only visible to admins and the original reporter
                  </p>
                </div>
              )
            )}
          </CardContent>
        </Card>
        
        {/* Sidebar info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Report Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.consolidatedInfo && (
              <div>
                <h3 className="text-sm font-medium mb-1">Related Reports</h3>
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-sm">
                    This {report.scamType} has been reported 
                    <span className="font-bold ml-1">
                      {report.consolidatedInfo.reportCount} {report.consolidatedInfo.reportCount === 1 ? 'time' : 'times'}
                    </span>
                  </p>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="px-0 h-7" 
                    asChild
                  >
                    <Link href={`/consolidated-scams/${report.consolidatedInfo.id}`}>
                      View All Related Reports
                    </Link>
                  </Button>
                </div>
              </div>
            )}
            
            <div>
              <h3 className="text-sm font-medium mb-1">Report ID</h3>
              <p className="text-sm text-muted-foreground">#{report.id}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-1">Reported On</h3>
              <p className="text-sm text-muted-foreground">
                {(() => {
                  try {
                    const date = new Date(report.reportedAt);
                    return isNaN(date.getTime()) ? 'Date not available' : format(date, 'MMMM d, yyyy');
                  } catch {
                    return 'Date not available';
                  }
                })()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Comments section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Comments
            {report.comments.length > 0 && (
              <Badge variant="secondary" className="ml-2">{report.comments.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {report.comments.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">No comments yet</p>
          ) : (
            <div className="space-y-4">
              {report.comments.map((comment: Comment) => (
                <div key={comment.id} className="border rounded-md p-3">
                  <div className="flex justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs">
                        @
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          @{comment.user.beawareUsername || 'anonymous'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(() => {
                            try {
                              const date = new Date(comment.createdAt);
                              return isNaN(date.getTime()) ? 'Date not available' : format(date, 'MMM d, yyyy h:mm a');
                            } catch {
                              return 'Date not available';
                            }
                          })()}
                        </p>
                      </div>
                    </div>
                    {comment.user.id === user?.id && (
                      <Badge variant="outline" className="h-fit">You</Badge>
                    )}
                  </div>
                  <p className="text-sm">{comment.content}</p>
                </div>
              ))}
            </div>
          )}
          
          {user ? (
            <form onSubmit={handleCommentSubmit} className="pt-4 border-t">
              <div className="space-y-4">
                <Textarea
                  placeholder="Add a comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="min-h-24"
                />
                <Button 
                  type="submit" 
                  disabled={isSubmittingComment || !comment.trim()}
                >
                  {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                </Button>
              </div>
            </form>
          ) : (
            <div className="pt-4 border-t">
              <div className="bg-muted p-4 rounded-md text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  You need to sign in to post comments
                </p>
                <div className="flex justify-center gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href="/login">Log In</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href="/register">Sign Up</Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}