import React, { useEffect, useState } from "react";
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";

/* ---------- Pages ---------- */
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import ScamHelp from "@/pages/ScamHelp";
import AdminPanel from "@/pages/AdminPanel";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import LawyerRegister from "@/pages/LawyerRegister";
import LegalHelp from "@/pages/LegalHelp";
import Settings from "@/pages/Settings";
import ScamVideos from "@/pages/ScamVideos";
import ContactUs from "@/pages/ContactUs";
import About from "@/pages/About";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import Disclaimer from "@/pages/Disclaimer";
import DigitalSecurityChecklist from "@/pages/DigitalSecurityChecklist";
import GoogleSignupConfirm from "@/pages/GoogleSignupConfirm";
import ScamLookup from "@/pages/ScamLookup";
import NotFound from "@/pages/not-found";

/* ---------- Layout ---------- */
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileNav from "@/components/layout/MobileNav";

/* ---------- Auth ---------- */
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

/* ============================================================
   ProtectedRoute (data-driven + redirect memory)
============================================================ */
function ProtectedRoute({
  component: Component,
  adminOnly = false,
  ...rest
}: {
  component: React.ComponentType;
  adminOnly?: boolean;
  [x: string]: any;
}) {
  const { user, isLoading, setIntendedPath } = useAuth();

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">Loading authentication…</div>
    );
  }

  if (!user) {
    const target = window.location.pathname + (window.location.search || "");
    // Remember where the user wanted to go
    setIntendedPath(target);
    // Also pass it in the URL for robustness
    window.location.href = `/login?next=${encodeURIComponent(target)}`;
    return null;
  }

  if (adminOnly && user.role !== "admin") {
    window.location.href = "/dashboard";
    return null;
  }

  return <Component {...rest} />;
}

/* ============================================================
   MainRouter
============================================================ */
function MainRouter() {
  return (
    <Switch>
      {/* Public */}
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/google-signup-confirm" component={GoogleSignupConfirm} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/lawyer-register" component={LawyerRegister} />
      <Route path="/scam-videos" component={ScamVideos} />
      <Route path="/help" component={ScamHelp} />
      <Route path="/contact" component={ContactUs} />
      <Route path="/legal-help" component={LegalHelp} />
      <Route path="/scam-lookup" component={ScamLookup} />
      <Route path="/about" component={About} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/disclaimer" component={Disclaimer} />

      {/* Private */}
      <Route path="/admin">
        {() => <ProtectedRoute component={AdminPanel} adminOnly={true} />}
      </Route>
      <Route path="/settings">
        {() => <ProtectedRoute component={Settings} />}
      </Route>
      <Route path="/dashboard">
        {() => <ProtectedRoute component={Dashboard} />}
      </Route>
      <Route path="/secure-your-digital-presence">
        {() => <ProtectedRoute component={DigitalSecurityChecklist} />}
      </Route>

      {/* 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

/* ============================================================
   AppShell
============================================================ */
function AppShell() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar only for logged-in users */}
      {user && (
        <Sidebar
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />
      )}

      <div className="flex flex-col flex-1 overflow-hidden">
        <Header onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />

        <main className="flex-1 overflow-y-auto p-4 pb-16">
          <MainRouter />
        </main>

        <Footer />
      </div>

      <MobileNav />
      <Toaster />
    </div>
  );
}

/* ============================================================
   App
============================================================ */
function App() {
  const [firebaseConfigValid, setFirebaseConfigValid] = useState(true);

  useEffect(() => {
    const requiredKeys = [
      "VITE_FIREBASE_API_KEY",
      "VITE_FIREBASE_PROJECT_ID",
      "VITE_FIREBASE_APP_ID",
    ];
    const missingKeys = requiredKeys.filter((key) => !import.meta.env[key]);
    if (missingKeys.length > 0) {
      console.error("Missing Firebase configuration:", missingKeys);
      setFirebaseConfigValid(false);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {!firebaseConfigValid && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md">
            <h2 className="text-xl font-bold text-red-600 mb-4">
              Firebase Configuration Error
            </h2>
            <p className="mb-4">
              Missing required Firebase environment variables. Please make sure
              the following environment variables are set properly:
            </p>
            <ul className="list-disc pl-5 mb-4 text-sm">
              <li>VITE_FIREBASE_API_KEY</li>
              <li>VITE_FIREBASE_PROJECT_ID</li>
              <li>VITE_FIREBASE_APP_ID</li>
            </ul>
            <p className="text-sm text-gray-600">
              These are required for Google authentication to work properly.
              Check the Firebase console and update your environment variables.
            </p>
          </div>
        </div>
      )}

      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
