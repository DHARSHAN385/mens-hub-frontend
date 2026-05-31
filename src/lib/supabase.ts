/**
 * Permanent MySQL Backend Configuration
 * 
 * This project uses PERMANENT MySQL database with Django REST Framework backend.
 * NO SUPABASE - All data is stored permanently in MySQL.
 * 
 * Database Configuration:
 * - Type: MySQL (Permanent Storage)
 * - Database Name: men_hub_db
 * - Backend: Django 6.0.5 with Django REST Framework
 * - ORM: Django ORM (SQLAlchemy-like)
 * - Storage: PERMANENT - Data persists across server restarts
 * 
 * API Endpoints:
 * - Base URL: http://localhost:8000/api (local) or https://mens-hub-backend.onrender.com/api (production)
 * - Products: /api/products/
 * - Orders: /api/orders/
 * - Cart: /api/cart/
 * - Wishlist: /api/wishlist/
 * - Categories: /api/categories/
 * - Banners: /api/banners/
 * 
 * Data Persistence:
 * ✓ All user data stored permanently in MySQL
 * ✓ All product data stored permanently in MySQL
 * ✓ All order data stored permanently in MySQL
 * ✓ Cart saved to database (persistent across sessions)
 * ✓ Wishlist saved to database (persistent across sessions)
 * ✓ Authentication via Django/Django REST Framework
 * 
 * Usage Examples:
 * 
 * For API calls with auto-retry and error handling:
 *   import { apiCall } from '@/api/client';
 *   const data = await apiCall('/products/', 'GET');
 * 
 * For service-level abstractions:
 *   import { productService } from '@/services/productService';
 *   const products = await productService.getAllProducts();
 * 
 * For direct API communication:
 *   const response = await fetch('http://localhost:8000/api/orders/', {
 *     method: 'GET',
 *     headers: {
 *       'Authorization': `Token ${authToken}`,
 *       'Content-Type': 'application/json',
 *     }
 *   });
 * 
 * @see src/api/client.ts for API configuration and methods
 * @see src/services/ for all available service abstractions
 * @see backend_project/settings.py for Django database configuration
 * @see api/models.py for all data models
 */

export const dbConfig = {
  // Storage Type
  type: 'mysql',
  storageType: 'PERMANENT',
  
  // Backend Configuration
  backend: 'Django REST Framework',
  version: '3.17.1',
  
  // Database Configuration
  database: 'men_hub_db',
  databaseType: 'MySQL (Permanent)',
  
  // API Configuration
  apiUrl: import.meta.env.VITE_API_URL || 'https://mens-hub-backend.onrender.com',
  apiBasePath: '/api',
  
  // Authentication
  authMethod: 'Django Token Authentication',
  authTokenKey: 'authToken',
  
  // Data Models (all stored permanently in MySQL)
  models: {
    products: 'Permanent storage - auto synced',
    orders: 'Permanent storage - auto synced',
    cart: 'Permanent storage - auto synced',
    wishlist: 'Permanent storage - auto synced',
    categories: 'Permanent storage - auto synced',
    banners: 'Permanent storage - auto synced',
    users: 'Permanent storage - auto synced',
  },
  
  // Storage Guarantees
  guarantees: {
    dataPersistence: true,
    permanentStorage: true,
    noSessionLoss: true,
    synchronizedStorage: true,
    databaseBacked: true,
  },
} as const;

export default dbConfig;
