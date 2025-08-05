import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

import { getApiUrl } from "./api";

// Re-export getApiUrl for convenience
export { getApiUrl };

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

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Convert the queryKey to a URL
    // If the first item is a string that starts with '/api', use it as path
    let url: string;
    if (typeof queryKey[0] === 'string' && queryKey[0].startsWith('/api')) {
      // Remove the leading /api/ to get the endpoint
      const endpoint = queryKey[0].replace(/^\/api\//, '');
      url = getApiUrl(endpoint);
      console.log(`Query request to: ${url}`);
    } else {
      // If it's not an API path, use it directly (shouldn't happen)
      url = queryKey[0] as string;
      console.log(`Direct query to: ${url}`);
    }
    
    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
