import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ScaleIcon, BookOpenIcon, UsersIcon, HeartIcon, Clock } from "lucide-react";

export default function LawyerRegister() {
  return (
    <div className="container max-w-7xl py-12 space-y-8">
      <div className="text-center space-y-2 max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          Join Our Legal Network
        </h1>
        <p className="text-xl text-muted-foreground">
          Help scam victims recover and protect their rights
        </p>
        <div className="inline-block mt-4 bg-amber-100 text-amber-800 py-2 px-4 rounded-full font-medium">
          Coming Soon
        </div>
      </div>
      
      {/* Coming Soon Message */}
      <div className="max-w-3xl mx-auto bg-muted rounded-lg p-8 text-center my-12">
        <Clock className="h-12 w-12 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-3">Lawyer Registration Platform Under Development</h2>
        <p className="text-muted-foreground mb-6">
          We're currently building our attorney network platform to connect scam victims with qualified legal professionals. 
          This feature will be available soon.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 max-w-2xl mx-auto">
          <div className="p-4 border rounded-md">
            <h3 className="font-medium mb-2">Interested in joining?</h3>
            <p className="text-sm text-muted-foreground">
              When we launch, you'll be able to register your practice and connect with clients who need your expertise.
            </p>
          </div>
          <div className="p-4 border rounded-md">
            <h3 className="font-medium mb-2">Get notified</h3>
            <p className="text-sm text-muted-foreground">
              Check back soon or explore our <Link href="/help" className="text-primary hover:underline">scam resources</Link> to learn more about the types of cases we handle.
            </p>
          </div>
        </div>
      </div>
      
      {/* Benefits section (preview) */}
      <div className="mt-6">
        <h2 className="text-2xl font-bold mb-6 text-center">Benefits of Joining Our Network</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col items-center text-center p-4 rounded-lg border">
            <div className="p-2 rounded-full bg-primary/10 mb-3">
              <UsersIcon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-medium mb-1">Connect with Clients</h3>
            <p className="text-sm text-muted-foreground">Receive qualified leads from scam victims seeking legal assistance.</p>
          </div>
          
          <div className="flex flex-col items-center text-center p-4 rounded-lg border">
            <div className="p-2 rounded-full bg-primary/10 mb-3">
              <ScaleIcon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-medium mb-1">Showcase Expertise</h3>
            <p className="text-sm text-muted-foreground">Highlight your specialization in fraud recovery and consumer protection.</p>
          </div>
          
          <div className="flex flex-col items-center text-center p-4 rounded-lg border">
            <div className="p-2 rounded-full bg-primary/10 mb-3">
              <BookOpenIcon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-medium mb-1">Build Your Practice</h3>
            <p className="text-sm text-muted-foreground">Expand your client base and grow your reputation in fraud recovery.</p>
          </div>
          
          <div className="flex flex-col items-center text-center p-4 rounded-lg border">
            <div className="p-2 rounded-full bg-primary/10 mb-3">
              <HeartIcon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-medium mb-1">Make an Impact</h3>
            <p className="text-sm text-muted-foreground">Help victims recover from financial harm and hold scammers accountable.</p>
          </div>
        </div>
      </div>
      
      {/* Return to home */}
      <div className="text-center mt-12">
        <Button asChild>
          <Link href="/" className="flex items-center gap-2">
            Return to Home
          </Link>
        </Button>
      </div>
    </div>
  );
}