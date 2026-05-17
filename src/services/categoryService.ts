import { apiCall } from '../api/client';

export interface Category {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export const categoryService = {
  // Get all categories
  getAllCategories: async (): Promise<Category[]> => {
    return apiCall('/api/categories/', 'GET');
  },

  // Get single category by ID
  getCategory: async (id: number): Promise<Category> => {
    return apiCall(`/api/categories/${id}/`, 'GET');
  },

  // Create new category
  createCategory: async (data: FormData): Promise<Category> => {
    // data should be a FormData object with file(s) from device
    return apiCall('/api/categories/', 'POST', data);
  },

  // Update category
  updateCategory: async (id: number, data: FormData): Promise<Category> => {
    // data should be a FormData object with file(s) from device
    return apiCall(`/categories/${id}/`, 'PUT', data);
  },

  // Partial update category
  patchCategory: async (id: number, data: Partial<Category>): Promise<Category> => {
    return apiCall(`/categories/${id}/`, 'PATCH', data);
  },

  // Delete category
  deleteCategory: async (id: number): Promise<void> => {
    return apiCall(`/categories/${id}/`, 'DELETE');
  },
};
