// Global request interceptor to prevent endless authentication loops
let isAuthenticationBlocked = false;
let authBlockedUntil = 0;

// Track 429 responses to prevent further requests
export const checkAuthenticationBlock = () => {
  const now = Date.now();
  if (isAuthenticationBlocked && now < authBlockedUntil) {
    return true;
  }
  if (isAuthenticationBlocked && now >= authBlockedUntil) {
    // Reset block if time has passed
    isAuthenticationBlocked = false;
    authBlockedUntil = 0;
  }
  return false;
};

// Set authentication block
export const setAuthenticationBlock = (durationMs: number = 60000) => {
  isAuthenticationBlocked = true;
  authBlockedUntil = Date.now() + durationMs;
  console.log('Authentication blocked until:', new Date(authBlockedUntil));
};

// Clear authentication block
export const clearAuthenticationBlock = () => {
  isAuthenticationBlocked = false;
  authBlockedUntil = 0;
  console.log('Authentication block cleared');
};

// Intercept fetch requests to block authentication attempts
const originalFetch = window.fetch;
window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  
  // Block authentication requests if we're in a blocked state
  if (checkAuthenticationBlock() && url.includes('/auth/google-login')) {
    console.log('Blocking authentication request due to rate limiting');
    return Promise.reject(new Error('Authentication blocked due to rate limiting'));
  }
  
  return originalFetch.call(this, input, init).then(response => {
    // If we get a 429 on auth endpoint, immediately block further requests
    if (response.status === 429 && url.includes('/auth/google-login')) {
      console.log('Received 429, blocking all authentication requests');
      setAuthenticationBlock(60000); // Block for 1 minute
    }
    return response;
  });
};

console.log('Request interceptor initialized to prevent authentication loops');