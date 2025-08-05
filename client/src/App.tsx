import React from "react";
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import ScamReportForm from "@/pages/ScamReportForm";
import ScamReports from "@/pages/ScamReports";
import ScamReportDetail from "@/pages/ScamReportDetail";
import ConsolidatedScamDetail from "@/pages/ConsolidatedScamDetail";

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
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileNav from "@/components/layout/MobileNav";
import { AuthProvider } from "@/contexts/AuthContext";
import { useState, useEffect, createContext, useContext } from "react";

// Import User type from the AuthContext
interface User {
  id: number;
  email: string;
  displayName: string;
  role: 'admin' | 'user' | 'lawyer';
  authProvider: 'local' | 'google';
  googleId?: string;
}

// Import the useAuth hook
import { useAuth } from "@/contexts/AuthContext";

// Simplified ProtectedRoute component
function ProtectedRoute({ component: Component, adminOnly = false, ...rest }: { 
  component: React.ComponentType; 
  adminOnly?: boolean;
  [x: string]: any 
}) {
  const { user, isLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isValidatingAdmin, setIsValidatingAdmin] = useState<boolean>(false);
  
  useEffect(() => {
    if (!isLoading && user) {
      // Double-check that we have the correct role from localStorage
      const userJson = localStorage.getItem('user');
      if (userJson) {
        try {
          const userData = JSON.parse(userJson);
          
          // If this is an admin route, and we're using the admin credentials, ensure role is set properly
          if (adminOnly && (userData.email === 'admin@beaware.com' || userData.email === 'admin@scamreport.com')) {
            setIsAdmin(true);
            return;
          }
          
          setIsAdmin(userData.role === "admin");
        } catch (error) {
          console.error("Error parsing user from localStorage:", error);
        }
      } else {
        setIsAdmin(user.role === "admin");
      }
    }
  }, [user, isLoading, adminOnly]);
  
  // Special check for admin emails - we know these should be admin users
  useEffect(() => {
    if (adminOnly && user && (user.email === "admin@scamreport.com" || user.email === "admin@beaware.com") && !isAdmin) {
      setIsValidatingAdmin(true);
      
      // Force update the role in localStorage
      const userJson = localStorage.getItem('user');
      if (userJson) {
        try {
          const userData = JSON.parse(userJson);
          if (userData.email === "admin@scamreport.com" || userData.email === "admin@beaware.com") {
            userData.role = "admin";
            localStorage.setItem('user', JSON.stringify(userData));
            setIsAdmin(true);
          }
        } catch (error) {
          console.error("Error updating admin role:", error);
        }
      }
      
      setIsValidatingAdmin(false);
    }
  }, [user, adminOnly, isAdmin]);
  
  if (isLoading || isValidatingAdmin) {
    return <div className="p-8 flex justify-center">Loading authentication...</div>;
  }
  
  if (!user) {
    // Check localStorage for user data before redirecting
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      // Redirect to login if not authenticated
      window.location.href = "/login";
      return null;
    }
    // User data exists in localStorage, component will re-render when context updates
    return <div className="p-8 flex justify-center">Loading user session...</div>;
  }
  
  if (adminOnly && !isAdmin) {
    // Redirect to dashboard if not admin
    window.location.href = "/dashboard";
    return null;
  }
  
  return <Component {...rest} />;
}

function MainRouter() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/google-signup-confirm" component={GoogleSignupConfirm} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/lawyer-register" component={LawyerRegister} />
      <Route path="/dashboard">
        {() => <ProtectedRoute component={Dashboard} />}
      </Route>
      <Route path="/report">
        {() => <ProtectedRoute component={ScamReportForm} />}
      </Route>
      <Route path="/reports" component={ScamReports} />
      <Route path="/reports/:id">
        {(params) => <ScamReportDetail id={params.id} />}
      </Route>
      <Route path="/consolidated-scams/:id">
        {(params) => <ConsolidatedScamDetail id={params.id} />}
      </Route>
      <Route path="/search" component={() => { window.location.href = "/reports"; return null; }} />
      <Route path="/scam-videos" component={ScamVideos} />
      <Route path="/help" component={ScamHelp} />
      <Route path="/contact" component={ContactUs} />
      <Route path="/legal-help" component={LegalHelp} />
      <Route path="/scam-lookup" component={ScamLookup} />
      <Route path="/about" component={About} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/disclaimer" component={Disclaimer} />
      <Route path="/admin">
        {() => <ProtectedRoute component={AdminPanel} adminOnly={true} />}
      </Route>
      <Route path="/settings">
        {() => <ProtectedRoute component={Settings} />}
      </Route>
      <Route path="/secure-your-digital-presence">
        {() => <ProtectedRoute component={DigitalSecurityChecklist} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [firebaseConfigValid, setFirebaseConfigValid] = useState(true);
  
  // Check Firebase config and handle Google login success on mount
  useEffect(() => {
    // Check for Google login success flag and redirect if needed
    const googleLoginSuccess = localStorage.getItem('googleLoginSuccess');
    if (googleLoginSuccess === 'true') {
      console.log('Google login success detected at app root, redirecting to dashboard');
      localStorage.removeItem('googleLoginSuccess');
      window.location.href = '/dashboard';
      return;
    }
    
    const checkFirebaseConfig = () => {
      const requiredKeys = [
        'VITE_FIREBASE_API_KEY',
        'VITE_FIREBASE_PROJECT_ID',
        'VITE_FIREBASE_APP_ID'
      ];
      
      const missingKeys = requiredKeys.filter(key => !import.meta.env[key]);
      
      if (missingKeys.length > 0) {
        console.error('Missing Firebase configuration:', missingKeys);
        setFirebaseConfigValid(false);
        return false;
      }
      
      return true;
    };
    
    checkFirebaseConfig();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {!firebaseConfigValid && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md">
            <h2 className="text-xl font-bold text-red-600 mb-4">Firebase Configuration Error</h2>
            <p className="mb-4">
              Missing required Firebase environment variables. Please make sure the following 
              environment variables are set properly:
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
        <div className="flex h-screen overflow-hidden">
          <Sidebar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
          
          <div className="flex flex-col flex-1 overflow-hidden">
            <Header onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />
            
            <main className="flex-1 overflow-y-auto p-4 pb-16">
              <MainRouter />
            </main>
            
            <Footer />
          </div>
        </div>
        
        <MobileNav />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
