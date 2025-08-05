/**
 * Authentication configuration and environment detection utilities
 */

// Helper function to detect the current environment
export const detectEnvironment = () => {
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const isReplitDev = hostname.includes('.replit.dev');
  const isReplitApp = hostname.includes('.replit.app');
  const isInIframe = window !== window.parent;
  const protocol = window.location.protocol;
  const port = window.location.port;
  
  return {
    isLocalhost,
    isReplitDev,
    isReplitApp,
    isInIframe,
    isReplit: isReplitDev || isReplitApp,
    hostname,
    protocol,
    port,
    isSecure: protocol === 'https:'
  };
};

// Get Firebase configuration with environment-specific adjustments
export const getFirebaseConfig = () => {
  const env = detectEnvironment();
  
  // Firebase config
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    // Always use the Firebase project's default domain for authDomain
    // This is important for redirects to work properly in all environments
    authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    // Add environment info for debugging
    _environment: env
  };
  
  return config;
};

// Get the appropriate auth strategy based on environment
export const getAuthStrategy = () => {
  const env = detectEnvironment();
  
  // In Replit iframe environments, we need special handling
  if (env.isInIframe) {
    return 'redirect_workaround'; 
  }
  
  // For regular environments (non-iframe), use popup
  return 'popup';
};

// Utility function to log auth diagnostics (helps with debugging)
export const logAuthDiagnostics = () => {
  const env = detectEnvironment();
  const config = getFirebaseConfig();
  
  console.log('Auth Environment:', {
    ...env,
    firebaseConfigExists: {
      apiKey: !!import.meta.env.VITE_FIREBASE_API_KEY,
      projectId: !!import.meta.env.VITE_FIREBASE_PROJECT_ID,
      appId: !!import.meta.env.VITE_FIREBASE_APP_ID
    },
    authStrategy: getAuthStrategy(),
    currentUrl: window.location.href
  });
  
  return {
    environment: env,
    authStrategy: getAuthStrategy(),
    hasFirebaseConfig: !!(
      import.meta.env.VITE_FIREBASE_API_KEY && 
      import.meta.env.VITE_FIREBASE_PROJECT_ID && 
      import.meta.env.VITE_FIREBASE_APP_ID
    )
  };
};