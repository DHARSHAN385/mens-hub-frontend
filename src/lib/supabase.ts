/**
 * MySQL Backend Configuration
 * 
 * This project uses MySQL database with Django REST Framework backend.
 * 
 * API Configuration:
 * - Base URL: http://localhost:8000/api
 * - Database: MySQL (men_hub_db)
 * - Backend: Django 6.0.5
 * - Framework: Django REST Framework 3.17.1
 * 
 * For API calls, use the apiCall function from @/api/client:
 * 
 *   import { apiCall } from '@/api/client';
 *   const data = await apiCall('/products/', 'GET');
 * 
 * For service-level abstractions, use the services from @/services:
 * 
 *   import { productService } from '@/services/productService';
 *   const products = await productService.getAllProducts();
 * 
 * @see src/api/client.ts for API configuration
 * @see src/services/ for all available services
 */

export const dbConfig = {
  type: 'mysql',
  backend: 'Django REST Framework',
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  apiBasePath: '/api',
  database: 'men_hub_db',
} as const;

export default dbConfig;
