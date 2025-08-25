import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, User, Mail, Shield } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { apiRequest } from "@/lib/queryClient";
import { getApiUrl } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function GoogleSignupConfirm() {
  const [_, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [googleUserData, setGoogleUserData] = useState<any>(null);
  const { toast } = useToast();
  const { completePostLoginRedirect } = useAuth();

  useEffect(() => {
    // Clear the signup handling flag
    localStorage.removeItem("handlingGoogleSignup");

    // Get pending Google signup data
    const pendingData = localStorage.getItem("pendingGoogleSignup");
    if (!pendingData) {
      setLocation("/login");
      return;
    }

    try {
      const userData = JSON.parse(pendingData);
      setGoogleUserData(userData);
    } catch {
      setLocation("/login");
    }
  }, [setLocation]);

  const handleCreateAccount = async () => {
    if (!googleUserData) return;

    try {
      setIsLoading(true);

      const response = await apiRequest(getApiUrl("auth/google-signup"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: googleUserData.email,
          displayName: googleUserData.displayName,
          googleId: googleUserData.googleId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          // Persist user locally with provider so AuthContext can manage logout appropriately
          const toStore = { ...data.user, authProvider: "google" as const };
          localStorage.setItem("user", JSON.stringify(toStore));

          // Cleanup flags/attempts
          localStorage.removeItem("pendingGoogleSignup");
          localStorage.removeItem("handlingGoogleSignup");

          if (googleUserData?.email && googleUserData?.googleId) {
            const attemptKey = `${googleUserData.email}:${googleUserData.googleId}`;
            localStorage.removeItem(`lastGoogleAttempt:${attemptKey}`);
            localStorage.removeItem(`googleAttempts:${attemptKey}`);
            localStorage.removeItem(`googleSignupBlock:${attemptKey}`);
            localStorage.removeItem(`firebaseDisabled:${attemptKey}`);
            localStorage.removeItem(`signupRedirected:${attemptKey}`);
          }

          toast({
            title: "Account Created Successfully",
            description: "Welcome to BeAware! Your account has been created.",
          });

          if (data?.canChangeUsername) {
            toast({
              title: "Welcome to BeAware!",
              description: `Your username is ${data.user.beawareUsername}. You can change it once in your profile.`,
            });
          }

          // Important: use hard navigation or the helper to ensure
          // ProtectedRoute sees the new session (avoids loop back to /login)
          completePostLoginRedirect("/dashboard");
          return;
        }
      } else {
        const errorData = await response.json();
        toast({
          title: "Signup Failed",
          description:
            errorData.message || "Failed to create account. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating Google account:", error);
      toast({
        title: "Signup Error",
        description:
          "An error occurred while creating your account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    localStorage.removeItem("pendingGoogleSignup");
    localStorage.removeItem("handlingGoogleSignup");

    if (googleUserData?.email && googleUserData?.googleId) {
      const attemptKey = `${googleUserData.email}:${googleUserData.googleId}`;
      localStorage.removeItem(`lastGoogleAttempt:${attemptKey}`);
      localStorage.removeItem(`googleAttempts:${attemptKey}`);
      localStorage.removeItem(`googleSignupBlock:${attemptKey}`);
      localStorage.removeItem(`firebaseDisabled:${attemptKey}`);
      localStorage.removeItem(`signupRedirected:${attemptKey}`);
    }

    setLocation("/login");
  };

  if (!googleUserData) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1">
          <div className="flex flex-col items-center mb-4">
            <h1 className="text-2xl font-bold text-primary">BeAware</h1>
            <p className="text-xs text-muted-foreground">Powered by you</p>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Create Your Account
          </CardTitle>
          <CardDescription className="text-center">
            Complete your registration with Google
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              We've verified your Google account. Complete your registration to
              access BeAware.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-4 bg-muted rounded-lg">
              <FcGoogle size={24} />
              <div className="flex-1">
                <p className="font-medium">Google Account</p>
                <p className="text-sm text-muted-foreground">
                  Authenticated successfully
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">
                    {googleUserData.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Display Name</p>
                  <p className="text-sm text-muted-foreground">
                    {googleUserData.displayName}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Account Type</p>
                  <p className="text-sm text-muted-foreground">Standard User</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleCreateAccount}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Creating Account..." : "Create My Account"}
            </Button>

            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
              className="w-full"
            >
              Cancel
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              By creating an account, you agree to our terms of service and
              privacy policy.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
