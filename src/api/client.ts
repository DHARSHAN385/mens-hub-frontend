// API configuration and base client setup
// This file handles all communication with the Django backend

// Base URL for all API requests
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    return 'http://localhost:8000';
  }

  const configuredUrl = import.meta.env.VITE_API_URL;
  if (configuredUrl && configuredUrl.trim()) {
    return configuredUrl.replace(/\/$/, '').replace(/\/api$/, '');
  }

  return 'https://api.menshub64.in';
};

const API_BASE_URL = getApiBaseUrl();

// Get authentication token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Default headers for all API requests
const getHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // Add authentication token if available
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }

  return headers;
};

/**
 * Make API requests to the backend
 * @param {string} endpoint - API endpoint (e.g., '/products/')
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
 * @param {object} data - Request body data (for POST/PUT)
 * @returns {Promise} Response from API
 */
export const apiCall = async (endpoint: string, method = 'GET', data: any = null) => {
  const apiEndpoint = endpoint.startsWith('/api/') ? endpoint : `/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const url = `${API_BASE_URL}${apiEndpoint}`;

  // ⏱ Abort after 15 seconds to prevent infinite loading
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  
  const options: RequestInit = {
    method,
    headers: getHeaders(),
    signal: controller.signal,
  };

  // Add body for POST and PUT requests
  if (method !== 'GET' && method !== 'DELETE' && data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    clearTimeout(timeoutId);

    // Handle errors
    if (!response.ok) {
      if (response.status === 401) {
        console.warn('🔑 Auth token invalid or expired. Clearing session...');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('userEmail');
        window.dispatchEvent(new CustomEvent('auth:invalid'));
        // We don't reload here to avoid infinite loops, but the next calls will succeed as Guest
      }
      
      let errorMessage = `API Error: ${response.status}`;
      let fullError: any = {};
      try {
        const errorData = await response.json();
        fullError = errorData;
        // Try multiple error formats
        if (errorData.detail) errorMessage = errorData.detail;
        else if (errorData.error) errorMessage = errorData.error;
        else if (typeof errorData === 'object') {
          // Handle field errors (Django REST Framework format)
          const fieldErrors = Object.entries(errorData).filter(([key]) => key !== 'detail' && key !== 'error');
          if (fieldErrors.length > 0) {
            errorMessage = fieldErrors.map(([field, msgs]: any) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`).join(' | ');
          }
        }
      } catch {
        // If we can't parse error response, use status code
      }
      console.error(`❌ [${method} ${apiEndpoint}] ${errorMessage}`, fullError);
      throw new Error(errorMessage);
    }

    // Check if response has content
    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');
    
    // For DELETE requests, no content is expected
    if (method === 'DELETE') {
      console.log(`✓ [${method} ${apiEndpoint}] Deleted successfully`);
      return { success: true };
    }

    // Get response text first
    const responseText = await response.text();
    
    if (!responseText) {
      console.warn(`⚠ [${method} ${apiEndpoint}] Empty response body`);
      return null;
    }

    // Parse and return JSON
    try {
      const parsed = JSON.parse(responseText);
      console.log(`✓ [${method} ${apiEndpoint}] Success`, parsed);
      return parsed;
    } catch (parseError) {
      console.error(`❌ [${method} ${apiEndpoint}] Failed to parse JSON:`, responseText.substring(0, 200));
      throw new Error('Invalid JSON response from API');
    }
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error?.name === 'AbortError') {
      console.error(`⏱ [${method} ${apiEndpoint}] Request timed out after 15 seconds`);
      throw new Error('Request timed out. Server may be starting up — please try again in a moment.');
    }
    console.error(`API Error [${method} ${apiEndpoint}]:`, error);
    throw error;
  }
};

/**
 * Handle API response with proper error management
 * @param {Promise} promise - API call promise
 * @returns {Promise} Resolved data or error
 */
export const handleApiResponse = async (promise: Promise<any>) => {
  try {
    return await promise;
  } catch (error: any) {
    console.error('Error:', error.message);
    throw error;
  }
};

export default apiCall;
