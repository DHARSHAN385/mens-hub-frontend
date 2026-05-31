// Product API Service
// Handles all product-related API calls to the backend

import { apiCall } from '../api/client';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'https://dharshan.pythonanywhere.com';

export interface Product {
  id?: number;
  name: string;
  description: string;
  price: number | string;
  category: 'shirt' | 'pants' | 'jacket' | 'shoes' | 'accessories' | 'tshirt' | 'jeans' | 'slides' | 'sunglass' | 'sarees';
  stock?: number;
  sizes?: string[];
  popularity?: number;
  featured?: boolean;
  image_url?: string;
  category_image?: string;
  banner_image?: string;
  created_at?: string;
  updated_at?: string;
}

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
    result = `${BACKEND_URL}${imageUrl}`;
  }
  
  // Replace spaces with %20 so browsers can load them correctly without URL formatting errors
  return result.replace(/ /g, '%20');
};

/**
 * Process a product's image URLs to ensure they're absolute URLs
 * @param {Product} product - The product object
 * @returns {Product} Product with processed image URLs
 */
const processProductImages = (product: Product): Product => {
  return {
    ...product,
    image_url: processImageUrl(product.image_url),
    category_image: processImageUrl(product.category_image),
    banner_image: processImageUrl(product.banner_image),
  };
};

/**
 * Process an array of products' image URLs
 * @param {Product[]} products - Array of products
 * @returns {Product[]} Products with processed image URLs
 */
const processProductsImages = (products: Product[]): Product[] => {
  return products.map(processProductImages);
};

/**
 * Get all products from the database
 * @param {string} category - Optional category filter
 * @returns {Promise<Product[]>} Array of products
 */
export const getAllProducts = async (category?: string): Promise<Product[]> => {
  let endpoint = '/api/products/';
  if (category) {
    endpoint += `?category=${category}`;
  }
  const response = await apiCall(endpoint, 'GET');
  // Handle paginated response from Django REST Framework
  const products = response.results || response;
  return processProductsImages(Array.isArray(products) ? products : []);
};

/**
 * Get a single product by ID
 * @param {number} id - Product ID
 * @returns {Promise<Product>} Product details
 */
export const getProduct = async (id: number): Promise<Product> => {
  const product = await apiCall(`/api/products/${id}/`, 'GET');
  return processProductImages(product);
};

/**
 * Create a new product in the database
 * @param {Product} productData - Product information
 * @returns {Promise<Product>} Created product with ID
 */

export const createProduct = async (productData: FormData): Promise<Product> => {
  // productData should be a FormData object with file(s) from device
  const result = await apiCall('/api/products/', 'POST', productData);
  if (!result) {
    throw new Error('Product creation failed: empty response from server');
  }
  return result;
};

/**
 * Update an existing product
 * @param {number} id - Product ID
 * @param {Partial<Product>} productData - Updated product data
 * @returns {Promise<Product>} Updated product
 */

export const updateProduct = async (
  id: number,
  productData: FormData
): Promise<Product> => {
  // productData should be a FormData object with file(s) from device
  const result = await apiCall(`/api/products/${id}/`, 'PUT', productData);
  if (!result) {
    throw new Error('Product update failed: empty response from server');
  }
  return result;
};

/**
 * Delete a product
 * @param {number} id - Product ID
 * @returns {Promise<void>}
 */
export const deleteProduct = async (id: number): Promise<void> => {
  return apiCall(`/api/products/${id}/`, 'DELETE');
};

/**
 * Get featured products
 * @returns {Promise<Product[]>} Array of featured products
 */
export const getFeaturedProducts = async (): Promise<Product[]> => {
  const products = await apiCall('/api/products/featured/', 'GET');
  return processProductsImages(Array.isArray(products) ? products : []);
};

export default {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  processProductImages,
  processImageUrl,
};
