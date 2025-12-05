import * as React from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import DashboardWorries from "@/components/user/DashboardWorries";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [resending, setResending] = React.useState(false);

  const handleResendVerification = async () => {
    if (!user?.email) return;
    
    setResending(true);
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });

      if (response.ok) {
        toast({
          title: "Email Sent",
          description: "A new verification email has been sent to your inbox.",
        });
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.message || "Failed to send verification email.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="space-y-6">
      {!user?.isEmailVerified && (
        <Alert variant="destructive" className="bg-yellow-50 border-yellow-200 text-yellow-800">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800">Email Verification Required</AlertTitle>
          <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
            <span>
              Your email address ({user?.email}) is not verified. Please check your inbox for the verification link.
              Some features may be limited until you verify your email.
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleResendVerification}
              disabled={resending}
              className="bg-white border-yellow-300 hover:bg-yellow-100 text-yellow-800 whitespace-nowrap"
            >
              {resending ? "Sending..." : "Resend Email"}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {user?.username}.
          </p>
        </div>
         <div className="mt-4 md:mt-0">
          <Link href="/my-security-score">
            <Button className="gap-2" disabled={!user?.isEmailVerified}>
              View My Security Score
              <ArrowRightIcon className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      <DashboardWorries />
    </div>
  );
}
