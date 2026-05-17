// Address service for managing user addresses

const API_URL = import.meta.env.VITE_API_URL || 'https://dharshan.pythonanywhere.com/api';

export interface Address {
  id: number;
  full_name: string;
  phone: string;
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  address_type: 'home' | 'work' | 'other';
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAddressData {
  full_name: string;
  phone: string;
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  country?: string;
  address_type?: 'home' | 'work' | 'other';
  is_default?: boolean;
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

export const addressService = {
  // Get all addresses for current user
  getAddresses: async (): Promise<Address[]> => {
    return authApiCall('/addresses/', 'GET');
  },

  // Get default address
  getDefaultAddress: async (): Promise<Address> => {
    return authApiCall('/addresses/default/', 'GET');
  },

  // Create new address
  createAddress: async (data: CreateAddressData): Promise<Address> => {
    return authApiCall('/addresses/', 'POST', data);
  },

  // Update address
  updateAddress: async (id: number, data: Partial<CreateAddressData>): Promise<Address> => {
    return authApiCall(`/addresses/${id}/`, 'PATCH', data);
  },

  // Delete address
  deleteAddress: async (id: number): Promise<void> => {
    return authApiCall(`/addresses/${id}/`, 'DELETE');
  },

  // Set address as default
  setDefaultAddress: async (id: number): Promise<Address> => {
    return authApiCall(`/addresses/${id}/set_default/`, 'POST');
  },
};