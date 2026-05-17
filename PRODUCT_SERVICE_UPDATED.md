// Updated Product Service with Image Fields
// All images saved permanently to MySQL database!

import { apiCall } from '../api/client';

export interface Product {
  id?: number;
  name: string;
  description: string;
  price: number | string;
  category: 'shirt' | 'pants' | 'jacket' | 'shoes' | 'accessories';
  
  // IMAGE FIELDS - All permanent! ✅
  image_url?: string;              // Product image
  category_image?: string;         // Category/thumbnail image
  banner_image?: string;           // Banner/hero image
  
  stock?: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * USAGE EXAMPLES:
 * 
 * // Create product with all images
 * const product = await productService.createProduct({
 *   name: 'T-Shirt',
 *   price: 29.99,
 *   category: 'shirt',
 *   description: 'Premium cotton',
 *   stock: 50,
 *   image_url: 'https://example.com/shirt.jpg',
 *   category_image: 'https://example.com/category.jpg',
 *   banner_image: 'https://example.com/banner.jpg'
 * });
 * // ✅ All images saved to MySQL database!
 * 
 * // Get product with images
 * const product = await productService.getProduct(1);
 * console.log(product.image_url);        // Product image
 * console.log(product.category_image);   // Category image
 * console.log(product.banner_image);     // Banner image
 * 
 * // Update images only
 * await productService.updateProduct(1, {
 *   banner_image: 'https://example.com/new-banner.jpg'
 * });
 * // ✅ Image updated in database!
 * 
 * // Display in React
 * <img src={product.image_url} alt={product.name} />
 * <img src={product.banner_image} alt="Banner" />
 * <img src={product.category_image} alt="Category" />
 */

/**
 * Get all products from the database (with images)
 * @param {string} category - Optional category filter
 * @returns {Promise<Product[]>} Array of products with images
 */
export const getAllProducts = async (category?: string): Promise<Product[]> => {
  let endpoint = '/products/';
  if (category) {
    endpoint += `?category=${category}`;
  }
  return apiCall(endpoint, 'GET');
};

/**
 * Get a single product by ID (with all images)
 * @param {number} id - Product ID
 * @returns {Promise<Product>} Product with images
 */
export const getProduct = async (id: number): Promise<Product> => {
  return apiCall(`/products/${id}/`, 'GET');
};

/**
 * Create a new product with images in the database
 * @param {Product} productData - Product information including images
 * @returns {Promise<Product>} Created product with ID and images
 */
export const createProduct = async (productData: Product): Promise<Product> => {
  return apiCall('/products/', 'POST', productData);
};

/**
 * Update an existing product (including images)
 * @param {number} id - Product ID
 * @param {Partial<Product>} productData - Updated data
 * @returns {Promise<Product>} Updated product
 */
export const updateProduct = async (
  id: number,
  productData: Partial<Product>
): Promise<Product> => {
  return apiCall(`/products/${id}/`, 'PUT', productData);
};

/**
 * Delete a product
 * @param {number} id - Product ID
 * @returns {Promise<void>}
 */
export const deleteProduct = async (id: number): Promise<void> => {
  return apiCall(`/products/${id}/`, 'DELETE');
};

/**
 * Get products by category
 * @param {string} category - Category name
 * @returns {Promise<Product[]>} Filtered products with images
 */
export const getProductsByCategory = async (category: string): Promise<Product[]> => {
  return getAllProducts(category);
};

export default {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
};
