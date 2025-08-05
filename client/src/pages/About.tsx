import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Helmet } from "react-helmet";

export default function About() {
  return (
    <div className="container mx-auto py-8 px-4">
      <Helmet>
        <title>About Us | BeAware.fyi</title>
      </Helmet>
      
      <h1 className="text-3xl font-bold mb-6">About BeAware.fyi</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <Card>
          <CardHeader>
            <CardTitle>Our Mission</CardTitle>
            <CardDescription>Empowering people to protect themselves from scams</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              BeAware.fyi was created with a simple yet powerful mission: to help people identify, 
              avoid, and report scams by creating a community-driven database of scam reports.
            </p>
            <p>
              We believe that sharing information about scam attempts is one of the most effective ways 
              to prevent others from falling victim to the same schemes, which is why our platform is 
              powered by user contributions and verified by our dedicated team.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Our Approach</CardTitle>
            <CardDescription>Community-powered scam prevention</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              BeAware.fyi takes a unique approach to scam prevention by combining:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>User-submitted scam reports that detail real-world encounters</li>
              <li>Verification processes to ensure data quality</li>
              <li>Advanced search functionality to quickly find information</li>
              <li>Educational resources to help recognize scam patterns</li>
              <li>AI-powered assistance for personalized guidance</li>
            </ul>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mb-12">
        <CardHeader>
          <CardTitle>How BeAware.fyi Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-lg font-medium mb-2">Users Report Scams</h3>
              <p className="text-sm text-muted-foreground">
                Community members submit details about scam attempts they've encountered, 
                including phone numbers, emails, or business names.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="text-lg font-medium mb-2">Admin Verification</h3>
              <p className="text-sm text-muted-foreground">
                Our team reviews submissions to ensure quality and accuracy before 
                publishing them to the public database.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="text-lg font-medium mb-2">Public Access</h3>
              <p className="text-sm text-muted-foreground">
                Anyone can search our database to verify suspicious contacts or learn about 
                current scam tactics through our educational resources.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Join Our Effort</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            BeAware.fyi depends on community involvement to grow our database and help protect more people. 
            You can contribute by:
          </p>
          <ul className="list-disc pl-6 space-y-2 mb-6">
            <li>Creating an account and submitting scam reports you encounter</li>
            <li>Sharing our resources with friends and family</li>
            <li>Providing feedback on how we can improve</li>
          </ul>
          <p className="text-center font-medium">
            Together, we can build a safer digital world for everyone.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}