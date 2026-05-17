// API Configuration and Constants
// Centralized configuration for API calls

export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'https://dharshan.pythonanywhere.com/api',
  TIMEOUT: 10000, // 10 seconds
  
  ENDPOINTS: {
    PRODUCTS: '/products/',
    ORDERS: '/orders/',
  },
  
  CATEGORIES: [
    { value: 'shirt', label: 'Shirt' },
    { value: 'pants', label: 'Pants' },
    { value: 'jacket', label: 'Jacket' },
    { value: 'shoes', label: 'Shoes' },
    { value: 'accessories', label: 'Accessories' },
  ],
  
  ORDER_STATUSES: [
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
  ],
};

// Success/Error messages
export const API_MESSAGES = {
  PRODUCT_CREATED: 'Product added to database successfully!',
  PRODUCT_UPDATED: 'Product updated successfully!',
  PRODUCT_DELETED: 'Product deleted from database!',
  ORDER_CREATED: 'Order created successfully!',
  ORDER_UPDATED: 'Order updated successfully!',
  ORDER_DELETED: 'Order deleted!',
  
  ERROR_FETCH: 'Failed to fetch data from server',
  ERROR_CREATE: 'Failed to create item',
  ERROR_UPDATE: 'Failed to update item',
  ERROR_DELETE: 'Failed to delete item',
  ERROR_NETWORK: 'Network error. Is the backend running?',
};

export default API_CONFIG;
