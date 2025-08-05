import { getApiUrl } from './api';

/**
 * Helper function to make API requests
 * @param url The API endpoint URL
 * @param options Request options
 * @returns Response from the API
 */
export async function apiRequest(
  url: string,
  options?: RequestInit,
): Promise<Response> {
  // Make sure we're using the full API URL with the host
  // If the URL already has the protocol/host, use it as is
  const fullUrl = url.startsWith('http') ? url : getApiUrl(url.replace(/^\/api\//, ''));
  
  console.log(`API Request to: ${fullUrl}`);
  
  const res = await fetch(fullUrl, {
    ...options,
    credentials: "include",
  });

  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
  
  return res;
}