import React, { useEffect, useState, useRef } from "react";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function VerifyEmail() {
  const [location, setLocation] = useLocation();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const { toast } = useToast();
  const { refreshUser, user } = useAuth();
  const verificationAttempted = useRef(false);

  useEffect(() => {
    if (verificationAttempted.current) return;
    verificationAttempted.current = true;

    const verify = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const token = searchParams.get("token");

      if (!token) {
        setStatus("error");
        return;
      }

      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        if (response.ok) {
          setStatus("success");
          toast({
            title: "Email Verified",
            description: "Your email has been successfully verified.",
          });
          // Refresh user session to update verification status
          refreshUser();
        } else {
          setStatus("error");
        }
      } catch (error) {
        console.error("Verification error:", error);
        setStatus("error");
      }
    };

    verify();
  }, [toast, refreshUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Email Verification</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          {status === "verifying" && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p>Verifying your email...</p>
            </>
          )}
          {status === "success" && (
            <>
              <CheckCircle className="h-12 w-12 text-green-500" />
              <p className="text-center">Your email has been verified successfully!</p>
              <Button onClick={() => setLocation(user ? "/dashboard" : "/login")}>
                {user ? "Continue to Dashboard" : "Go to Login"}
              </Button>
            </>
          )}
          {status === "error" && (
            <>
              <XCircle className="h-12 w-12 text-red-500" />
              <p className="text-center">
                Verification failed. The link may be invalid or expired.
              </p>
              <Button variant="outline" onClick={() => setLocation(user ? "/dashboard" : "/login")}>
                {user ? "Back to Dashboard" : "Back to Login"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
