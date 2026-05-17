// Order API Service
// Handles all order-related API calls to the backend

import { apiCall } from '../api/client';

export interface Order {
  id?: number;
  order_number?: string; // 6-digit order number - user entered
  customer_name: string;
  customer_email: string;
  total_amount: number | string;
  address?: string;
  pincode?: string; // 6-digit pincode
  items?: OrderItem[];
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  created_at?: string;
  updated_at?: string;
}

export interface OrderItem {
  product_id: number;
  product_name: string;
  quantity: number;
  size?: string;
  price: number | string;
}

/**
 * Get all orders from the database
 * @returns {Promise<Order[]>} Array of orders
 */
export const getAllOrders = async (): Promise<Order[]> => {
  return apiCall('/orders/', 'GET');
};

/**
 * Get a single order by ID
 * @param {number} id - Order ID
 * @returns {Promise<Order>} Order details
 */
export const getOrder = async (id: number): Promise<Order> => {
  return apiCall(`/orders/${id}/`, 'GET');
};

/**
 * Create a new order in the database
 * @param {Order} orderData - Order information
 * @returns {Promise<Order>} Created order with ID
 */
export const createOrder = async (orderData: Order): Promise<Order> => {
  return apiCall('/orders/', 'POST', orderData);
};

/**
 * Update an existing order
 * @param {number} id - Order ID
 * @param {Partial<Order>} orderData - Updated order data
 * @returns {Promise<Order>} Updated order
 */
export const updateOrder = async (
  id: number,
  orderData: Partial<Order>
): Promise<Order> => {
  return apiCall(`/orders/${id}/`, 'PUT', orderData);
};

/**
 * Delete an order
 * @param {number} id - Order ID
 * @returns {Promise<void>}
 */
export const deleteOrder = async (id: number): Promise<void> => {
  return apiCall(`/orders/${id}/`, 'DELETE');
};

/**
 * Update order status
 * @param {number} id - Order ID
 * @param {string} status - New status
 * @returns {Promise<Order>} Updated order
 */
export const updateOrderStatus = async (
  id: number,
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
): Promise<Order> => {
  return apiCall(`/orders/${id}/update_status/`, 'PATCH', { status });
};

/**
 * Get all orders for the current authenticated user
 * @returns {Promise<Order[]>} Array of user's orders
 */
export const getMyOrders = async (): Promise<Order[]> => {
  return apiCall('/orders/my_orders/', 'GET');
};

/**
 * ADMIN: Get all orders from all customers
 * @returns {Promise<any>} All orders with admin data
 */
export const getAdminAllOrders = async (): Promise<any> => {
  return apiCall('/admin/orders/', 'GET');
};

/**
 * ADMIN: Update order status and tracking number
 * @param {number} orderId - Order ID
 * @param {string} status - New status
 * @param {string} trackingNumber - Tracking number (optional)
 * @returns {Promise<any>} Updated order
 */
export const adminUpdateOrderStatus = async (
  orderId: number,
  status: string,
  trackingNumber?: string
): Promise<any> => {
  const data: any = { status };
  if (trackingNumber) {
    data.tracking_number = trackingNumber;
  }
  return apiCall(`/admin/orders/${orderId}/status/`, 'PATCH', data);
};

/**
 * ADMIN: Get all notifications
 * @returns {Promise<any>} All notifications
 */
export const getAdminNotifications = async (): Promise<any> => {
  return apiCall('/admin/notifications/', 'GET');
};

/**
 * ADMIN: Mark notification as read
 * @param {number} notificationId - Notification ID
 * @returns {Promise<any>} Updated notification
 */
export const markNotificationAsRead = async (notificationId: number): Promise<any> => {
  return apiCall(`/admin/notifications/${notificationId}/read/`, 'POST', {});
};

export default {
  getAllOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
  updateOrderStatus,
  getMyOrders,
  getAdminAllOrders,
  adminUpdateOrderStatus,
  getAdminNotifications,
  markNotificationAsRead,
};
