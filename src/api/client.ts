/**
 * API client configuration
 * Handles base URL and request setup
 */

// API Base URL
// For Expo Go on physical device: Use your computer's IP address
// For Android Emulator: Use 'http://10.0.2.2:3001'
// For iOS Simulator: Use 'http://localhost:3001'
// TODO: Update this IP if your computer's IP changes
const API_BASE_URL = 'http://192.168.8.25:3001';

export interface ApiError {
  error: {
    message: string;
    statusCode: number;
  };
}

export const apiClient = {
  baseURL: API_BASE_URL,

  /**
   * Make a GET request
   */
  async get<T>(endpoint: string, token?: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error?.message || `Request failed: ${response.statusText}`);
    }

    return await response.json();
  },

  /**
   * Make a POST request
   */
  async post<T>(endpoint: string, data: unknown, token?: string): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log(`[apiClient.post] Making request to ${endpoint} with token`);
    } else {
      console.warn(`[apiClient.post] Making request to ${endpoint} without token`);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      let errorMessage = `Request failed: ${response.statusText}`;
      try {
        const error: ApiError = await response.json();
        errorMessage = error.error?.message || errorMessage;
        console.error(`[apiClient.post] Error from ${endpoint}:`, errorMessage, 'Status:', response.status);
      } catch {
        // If response is not JSON, use status text
        console.error(`[apiClient.post] Error from ${endpoint}:`, response.statusText, 'Status:', response.status);
      }
      throw new Error(errorMessage);
    }

    // Handle 204 No Content (empty response) - common for join/leave operations
    if (response.status === 204) {
      return undefined as T;
    }

    // Try to parse JSON, but handle empty responses gracefully
    const text = await response.text();
    if (!text) {
      return undefined as T;
    }

    return JSON.parse(text) as T;
  },

  /**
   * Make a PATCH request
   */
  async patch<T>(endpoint: string, data: unknown, token?: string): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error?.message || `Request failed: ${response.statusText}`);
    }

    return await response.json();
  },

  /**
   * Make a DELETE request
   */
  async delete<T>(endpoint: string, token?: string): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error?.message || `Request failed: ${response.statusText}`);
    }

    // DELETE requests might return 204 No Content, so handle empty responses
    if (response.status === 204 || response.status === 200) {
      const text = await response.text();
      return (text ? JSON.parse(text) : {}) as T;
    }

    return await response.json();
  },
};
