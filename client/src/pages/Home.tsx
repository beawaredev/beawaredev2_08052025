import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ShieldCheckIcon, 
  SearchIcon, 
  PhoneIcon, 
  MailIcon, 
  BuildingIcon, 
  ArrowRightIcon, 
  FileCheckIcon, 
  UsersIcon,
  LifeBuoyIcon 
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';

export default function Home() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [, setLocation] = useLocation();
  
  // Fetch recent scam reports
  const { data: recentReports, isLoading, error } = useQuery({
    queryKey: ['/api/scam-reports/recent']
  });
  
  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Redirect to search page with the search term
    if (searchTerm.trim()) {
      // Use wouter's setLocation for proper routing within the app
      setLocation(`/search?q=${encodeURIComponent(searchTerm)}`);
    }
  };
  
  // Helper to get scam identifier based on type
  const getScamIdentifier = (report: any) => {
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
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="py-12 md:py-20 bg-gradient-to-br from-primary/5 to-primary/10 border-b">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Report and Search for Scams with
                <span className="text-primary"> BeAware</span>
              </h1>
              <p className="text-sm md:text-base text-primary/80">Powered by you</p>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Protect yourself and others by reporting scams and searching our database of known fraudulent phone numbers, emails, and businesses.
              </p>
            </div>
            
            <div className="w-full max-w-md space-y-2">
              <form onSubmit={handleSearch} className="flex space-x-2">
                <Input
                  className="flex-1"
                  placeholder="Search for a phone number, email, or business..."
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button type="submit">
                  <SearchIcon className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </form>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild size="lg">
                <Link href="/report">Submit Report</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/reports">View Reports</Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/help">
                  <LifeBuoyIcon className="h-4 w-4 mr-2" />
                  Scam Help Guide
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">How BeAware Works</h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground">
                Our platform helps users report scams and protect communities from fraudulent activities.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
            <Card className="bg-card">
              <CardHeader className="flex flex-row items-start space-x-4 pb-2">
                <div className="p-2 bg-primary/10 rounded-full">
                  <FileCheckIcon className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <CardTitle>Report Scams</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Submit detailed reports about phone call scams, fraudulent emails, or deceptive businesses you've encountered.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-card">
              <CardHeader className="flex flex-row items-start space-x-4 pb-2">
                <div className="p-2 bg-primary/10 rounded-full">
                  <ShieldCheckIcon className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <CardTitle>Verification Process</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Our team reviews reports to verify their accuracy before they're published in our searchable database.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-card">
              <CardHeader className="flex flex-row items-start space-x-4 pb-2">
                <div className="p-2 bg-primary/10 rounded-full">
                  <SearchIcon className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <CardTitle>Search & Stay Informed</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Search our database to check if a phone number, email, or business has been reported as fraudulent before.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-card">
              <CardHeader className="flex flex-row items-start space-x-4 pb-2">
                <div className="p-2 bg-primary/10 rounded-full">
                  <LifeBuoyIcon className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <CardTitle>AI Scam Help</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Get immediate guidance and practical advice if you've been targeted by scammers through our AI-powered chat assistant.
                </p>
                <Button asChild variant="link" className="px-0 mt-2">
                  <Link href="/help" className="flex items-center">
                    Get Help <ArrowRightIcon className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Scam Types Section */}
      <section className="py-12 md:py-16 bg-muted">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Types of Scams We Track</h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground">
                We help identify and protect against different types of scams.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            <div className="flex flex-col items-center text-center space-y-2 p-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <PhoneIcon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Phone Scams</h3>
              <p className="text-muted-foreground">
                Robocalls, telemarketing fraud, tech support scams, and phone number spoofing.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center space-y-2 p-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <MailIcon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Email Scams</h3>
              <p className="text-muted-foreground">
                Phishing attempts, advance-fee scams, fake job offers, and email spoofing.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center space-y-2 p-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <BuildingIcon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Business Scams</h3>
              <p className="text-muted-foreground">
                Fake businesses, fraudulent services, ponzi schemes, and illegitimate operations.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Recent Reports Section */}
      <section className="py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-3xl font-bold tracking-tighter">Recent Scam Reports</h2>
                <p className="text-muted-foreground">
                  Latest verified scams reported by our community
                </p>
              </div>
              <Button asChild variant="outline" className="hidden md:flex">
                <Link href="/reports" className="flex items-center gap-1">
                  View All <ArrowRightIcon className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
            
            {isLoading ? (
              <div className="text-center py-12">Loading recent reports...</div>
            ) : !recentReports || recentReports.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No reports available yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                {recentReports.slice(0, 6).map((report: any) => {
                  // Format location from your imported data
                  const formatLocation = (report: any) => {
                    if (report.city && report.state) {
                      return `${report.city}, ${report.state}`;
                    } else if (report.city) {
                      return report.city;
                    } else if (report.state) {
                      return report.state;
                    } else if (report.country) {
                      return report.country;
                    } else {
                      return "Location not specified";
                    }
                  };

                  return (
                    <Link key={report.id} href={`/reports/${report.id}`} className="block">
                      <Card className="h-full transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer border-2 hover:border-primary/20">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center space-x-2">
                              {report.scamType === 'phone' && <PhoneIcon className="h-4 w-4 text-orange-500" />}
                              {report.scamType === 'email' && <MailIcon className="h-4 w-4 text-blue-500" />}
                              {report.scamType === 'business' && <BuildingIcon className="h-4 w-4 text-green-500" />}
                              <CardTitle className="text-lg">
                                {getScamIdentifier(report)}
                              </CardTitle>
                            </div>
                            <Badge variant={report.isVerified ? "default" : "outline"}>
                              {report.isVerified ? "Verified" : "Pending"}
                            </Badge>
                          </div>
                          <CardDescription>
                            Reported on {(() => {
                              try {
                                const date = new Date(report.reportedAt);
                                return isNaN(date.getTime()) ? 'Date not available' : format(date, 'MMM d, yyyy');
                              } catch {
                                return 'Date not available';
                              }
                            })()}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="line-clamp-3 text-muted-foreground">
                            {report.description}
                          </p>
                        </CardContent>
                        <CardFooter className="border-t pt-4">
                          <div className="flex justify-between items-center w-full">
                            <div className="flex items-center text-sm text-muted-foreground">
                              📍 {formatLocation(report)}
                            </div>
                            <ArrowRightIcon className="h-4 w-4 text-primary" />
                          </div>
                        </CardFooter>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
            
            <div className="flex justify-center md:hidden mt-4">
              <Button asChild variant="outline">
                <Link href="/reports">View All Reports</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-12 md:py-16 bg-primary text-primary-foreground">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Join the Fight Against Scams
              </h2>
              <p className="mx-auto max-w-[700px] opacity-90 md:text-xl">
                Help protect your community by reporting scams and sharing information.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {!user ? (
                <>
                  <Button asChild size="lg" variant="secondary">
                    <Link href="/register">Create Account</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link href="/login">Log In</Link>
                  </Button>
                </>
              ) : (
                <Button asChild size="lg" variant="secondary">
                  <Link href="/report">Submit Report Now</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}