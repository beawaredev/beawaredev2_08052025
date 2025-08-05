import { initializeApp, getApps, getApp, deleteApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirebaseConfig, getAuthStrategy, logAuthDiagnostics, detectEnvironment } from "./auth-config";

// Get configuration based on environment
const firebaseConfig = getFirebaseConfig();

// Log diagnostics (useful for debugging)
logAuthDiagnostics();

// Initialize Firebase only if it hasn't been initialized yet
let app;
try {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
} catch (error) {
  console.error("Firebase initialization error:", error);
  app = initializeApp(firebaseConfig);
}

// Get auth
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Configure Google provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    // First, make sure Firebase is initialized correctly
    if (!auth) {
      console.error("Firebase Auth is not initialized properly");
      throw new Error("Firebase Auth is not initialized properly");
    }
    
    // Get the appropriate auth strategy for the current environment
    const authStrategy = getAuthStrategy();
    console.log("Using auth strategy:", authStrategy);
    
    // Set persistence to LOCAL first to ensure the session persists even on page refreshes
    console.log("Setting persistent auth state...");
    await setPersistence(auth, browserLocalPersistence);
    
    let result;
    
    if (authStrategy === 'redirect_workaround') {
      // For iframe environments (like Replit), open in a new window/tab
      console.log("Using redirect workaround for iframe environment");
      
      // Open the Google sign in page directly in a new tab/window
      // This bypasses the cross-origin restrictions in iframes
      const authUrl = `https://${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com/__/auth/handler?provider=google`;
      console.log("Opening auth in new window:", authUrl);
      window.open(authUrl, '_blank');
      
      // Set a flag in localStorage so we know to check for redirect result
      localStorage.setItem('awaitingGoogleRedirect', 'true');
      
      // Result will be handled by handleRedirectResult on next page load
      return null;
    } else {
      // For normal environments, try popup flow first
      try {
        console.log("Starting Google Sign-In with popup...");
        result = await signInWithPopup(auth, googleProvider);
        
        console.log("Google sign-in with popup successful:", {
          email: result.user.email,
          displayName: result.user.displayName,
          uid: result.user.uid
        });
      } catch (popupError: any) {
        // Handle popup-specific errors
        if (popupError.code === 'auth/popup-blocked') {
          console.warn("Popup blocked by browser. Falling back to redirect method...");
          await signInWithRedirect(auth, googleProvider);
          return null;
        } else if (popupError.code === 'auth/popup-closed-by-user') {
          console.warn("User closed the popup. Authentication cancelled.");
          throw popupError;
        } else if (popupError.code === 'auth/unauthorized-domain') {
          console.warn("Domain not authorized for popup. Falling back to redirect in new window...");
          
          // Open a new window as a fallback for unauthorized domain
          const authUrl = `https://${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com/__/auth/handler?provider=google`;
          window.open(authUrl, '_blank');
          return null;
        } else {
          // For other popup errors, fall back to redirect
          console.warn("Popup auth failed with error:", popupError.code, "Falling back to redirect...");
          await signInWithRedirect(auth, googleProvider);
          return null;
        }
      }
    }
    
    // Save user to localStorage and sync with our backend
    if (result && result.user) {
      try {
        const authUser = {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName
        };
        
        localStorage.setItem('authUser', JSON.stringify(authUser));
        console.log("User saved to localStorage");
        
        // Sync with our backend
        await syncUserWithBackend(result.user);
      } catch (err) {
        console.warn("Could not save user to localStorage or sync with backend:", err);
      }
    }
    
    return result;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    
    // Log specific details for common errors
    if (error && typeof error === 'object' && 'code' in error) {
      const firebaseError = error as { code: string };
      if (firebaseError.code === 'auth/invalid-credential') {
        console.error("Invalid credential error - check Firebase console authorized domains");
      } else if (firebaseError.code === 'auth/operation-not-allowed') {
        console.error("Google sign-in may not be enabled in the Firebase console");
      } else if (firebaseError.code === 'auth/unauthorized-domain') {
        console.error("Domain not authorized - add this domain to Firebase console");
        console.error("Current hostname:", window.location.hostname);
      }
    }
    
    throw error;
  }
};

// Legacy signout function (replaced by enhanced version below)

// Handle redirect result from Google Auth
export const handleRedirectResult = async () => {
  try {
    console.log("Checking for Google auth redirect result...");
    
    // Get environment info
    const { isInIframe, hostname } = detectEnvironment();
    console.log("Environment when checking redirect:", { isInIframe, hostname });
    
    // Check if we were waiting for a redirect result from our workaround
    const awaitingRedirect = localStorage.getItem('awaitingGoogleRedirect') === 'true';
    if (awaitingRedirect) {
      console.log("We were waiting for a Google redirect result");
      // Clear the flag
      localStorage.removeItem('awaitingGoogleRedirect');
    }
    
    const result = await getRedirectResult(auth);
    
    if (result) {
      console.log("Google sign-in redirect successful:", {
        email: result.user.email,
        displayName: result.user.displayName,
        uid: result.user.uid
      });
      
      // Save to localStorage for persistence and sync with backend
      try {
        localStorage.setItem('authUser', JSON.stringify({
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName
        }));
        
        // Sync with our backend
        await syncUserWithBackend(result.user);
      } catch (err) {
        console.warn("Could not sync user with backend after redirect:", err);
      }
      
      // User successfully authenticated
      return result;
    } else {
      console.log("No redirect result found");
      
      // Check current auth state
      const currentUser = auth.currentUser;
      if (currentUser) {
        console.log("User is already signed in with Firebase:", {
          email: currentUser.email,
          displayName: currentUser.displayName,
          uid: currentUser.uid
        });
        
        // Make sure we save to localStorage for persistence and sync with backend
        try {
          localStorage.setItem('authUser', JSON.stringify({
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName
          }));
          
          // Sync with our backend
          await syncUserWithBackend(currentUser);
        } catch (err) {
          console.warn("Could not save user to localStorage or sync with backend:", err);
        }
        
        // Construct a result-like object for consistency
        return {
          user: currentUser,
          // Add minimal properties to mimic the redirect result
          operationType: "signIn",
          providerId: "google.com"
        };
      } else if (awaitingRedirect) {
        // We were expecting a redirect result but didn't get one and no user is signed in
        console.warn("Expected a redirect result but none found and no user is signed in");
        
        // Check for saved token/info in localStorage
        try {
          const savedAuth = localStorage.getItem('authUser');
          if (savedAuth) {
            console.log("Found saved auth data in localStorage, will try to use it");
            const parsedAuth = JSON.parse(savedAuth);
            if (parsedAuth && parsedAuth.email) {
              console.log("Using saved auth data for user:", parsedAuth.email);
              return {
                user: {
                  uid: parsedAuth.uid,
                  email: parsedAuth.email,
                  displayName: parsedAuth.displayName
                },
                operationType: "signIn",
                providerId: "google.com"
              };
            }
          }
        } catch (err) {
          console.warn("Error checking localStorage for saved auth:", err);
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Error handling redirect result:", error);
    // Log specific details for common Firebase errors
    if (error && typeof error === 'object' && 'code' in error) {
      const firebaseError = error as { code: string };
      if (firebaseError.code === 'auth/invalid-credential') {
        console.error("Invalid credential error - check Firebase console authorized domains");
      } else if (firebaseError.code === 'auth/operation-not-allowed') {
        console.error("Google sign-in may not be enabled in the Firebase console");
      } else if (firebaseError.code === 'auth/unauthorized-domain') {
        console.error("Domain not authorized - add this domain to Firebase console");
        console.error("Current hostname:", window.location.hostname);
      }
    }
    
    // Clear the redirect flag if there was an error
    localStorage.removeItem('awaitingGoogleRedirect');
    
    throw error;
  }
};

// Function to sync Firebase user with our backend
export const syncUserWithBackend = async (firebaseUser: any) => {
  if (!firebaseUser || !firebaseUser.email) {
    console.error("Cannot sync with backend: Invalid user data");
    return null;
  }
  
  try {
    console.log(`Syncing user ${firebaseUser.email} with backend...`);
    
    const response = await fetch('/api/auth/google-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || firebaseUser.email.split('@')[0],
        googleId: firebaseUser.uid,
        photoURL: firebaseUser.photoURL || null
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend sync failed (${response.status}):`, errorText);
      return null;
    }
    
    const data = await response.json();
    console.log("Backend sync successful:", data);
    
    // Save the backend user data to localStorage for app use
    if (data.success && data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Set a flag to indicate successful Google login for navigation handling
      localStorage.setItem('googleLoginSuccess', 'true');
      
      // Force a page reload after successful Google login to ensure everything is in sync
      // This helps when the redirect flow doesn't automatically navigate
      if (localStorage.getItem('awaitingGoogleRedirect') === 'true') {
        console.log("Force redirecting to dashboard after Google login");
        localStorage.removeItem('awaitingGoogleRedirect');
        window.location.href = '/dashboard';
      }
      
      return data.user;
    }
    
    return null;
  } catch (error) {
    console.error("Error syncing with backend:", error);
    return null;
  }
};

// Complete Firebase termination function to prevent authentication loops
export const terminateFirebaseCompletely = async () => {
  try {
    console.log('Terminating Firebase completely to prevent authentication loops');
    
    // First sign out if there's a current user
    if (auth?.currentUser) {
      console.log('Signing out current Firebase user');
      await signOut(auth);
    }
    
    // Delete all Firebase apps to completely reset the instance
    const apps = getApps();
    if (apps.length > 0) {
      console.log(`Deleting ${apps.length} Firebase app(s)`);
      await Promise.all(apps.map(app => deleteApp(app)));
    }
    
    // Clear all Firebase-related localStorage items
    const firebaseKeys = [
      'firebase:authUser',
      'firebase:host',
      'firebase:heartbeat',
      'awaitingGoogleRedirect',
      'googleLoginSuccess',
      'authUser',
      'firebase_disabled'
    ];
    
    firebaseKeys.forEach(key => {
      localStorage.removeItem(key);
      // Also check for keys with Firebase project ID prefix
      Object.keys(localStorage).forEach(storageKey => {
        if (storageKey.includes('firebase') || storageKey.includes('Firebase')) {
          localStorage.removeItem(storageKey);
        }
      });
    });
    
    console.log('Firebase completely terminated and cleaned up');
    return true;
  } catch (error) {
    console.error('Error terminating Firebase:', error);
    return false;
  }
};

// Enhanced sign out function with complete cleanup
export const signOutUser = async () => {
  try {
    console.log('Signing out user and cleaning up Firebase state');
    
    // Check if Firebase is disabled
    if (localStorage.getItem('firebase_disabled') === 'true') {
      console.log('Firebase is disabled, performing complete termination');
      await terminateFirebaseCompletely();
      return;
    }
    
    // Normal sign out
    if (auth?.currentUser) {
      await signOut(auth);
    }
    
    // Clear localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('authUser');
    localStorage.removeItem('awaitingGoogleRedirect');
    localStorage.removeItem('googleLoginSuccess');
    
    console.log('User signed out successfully');
  } catch (error) {
    console.error('Error signing out:', error);
    // If normal signout fails, force complete termination
    await terminateFirebaseCompletely();
  }
};

// Export auth for use in other components
export { auth };