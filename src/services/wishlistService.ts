const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export interface Wishlist {
  id: number;
  product_ids: string[];
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

export const wishlistService = {
  // Get current user's wishlist
  getWishlist: async (): Promise<Wishlist> => {
    return authApiCall('/wishlist/current/', 'GET');
  },

  // Add product to wishlist
  addToWishlist: async (productId: string): Promise<Wishlist> => {
    return authApiCall('/wishlist/add_product/', 'POST', { product_id: productId });
  },

  // Remove product from wishlist
  removeFromWishlist: async (productId: string): Promise<Wishlist> => {
    return authApiCall('/wishlist/remove_product/', 'POST', { product_id: productId });
  },

  // Update entire wishlist
  updateWishlist: async (productIds: string[]): Promise<Wishlist> => {
    return authApiCall('/wishlist/update_items/', 'POST', { product_ids: productIds });
  },

  // Clear entire wishlist
  clearWishlist: async (): Promise<Wishlist> => {
    return authApiCall('/wishlist/clear/', 'POST');
  },
};
