import { apiCall } from '../api/client';

export interface Banner {
  id: number;
  title?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const bannerService = {
  // Get all banners
  getAllBanners: async (): Promise<Banner[]> => {
    return apiCall('/banners/', 'GET');
  },

  // Get active banners only
  getActiveBanners: async (): Promise<Banner[]> => {
    return apiCall('/banners/active/', 'GET');
  },

  // Get single banner by ID
  getBanner: async (id: number): Promise<Banner> => {
    return apiCall(`/banners/${id}/`, 'GET');
  },

  // Create new banner
  createBanner: async (data: FormData): Promise<Banner> => {
    // data should be a FormData object with file(s) from device
    return apiCall('/banners/', 'POST', data);
  },

  // Update banner
  updateBanner: async (id: number, data: FormData): Promise<Banner> => {
    // data should be a FormData object with file(s) from device
    return apiCall(`/banners/${id}/`, 'PUT', data);
  },

  // Partial update banner
  patchBanner: async (id: number, data: Partial<Banner>): Promise<Banner> => {
    return apiCall(`/banners/${id}/`, 'PATCH', data);
  },

  // Delete banner
  deleteBanner: async (id: number): Promise<void> => {
    return apiCall(`/banners/${id}/`, 'DELETE');
  },
};
