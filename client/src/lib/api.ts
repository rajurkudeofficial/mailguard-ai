export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    // Important for sending cookies with cross-origin requests
    credentials: 'include',
  };

  const response = await fetch(url, defaultOptions);

  if (!response.ok) {
    let errorMessage = 'An error occurred';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch {
      errorMessage = response.statusText;
    }
    
    // Custom error class or just throw
    if (response.status === 401) {
      // You could dispatch a global event here to handle logout if needed
      window.dispatchEvent(new Event('auth-unauthorized'));
    }
    
    throw new Error(errorMessage);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
