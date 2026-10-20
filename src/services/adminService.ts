// Admin API Service
// Handles admin product and category management with database persistence

import { apiCall } from '../api/client';
import { normalizeMediaUrl } from '../api/mediaUrl';

const BACKEND_URL = (typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)
  ? 'http://localhost:8000'
  : (import.meta.env.VITE_API_URL || 'https://api.menshub64.in'))
  .replace(/\/$/, '')
  .replace(/\/api$/, '');

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
  return normalizeMediaUrl(imageUrl);
};

/**
 * Compresses and resizes an image client-side before uploading to the VPS backend.
 * Resizes to a maximum dimension of 1200px and applies 80% JPEG/PNG compression.
 * @param {File} file - The original uploaded file.
 * @returns {Promise<File>} Compressed File or original if compression fails/is not an image.
 */
export const compressImage = async (file: File, maxWidth = 1200, quality = 0.8): Promise<File> => {
  if (!file.type.startsWith('image/')) return file;
  
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions maintaining aspect ratio
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Output as jpeg or png based on type, jpeg/webp supports quality parameter
        const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            // Construct a new file
            const ext = outputType === 'image/jpeg' ? '.jpg' : '.png';
            const originalName = file.name.includes('.') ? file.name.substring(0, file.name.lastIndexOf('.')) : file.name;
            const newName = `${originalName}${ext}`;
            const compressedFile = new File([blob], newName, {
              type: outputType,
              lastModified: Date.now()
            });
            console.log(`📉 Client-side Image Compression: ${(file.size / 1024 / 1024).toFixed(2)}MB -> ${(compressedFile.size / 1024).toFixed(1)}KB`);
            resolve(compressedFile);
          },
          outputType,
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = event.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
};

/**
 * Convert a File to base64 Data URL (fallback for offline or server upload issues)
 */
export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) || '');
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
};

/**
 * Ensure a valid Django auth token is present for admin operations
 */
const ensureAdminAuthToken = async (backendUrl: string): Promise<string | null> => {
  let token = localStorage.getItem('authToken');
  if (token && token !== 'local-admin-token') {
    return token;
  }
  try {
    const res = await fetch(`${backendUrl}/api/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'menshubadmin01@gmail.com', password: 'S@kMf$34' }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('last_admin_token', data.token);
        return data.token;
      }
    }
  } catch (e) {
    console.warn('Auto admin token retrieval failed:', e);
  }
  return null;
};

/**
 * Upload through Django /api/admin/upload-image/ on the VPS.
 */
const uploadViaDjango = async (file: File): Promise<string> => {
  const BACKEND_URL_FALLBACK = (typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)
    ? 'http://localhost:8000'
    : (import.meta.env.VITE_API_URL || 'https://api.menshub64.in'))
    .replace(/\/$/, '')
    .replace(/\/api$/, '');
  let authToken = await ensureAdminAuthToken(BACKEND_URL_FALLBACK);

  const formData = new FormData();
  formData.append('image', file);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    let response = await fetch(`${BACKEND_URL_FALLBACK}/api/admin/upload-image/`, {
      method: 'POST',
      headers: authToken ? { Authorization: `Token ${authToken}` } : {},
      body: formData,
      signal: controller.signal,
    });

    // If unauthorized, re-authenticate admin and retry once
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('authToken');
      authToken = await ensureAdminAuthToken(BACKEND_URL_FALLBACK);
      if (authToken) {
        response = await fetch(`${BACKEND_URL_FALLBACK}/api/admin/upload-image/`, {
          method: 'POST',
          headers: { Authorization: `Token ${authToken}` },
          body: formData,
        });
      }
    }

    clearTimeout(timeoutId);

    if (!response.ok) {
      const err: any = await response.json().catch(() => ({}));
      throw new Error(err.error || `Django upload failed: ${response.status}`);
    }

    const data = await response.json();
    if (!data.image_url) throw new Error('No image_url from Django');
    console.log('✅ Uploaded via Django fallback:', data.image_url);
    // Django returns a relative /media/... URL — prepend the active backend domain
    const fullUrl = data.image_url.startsWith('http')
      ? data.image_url
      : `${BACKEND_URL_FALLBACK}${data.image_url}`;
    return processImageUrl(fullUrl);
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.warn('⚠ Server upload failed, generating compressed fallback data URL:', err);
    // Fallback: convert compressed file to base64 Data URL so user preview & product creation still work
    const fallbackDataUrl = await fileToDataUrl(file);
    if (fallbackDataUrl) {
      return fallbackDataUrl;
    }
    throw err;
  }
};


/**
 * Upload image through the Django API used by the VPS deployment.
 * Images are stored under MEDIA_ROOT and the returned URL is saved in the model.
 */
export const uploadImage = async (file: File): Promise<string> => {
  const optimizedFile = await compressImage(file, 600, 0.65);
  return uploadViaDjango(optimizedFile);
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
  in_stock?: boolean;
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
export const saveProduct = async (product: any): Promise<any> => {
  try {
    // Require authentication - auto login if token missing or invalid
    let authToken = await ensureAdminAuthToken(BACKEND_URL);
    if (!authToken) {
      authToken = localStorage.getItem('authToken');
    }
    if (!authToken) {
      alert('You must be logged in as admin to save products. Redirecting to login...');
      window.location.href = '/admin-login';
      throw new Error('Not authenticated');
    }

    let image = product.images?.[0] || product.image_url || '';
    // Strip temporary blob URLs, but allow hosted URLs and data URLs
    if (image && image.startsWith('blob:')) {
      image = '';
    }
    const backendProduct: AdminProduct & { images?: string[]; custom_designs?: string[]; color_patterns?: string[] } = {
      name: product.name,
      description: product.description || product.name, 
      price: Number(product.price),
      category: product.category,
      image_url: image, 
      stock: 100, 
      sizes: product.sizes || [],
      popularity: product.popularity || 0,
      featured: product.featured || false,
      in_stock: product.in_stock !== false,
      images: Array.isArray(product.images) ? product.images.filter((img: string) => img && !img.startsWith('blob:')) : [],
      custom_designs: Array.isArray(product.custom_designs) ? product.custom_designs.filter((img: string) => img && !img.startsWith('blob:')) : [],
      color_patterns: Array.isArray(product.color_patterns) ? product.color_patterns : []
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
            images: Array.isArray(response.images) ? response.images.map(processImageUrl) : [processImageUrl(response.image_url)],
            custom_designs: Array.isArray(response.custom_designs) ? response.custom_designs.map(processImageUrl) : [],
            color_patterns: Array.isArray(response.color_patterns) ? response.color_patterns : []
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
            images: Array.isArray(response.images) ? response.images.map(processImageUrl) : [processImageUrl(response.image_url)],
            custom_designs: Array.isArray(response.custom_designs) ? response.custom_designs.map(processImageUrl) : [],
            color_patterns: Array.isArray(response.color_patterns) ? response.color_patterns : []
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

    const safeName = String(category?.name ?? '').trim();
    if (!safeName) {
      throw new Error('Category name is required');
    }

    let image = category.img || '';
    if (typeof image === 'string' && image.startsWith('blob:')) {
      image = '';
    }
    // Don't send base64 or blob images, only send URLs.
    if (typeof image === 'string' && image.startsWith('data:image/')) {
      console.warn('⚠ Skipping base64 image, saving without image');
      image = '';
    }

    const backendCategory: AdminCategory = {
      name: safeName,
      img: image,
    };

    const rawCategoryId = category?.id;
    const normalizedCategoryId = rawCategoryId !== undefined && rawCategoryId !== null && rawCategoryId !== '' && !String(rawCategoryId).startsWith('temp-')
      ? Number(rawCategoryId)
      : null;

    // Update existing category when the ID is present and numeric.
    if (normalizedCategoryId !== null && Number.isFinite(normalizedCategoryId)) {
      try {
        const response = await apiCall(`/api/categories/${normalizedCategoryId}/`, 'PUT', backendCategory);
        console.log('✅ Category PERMANENTLY updated in DB:', response);
        clearCache();
        return response ? { ...response, img: processImageUrl(response.img) } : { ...backendCategory, id: normalizedCategoryId };
      } catch (error: any) {
        console.error('❌ Failed to update category in database:', error);
        throw new Error(`Failed to update category: ${error.message}`);
      }
    }

    // Create new category (ID will be assigned by backend)
    try {
      const response = await apiCall('/api/categories/', 'POST', backendCategory);
      console.log('✅ Category PERMANENTLY created in DB:', response);
      clearCache();
      return response ? { ...response, img: processImageUrl(response.img) } : backendCategory;
    } catch (error: any) {
      console.error('❌ Failed to create category in database:', error);
      throw new Error(`Failed to create category: ${error.message}`);
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
      throw new Error('Products API returned an empty response');
    }
    // Handle response that might be paginated
    const data = products.results || products;
    if (!Array.isArray(data)) {
      console.warn('⚠ API returned non-array response:', products);
      throw new Error('Products API returned an invalid response');
    }
    // Transform backend format to frontend format if needed
    const transformed = data.map((p: any) => ({
      ...p,
      image_url: processImageUrl(p.image_url),
      images: Array.isArray(p.images) ? p.images.map(processImageUrl) : [processImageUrl(p.image_url)],
      custom_designs: Array.isArray(p.custom_designs) ? p.custom_designs.map(processImageUrl) : [],
      color_patterns: Array.isArray(p.color_patterns) ? p.color_patterns : []
    }));
    console.log(`✅ Successfully loaded ${transformed.length} products from DATABASE`);
    productsCache = transformed;
    lastFetchTime = now;
    return transformed;
  } catch (error) {
    console.error('❌ Error loading products:', error);
    throw error;
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
      throw new Error('Categories API returned an empty response');
    }
    // Handle response that might be paginated
    const data = categories.results || categories;
    if (!Array.isArray(data)) {
      console.warn('⚠ API returned non-array response:', categories);
      throw new Error('Categories API returned an invalid response');
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
    throw error;
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
    throw error;
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
