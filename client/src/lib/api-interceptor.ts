import { apiRequest as originalApiRequest } from './queryClient';

/**
 * Wrapper for the API request function that adds authentication headers
 */
export const apiRequest = async (url: string, options?: RequestInit): Promise<Response> => {
  // Get user from localStorage
  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : null;
  
  // Create headers with authentication information if user exists
  const headers = {
    ...(options?.headers || {}),
  } as Record<string, string>;
  
  // Add auth headers if user exists
  if (user) {
    headers['x-user-id'] = user.id.toString();
    headers['x-user-email'] = user.email;
    headers['x-user-role'] = user.role || 'user'; // Include role information for authorization
    
    console.log('Adding auth headers:', {
      id: user.id,
      email: user.email,
      role: user.role
    });
  }
  
  // Call the original API request with updated headers
  return originalApiRequest(url, {
    ...options,
    headers,
  });
};