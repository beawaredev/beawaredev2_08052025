import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "@/lib/firebase";

const AuthContext = createContext<any>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check for existing user data in localStorage on app start
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        console.log("Restored user from localStorage:", userData.email, "Role:", userData.role);
      } catch (error) {
        console.error("Error parsing stored user data:", error);
        localStorage.removeItem("user");
      }
    }

    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      console.log("Firebase auth state changed:", firebaseUser ? "User signed in" : "User signed out");
      
      if (firebaseUser) {
        // Check if we already have user data in localStorage
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            console.log("Using existing user data from localStorage");
            return;
          } catch (error) {
            console.error("Error parsing stored user data:", error);
            localStorage.removeItem("user");
          }
        }
        
        // If no stored user data, user might have just signed in but not completed backend auth
        console.log("Firebase user exists but no local user data - user may need to complete signup");
      } else {
        // Only clear user data if there's no stored user data from native login
        const storedUser = localStorage.getItem("user");
        console.log("Checking stored user for auth provider:", storedUser);
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            console.log("Parsed user data auth provider:", userData.authProvider);
            // If this is a native login user (authProvider: "local"), don't clear on Firebase signout
            if (userData.authProvider === "local") {
              console.log("Native login user detected, preserving session despite Firebase signout");
              setUser(userData);
              return;
            }
            // Special case: preserve admin session regardless of auth provider
            if (userData.email === "admin@beaware.com" || userData.email === "admin@scamreport.com") {
              console.log("Admin user detected, preserving session despite Firebase signout");
              setUser(userData);
              return;
            }
          } catch (error) {
            console.error("Error parsing stored user data:", error);
          }
        }
        
        // Firebase user signed out, clear everything for Google users only
        console.log("Firebase user signed out, clearing local user data (Google user or no stored user)");
        setUser(null);
        localStorage.removeItem("user");
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log(`Attempting native login for email: ${email}`);
      
      // Call our backend API for native login
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Backend native login failed:", errorData);
        throw new Error(errorData.message || "Login failed");
      }

      const responseData = await response.json();
      console.log("Backend native login successful:", responseData);

      if (responseData.success && responseData.user) {
        // Store user data locally for immediate availability
        localStorage.setItem("user", JSON.stringify(responseData.user));
        setUser(responseData.user);
        console.log("Native login completed, user set:", responseData.user.email);
      } else {
        throw new Error("Invalid response from server");
      }
      
      return responseData;
    } catch (error) {
      console.error("Native login failed:", error);
      throw error;
    }
  };

  const register = async (email: string, password: string, displayName: string, beawareUsername?: string) => {
    try {
      console.log(`Attempting native registration for email: ${email}`);
      
      // Call our backend API for native registration
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          email, 
          password, 
          displayName,
          beawareUsername,
          authProvider: "local"
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Backend native registration failed:", errorData);
        throw new Error(errorData.message || "Registration failed");
      }

      const responseData = await response.json();
      console.log("Backend native registration successful:", responseData);

      if (responseData.success && responseData.user) {
        // Store user data locally for immediate availability
        localStorage.setItem("user", JSON.stringify(responseData.user));
        setUser(responseData.user);
        console.log("Native registration completed, user set:", responseData.user.email);
      } else {
        throw new Error("Invalid response from server");
      }
      
      return responseData;
    } catch (error) {
      console.error("Native registration failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    const storedUser = localStorage.getItem("user");
    
    // If it's a Google user, sign out from Firebase
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        if (userData.authProvider === "google") {
          await signOut(auth);
        }
      } catch (error) {
        console.error("Error parsing user data during logout:", error);
      }
    }
    
    // Always clear local storage and user state
    setUser(null);
    localStorage.removeItem("user");
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();

    try {
      console.log("Starting Google login with popup...");
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      const email = firebaseUser.email;
      const googleId = firebaseUser.uid;
      const displayName = firebaseUser.displayName;

      if (!email || !googleId) {
        console.error("Missing email or googleId from Google user:", {
          email,
          googleId,
        });
        throw new Error("Missing email or Google ID");
      }

      console.log("Google signin successful, sending to backend:", { email, googleId, displayName });

      // Get Firebase ID token
      const token = await firebaseUser.getIdToken();

      // Send to backend API
      const response = await fetch("/api/auth/google-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email,
          googleId,
          displayName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Backend Google login failed:", errorData);
        throw new Error(`Backend login failed: ${errorData}`);
      }

      const responseData = await response.json();
      console.log("Backend login successful:", responseData);

      if (responseData.success && responseData.user) {
        // Store user data locally for immediate availability
        localStorage.setItem("user", JSON.stringify(responseData.user));
        setUser(responseData.user);
        
        // If user needs username, show that they can change it later
        if (responseData.needsUsername) {
          console.log("New user created with auto-generated username:", responseData.user.beawareUsername);
        }
      }
      
      return responseData;
    } catch (error) {
      console.error("Google login failed:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, login, register, logout, loginWithGoogle }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
