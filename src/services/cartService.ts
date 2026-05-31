import { apiCall } from '../api/client';

const API_URL = import.meta.env.VITE_API_URL || 'https://mens-hub-backend.onrender.com/api';

export interface CartItem {
  product: {
    id: string;
    name: string;
    price: number;
    image_url?: string;
  };
  size: string;
  qty: number;
}

export interface Cart {
  id: number;
  items_data: CartItem[];
  created_at: string;
  updated_at: string;
}

// Get token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// API call with authentication
const authApiCall = async (endpoint: string, method = 'GET', data: any = null) => {
  const token = getAuthToken();
  const url = `${API_URL}${endpoint}`;
  
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token && { 'Authorization': `Token ${token}` }),
    },
  };

  if (method !== 'GET' && method !== 'DELETE' && data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `API Error: ${response.status}`);
  }

  return response.json();
};

export const cartService = {
  // Get current user's cart
  getCart: async (): Promise<Cart> => {
    return authApiCall('/cart/current/', 'GET');
  },

  // Update cart with new items
  updateCart: async (items: CartItem[]): Promise<Cart> => {
    return authApiCall('/cart/update_items/', 'POST', { items_data: items });
  },

  // Clear entire cart
  clearCart: async (): Promise<Cart> => {
    return authApiCall('/cart/clear/', 'POST');
  },
};
