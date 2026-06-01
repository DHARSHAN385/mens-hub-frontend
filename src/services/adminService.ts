// Admin API Service
// Handles admin product and category management with database persistence

import { apiCall } from '../api/client';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'https://mens-hub-backend.onrender.com';

// In-memory cache for products and categories
let productsCache: any[] | null = null;
let categoriesCache: any[] | null = null;
let bannerCache: string | null = null;
let lastFetchTime: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Clear all in-memory caches
 */
export const clearCache = () => {
  productsCache = null;
  categoriesCache = null;
  bannerCache = null;
  console.log('🧹 Cache cleared');
};

/**
 * Convert relative image URLs to absolute URLs for backend media files
 * @param {string} imageUrl - The image URL from the API
 * @returns {string} Absolute URL or original URL if it's already absolute
 */
const processImageUrl = (imageUrl?: string): string => {
  if (!imageUrl) return '';
  
  let result = imageUrl;
  // If it's a relative URL (starts with /), prepend backend URL
  if (imageUrl.startsWith('/')) {
    if (imageUrl.startsWith('/media/')) {
      result = `https://menshub64.in${imageUrl}`;
    } else {
      result = `${BACKEND_URL}${imageUrl}`;
    }
  }
  
  // Replace spaces with %20 so browsers can load them correctly without URL formatting errors
  return result.replace(/ /g, '%20');
};

/**
 * Upload image to backend and get URL
 * @param {File} file - Image file to upload
 * @returns {Promise<string>} Image URL
 */
export const uploadImage = async (file: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch('https://menshub64.in/media/upload.php?secret=Dharshan_MensHub_Secret_2026', {
      method: 'POST',
      headers: {
        'X-Upload-Secret': 'Dharshan_MensHub_Secret_2026',
      },
      body: formData,
    });

    if (!response.ok) {
      let error = {};
      try { error = await response.json(); } catch {}
      alert(error['error'] || 'Failed to upload image directly to Hostinger permanent storage.');
      throw new Error(error['error'] || 'Failed to upload image');
    }

    const data = await response.json();
    console.log('✅ Image uploaded successfully to Hostinger:', data.image_url);
    clearCache(); // Invalidate cache after upload/change
    return processImageUrl(data.image_url);
  } catch (error: any) {
    console.error('❌ Error uploading image:', error);
    throw error;
  }
};

export interface AdminProduct {
  id?: number;
  name: string;
  description: string;
  price: number;
  category: string; // 'shirt', 'pants', 'jacket', 'shoes', 'accessories', 'tshirt', 'jeans', 'slides', 'sunglass'
  image_url?: string;
  stock?: number;
  sizes?: string[];
  popularity?: number;
  featured?: boolean;
}

export interface AdminCategory {
  id?: number;
  name: string;
  img?: string;
}

/**
 * Save product to database (create or update)
 * Transforms frontend format to backend format
 * ⚡ PERMANENT DATABASE STORAGE
 */
/**
 * Save product to database (create or update)
 * Transforms frontend format to backend format
 * ⚡ PERMANENT DATABASE STORAGE
 */
export const saveProduct = async (product: any): Promise<any> => {
  try {
    // Require authentication
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      alert('You must be logged in as admin to save products. Redirecting to login...');
      window.location.href = '/admin-login';
      throw new Error('Not authenticated');
    }

    let image = product.images?.[0] || product.image_url || '';
    // Don't send base64 images (too large), only send URLs
    if (image && image.startsWith('data:image/')) {
      console.warn('⚠ Skipping base64 image (too large), saving without image');
      image = '';
    }
    const backendProduct: AdminProduct & { images?: string[] } = {
      name: product.name,
      description: product.description || product.name, 
      price: Number(product.price),
      category: product.category,
      image_url: image, 
      stock: 100, 
      sizes: product.sizes || [],
      popularity: product.popularity || 0,
      featured: product.featured || false,
      images: Array.isArray(product.images) ? product.images.filter((img: string) => img && !img.startsWith('data:image/')) : []
    };

    // Update existing product (only if ID is numeric)
    if (product.id && typeof product.id === 'number') {
      backendProduct.id = product.id;
      try {
        const response = await apiCall(`/api/products/${product.id}/`, 'PUT', backendProduct);
        console.log('✅ Product PERMANENTLY updated in DB:', response);
        clearCache();
        if (response && typeof response === 'object' && response.id && response.name) {
          return {
            ...response,
            image_url: processImageUrl(response.image_url),
            images: Array.isArray(response.images) ? response.images.map(processImageUrl) : [processImageUrl(response.image_url)]
          };
        } else {
          console.warn('⚠️ Backend returned invalid/empty product object, falling back to previous:', response);
          return { ...backendProduct, id: product.id };
        }
      } catch (error: any) {
        console.error('❌ Failed to update product in database:', error);
        throw new Error(`Failed to update product: ${error.message}`);
      }
    } else {
      try {
        const response = await apiCall('/api/products/', 'POST', backendProduct);
        console.log('✅ Product PERMANENTLY created in DB:', response);
        clearCache();
        if (response && typeof response === 'object' && response.id && response.name) {
          return {
            ...response,
            image_url: processImageUrl(response.image_url),
            images: Array.isArray(response.images) ? response.images.map(processImageUrl) : [processImageUrl(response.image_url)]
          };
        } else {
          console.warn('⚠️ Backend returned invalid/empty product object, falling back to previous:', response);
          return backendProduct;
        }
      } catch (error: any) {
        console.error('❌ Failed to create product in database:', error);
        throw new Error(`Failed to create product: ${error.message}`);
      }
    }
  } catch (error) {
    console.error('Error saving product:', error);
    throw error;
  }
};

/**
 * Delete product from database
 * ⚡ PERMANENT DELETION
 */
export const deleteProductFromDB = async (id: any): Promise<void> => {
  try {
    // Only delete if ID is numeric (from database)
    if (typeof id === 'number') {
      await apiCall(`/api/products/${id}/`, 'DELETE');
      console.log('✅ Product PERMANENTLY deleted from DB:', id);
      clearCache();
    } else {
      console.warn(`⚠ Cannot delete product with ID ${id} - not a database ID`);
    }
  } catch (error) {
    console.error('❌ Error deleting product:', error);
    throw error;
  }
};

/**
 * Save category to database (create or update)
 * ⚡ PERMANENT DATABASE STORAGE
 */
export const saveCategory = async (category: any): Promise<any> => {
  try {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      alert('You must be logged in as admin to save categories. Redirecting to login...');
      window.location.href = '/admin-login';
      throw new Error('Not authenticated');
    }

    let image = category.img || '';
    if (image && image.startsWith('data:image/')) {
      console.warn('⚠ Skipping base64 image (too large), saving without image');
      image = '';
    }
    const backendCategory: AdminCategory = {
      name: category.name,
      img: image, // Only URL, no base64
    };

    // Update existing category (only if ID is numeric)
    if (category.id && typeof category.id === 'number') {
      backendCategory.id = category.id;
      try {
        const response = await apiCall(`/api/categories/${category.id}/`, 'PUT', backendCategory);
        console.log('✅ Category PERMANENTLY updated in DB:', response);
        clearCache();
        return response ? { ...response, img: processImageUrl(response.img) } : { ...backendCategory, id: category.id };
      } catch (error: any) {
        console.error('❌ Failed to update category in database:', error);
        throw new Error(`Failed to update category: ${error.message}`);
      }
    }
    // Create new category (ID will be assigned by backend)
    else {
      try {
        const response = await apiCall('/api/categories/', 'POST', backendCategory);
        console.log('✅ Category PERMANENTLY created in DB:', response);
        clearCache();
        return response ? { ...response, img: processImageUrl(response.img) } : backendCategory;
      } catch (error: any) {
        console.error('❌ Failed to create category in database:', error);
        throw new Error(`Failed to create category: ${error.message}`);
      }
    }
  } catch (error) {
    console.error('Error saving category:', error);
    throw error;
  }
};

/**
 * Delete category from database
 * ⚡ PERMANENT DELETION
 */
export const deleteCategoryFromDB = async (id: any): Promise<void> => {
  try {
    // Only delete if ID is numeric (from database)
    if (typeof id === 'number') {
      await apiCall(`/api/categories/${id}/`, 'DELETE');
      console.log('✅ Category PERMANENTLY deleted from DB:', id);
      clearCache();
    } else {
      console.warn(`⚠ Cannot delete category with ID ${id} - not a database ID`);
    }
  } catch (error) {
    console.error('❌ Error deleting category:', error);
    throw error;
  }
};

/**
 * Load all products from database
 * ⚡ ALWAYS loads FRESH data from DATABASE
 */

export const loadProductsFromDB = async (forceRefresh = false): Promise<any[]> => {
  try {
    const now = Date.now();
    if (!forceRefresh && productsCache && (now - lastFetchTime < CACHE_TTL)) {
      console.log('⚡ Serving products from cache');
      return productsCache;
    }
    console.log('📦 Loading products from database...');
    const products = await apiCall('/api/products/', 'GET');
    if (!products) {
      console.warn('⚠ API returned null for products');
      return [];
    }
    // Handle response that might be paginated
    const data = products.results || products;
    if (!Array.isArray(data)) {
      console.warn('⚠ API returned non-array response:', products);
      return [];
    }
    // Transform backend format to frontend format if needed
    const transformed = data.map((p: any) => ({
      ...p,
      image_url: processImageUrl(p.image_url),
      images: Array.isArray(p.images) ? p.images.map(processImageUrl) : [processImageUrl(p.image_url)]
    }));
    console.log(`✅ Successfully loaded ${transformed.length} products from DATABASE`);
    productsCache = transformed;
    lastFetchTime = now;
    return transformed;
  } catch (error) {
    console.error('❌ Error loading products:', error);
    return [];
  }
};

/**
 * Load all categories from database
 * ⚡ ALWAYS loads FRESH data from DATABASE
 */
// Duplicate removed
export const loadCategoriesFromDB = async (forceRefresh = false): Promise<any[]> => {
  try {
    if (!forceRefresh && categoriesCache) {
      return categoriesCache;
    }
    console.log('📂 Loading categories from database...');
    const categories = await apiCall('/api/categories/', 'GET');
    // Handle null response (server issue)
    if (!categories) {
      console.warn('⚠ API returned null for categories');
      return [];
    }
    // Handle response that might be paginated
    const data = categories.results || categories;
    if (!Array.isArray(data)) {
      console.warn('⚠ API returned non-array response:', categories);
      return [];
    }
    // Transform backend format to frontend format
    const transformed = data.map((c: any) => ({
      id: c.id,
      name: c.name,
      img: processImageUrl(c.img || ''),
    }));
    console.log(`✅ Successfully loaded ${transformed.length} categories from DATABASE`);
    categoriesCache = transformed;
    return transformed;
  } catch (error) {
    console.error('❌ Failed to load categories:', error);
    return [];
  }
};

/**
 * Save banner image URL to settings
 * ⚡ PERMANENT DATABASE STORAGE
 */
export const saveBannerToSettings = async (bannerUrl: string): Promise<string> => {
  try {
    console.log('🖼️ Saving banner to database...');
    const response = await apiCall('/api/settings/banner/', 'POST', { banner_url: bannerUrl });
    console.log('✅ Banner PERMANENTLY saved to DB:', response);
    clearCache();
    return response?.banner_url || bannerUrl;
  } catch (error: any) {
    console.error('❌ Failed to save banner:', error);
    throw error;
  }
};

/**
 * Load banner image URL from settings
 * ⚡ ALWAYS loads FRESH data from DATABASE
 */
export const loadBannerFromSettings = async (forceRefresh = false): Promise<string> => {
  try {
    if (!forceRefresh && bannerCache) {
      return bannerCache;
    }
    console.log('🖼️ Loading banner from database...');
    const response = await apiCall('/api/settings/banner/', 'GET');
    const bannerUrl = response?.banner_url || '';
    const processedBannerUrl = processImageUrl(bannerUrl);
    bannerCache = processedBannerUrl;
    return processedBannerUrl;
  } catch (error: any) {
    console.error('⚠️ Failed to load banner (will use empty):', error);
    return '';
  }
};

/**
 * Load all order notifications from database
 */
export const loadNotificationsFromDB = async (): Promise<any[]> => {
  try {
    const notifications = await apiCall('/api/admin/notifications/', 'GET');
    return Array.isArray(notifications) ? notifications : [];
  } catch (error) {
    console.error('❌ Failed to load notifications:', error);
    return [];
  }
};

/**
 * Mark a single notification as read
 */
export const markNotificationAsRead = async (id: string): Promise<void> => {
  try {
    await apiCall(`/api/admin/notifications/${id}/read/`, 'POST');
  } catch (error) {
    console.error(`❌ Failed to mark notification ${id} as read:`, error);
    throw error;
  }
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (): Promise<void> => {
  try {
    await apiCall('/api/admin/notifications/mark_all_read/', 'POST');
  } catch (error) {
    console.error('❌ Failed to mark all notifications as read:', error);
    throw error;
  }
};

export default {
  saveProduct,
  deleteProductFromDB,
  saveCategory,
  deleteCategoryFromDB,
  loadProductsFromDB,
  loadCategoriesFromDB,
  saveBannerToSettings,
  loadBannerFromSettings,
  loadNotificationsFromDB,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearCache,
  uploadImage,
};
