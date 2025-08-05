// API utility functions and constants

// Base URL for API calls - simplified for Replit
export const API_BASE_URL = `${window.location.protocol}//${window.location.host}`;

/**
 * Get the full URL for an API endpoint
 * @param endpoint - The API endpoint (without leading slash), optional
 * @returns The full URL for the API endpoint or base API URL if no endpoint provided
 */
export function getApiUrl(endpoint?: string): string {
  if (!endpoint) {
    return `${API_BASE_URL}/api`;
  }
  // Ensure endpoint starts without a slash
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  return `${API_BASE_URL}/api/${cleanEndpoint}`;
}

// Log API configuration for debugging
console.log('API Base URL:', API_BASE_URL);