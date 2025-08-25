import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";

/** ===== Types ===== */
export type UserRole = "admin" | "user";
export type AuthProviderName = "google" | "local";

export interface AuthUser {
  id: string | number;
  email: string;
  displayName?: string | null;
  beawareUsername?: string | null;
  role: UserRole;
  authProvider: AuthProviderName;
}

interface AuthContextShape {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (
    email: string,
    password: string,
    displayName: string,
    beawareUsername?: string,
  ) => Promise<any>;
  loginWithGoogle: () => Promise<any>;
  logout: () => Promise<void>;

  /** Redirect helpers */
  setIntendedPath: (path: string) => void;
  completePostLoginRedirect: (fallback?: string) => void;
}

const AuthContext = createContext<AuthContextShape | null>(null);

/** ===== Local/session storage helpers ===== */
const LS_USER_KEY = "user";
const SS_REDIRECT_TO = "redirectTo";

function loadUserFromStorage(): AuthUser | null {
  const raw = localStorage.getItem(LS_USER_KEY);
  if (!raw) return null;
  try {
    const u = JSON.parse(raw);
    if (!u?.email || !u?.role) return null;
    return u;
  } catch {
    localStorage.removeItem(LS_USER_KEY);
    return null;
  }
}
function saveUserToStorage(u: AuthUser) {
  localStorage.setItem(LS_USER_KEY, JSON.stringify(u));
}
function clearUserStorage() {
  localStorage.removeItem(LS_USER_KEY);
}

function setRedirectTo(path: string) {
  sessionStorage.setItem(SS_REDIRECT_TO, path);
}
function popRedirectTo(): string | null {
  const v = sessionStorage.getItem(SS_REDIRECT_TO);
  if (v) sessionStorage.removeItem(SS_REDIRECT_TO);
  return v;
}

/** ===== Provider ===== */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate from localStorage and keep Google sessions in sync
  useEffect(() => {
    const stored = loadUserFromStorage();
    if (stored) setUser(stored);

    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      try {
        const current = loadUserFromStorage();
        if (!firebaseUser) {
          // If a Google session ended, clear only if the stored session was Google
          if (current?.authProvider === "google") {
            clearUserStorage();
            setUser(null);
          }
          return;
        }
        // If Firebase is signed in but our backend session already exists, no-op here.
      } finally {
        setIsLoading(false);
      }
    });

    // Pure local auth? Stop loading shortly in case there are no Firebase events.
    const t = setTimeout(() => setIsLoading(false), 150);
    return () => {
      clearTimeout(t);
      unsubscribe();
    };
  }, []);

  /** ----- Local (backend) login ----- */
  const login = async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      let msg = "Login failed";
      try {
        const e = await res.json();
        msg = e?.message || msg;
      } catch {}
      throw new Error(msg);
    }

    const data = await res.json();
    if (!data?.success || !data?.user)
      throw new Error("Invalid login response");

    const nextUser: AuthUser = {
      ...data.user,
      authProvider: "local",
      role: (data.user.role as UserRole) || "user",
    };
    saveUserToStorage(nextUser);
    setUser(nextUser);
    return data;
  };

  /** ----- Local (backend) registration ----- */
  const register = async (
    email: string,
    password: string,
    displayName: string,
    beawareUsername?: string,
  ) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        displayName,
        beawareUsername,
        authProvider: "local",
      }),
    });

    if (!res.ok) {
      let msg = "Registration failed";
      try {
        const e = await res.json();
        msg = e?.message || msg;
      } catch {}
      throw new Error(msg);
    }

    const data = await res.json();
    if (!data?.success || !data?.user)
      throw new Error("Invalid registration response");

    const nextUser: AuthUser = {
      ...data.user,
      authProvider: "local",
      role: (data.user.role as UserRole) || "user",
    };
    saveUserToStorage(nextUser);
    setUser(nextUser);
    return data;
  };

  /** ----- Google login (Firebase + backend) ----- */
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const firebaseUser = result.user;

    const email = firebaseUser.email;
    const googleId = firebaseUser.uid;
    const displayName = firebaseUser.displayName;

    if (!email || !googleId) throw new Error("Missing Google account details");

    const token = await firebaseUser.getIdToken();

    const res = await fetch("/api/auth/google-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ email, googleId, displayName }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Google login failed");
    }

    const data = await res.json();
    if (!data?.success || !data?.user)
      throw new Error("Invalid Google login response");

    const nextUser: AuthUser = {
      ...data.user,
      authProvider: "google",
      role: (data.user.role as UserRole) || "user",
    };
    saveUserToStorage(nextUser);
    setUser(nextUser);
    return data;
  };

  /** ----- Logout ----- */
  const logout = async () => {
    const current = loadUserFromStorage();
    try {
      if (current?.authProvider === "google") {
        await firebaseSignOut(auth);
      }
    } finally {
      clearUserStorage();
      setUser(null);
    }
  };

  /** ----- Redirect helpers ----- */
  const setIntendedPath = (path: string) => {
    if (!path) return;
    setRedirectTo(path);
  };

  const completePostLoginRedirect = (fallback = "/dashboard") => {
    // 1) Honor ?next=<path> query param if present
    try {
      const usp = new URLSearchParams(window.location.search);
      const nextFromQuery = usp.get("next");
      if (nextFromQuery && nextFromQuery.startsWith("/")) {
        window.location.assign(nextFromQuery);
        return;
      }
    } catch {
      /* no-op */
    }
    // 2) Otherwise, use what we stored earlier
    const stored = popRedirectTo();
    if (stored && stored.startsWith("/")) {
      window.location.assign(stored);
      return;
    }
    // 3) Default
    window.location.assign(fallback);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        loginWithGoogle,
        logout,
        setIntendedPath,
        completePostLoginRedirect,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
