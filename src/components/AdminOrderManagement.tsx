/**
 * Admin Order Management Component
 * Properly fetches from database and saves updates permanently
 */

import React, { useState, useEffect } from 'react';
import { apiCall } from '../api/client';
import { Check, X, Clock, Package, Truck, Home, AlertCircle } from 'lucide-react';

interface AdminOrder {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  total_amount: string | number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  tracking_number?: string;
  created_at: string;
  updated_at?: string;
}

interface OrderNotification {
  id: number;
  order_id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  total_amount: string | number;
  items_count?: number;
  timestamp: string;
  is_read: boolean;
}

export const AdminOrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'orders' | 'notifications'>('orders');

  // Fetch all orders from database
  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiCall('/admin/orders/', 'GET');
      setOrders(data.orders || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch orders');
      console.error('Fetch orders error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch notifications from database
  const fetchNotifications = async () => {
    try {
      const data = await apiCall('/admin/notifications/', 'GET');
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error('Fetch notifications error:', err);
    }
  };

  // Load data on mount
  useEffect(() => {
    fetchOrders();
    fetchNotifications();

    // Refresh every 10 seconds to show latest data
    const interval = setInterval(() => {
      fetchOrders();
      fetchNotifications();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Update order status in database
  const handleUpdateOrder = async (orderId: number) => {
    if (!newStatus) {
      setError('Please select a status');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updateData: any = { status: newStatus };
      if (trackingNumber) {
        updateData.tracking_number = trackingNumber;
      }

      const response = await apiCall(
        `/admin/orders/${orderId}/status/`,
        'PATCH',
        updateData
      );

      // Update local state with new data from server
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? { ...order, status: newStatus as any, tracking_number: trackingNumber }
            : order
        )
      );

      // Clear selection
      setSelectedOrder(null);
      setNewStatus('');
      setTrackingNumber('');

      alert('✅ Order updated successfully! Changes saved to database.');
    } catch (err: any) {
      setError(err.message || 'Failed to update order');
      console.error('Update order error:', err);
      alert('❌ Failed to update order. ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const handleMarkNotificationRead = async (notificationId: number) => {
    try {
      await apiCall(
        `/admin/notifications/${notificationId}/read/`,
        'POST',
        {}
      );

      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
    } catch (err) {
      console.error('Mark as read error:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'processing':
        return <Package className="w-4 h-4" />;
      case 'shipped':
        return <Truck className="w-4 h-4" />;
      case 'delivered':
        return <Home className="w-4 h-4" />;
      case 'cancelled':
        return <X className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Admin Order Management</h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-6 py-2 rounded-lg font-medium transition ${
            activeTab === 'orders'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300'
          }`}
        >
          Orders ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-6 py-2 rounded-lg font-medium transition ${
            activeTab === 'notifications'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300'
          }`}
        >
          Notifications ({notifications.filter((n) => !n.is_read).length})
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {loading && !orders.length && (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading orders...</p>
            </div>
          )}

          {!loading && orders.length === 0 && (
            <div className="text-center py-8 bg-white rounded-lg">
              <p className="text-gray-600">No orders found</p>
            </div>
          )}

          {orders.map((order) => (
            <div
              key={order.id}
              className={`bg-white p-6 rounded-lg shadow-md border-l-4 ${
                order.status === 'pending' ? 'border-yellow-500' :
                order.status === 'shipped' ? 'border-purple-500' :
                order.status === 'delivered' ? 'border-green-500' :
                'border-gray-500'
              }`}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Order Info */}
                <div>
                  <h3 className="text-lg font-bold mb-2">Order #{order.order_number}</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><strong>Customer:</strong> {order.customer_name}</p>
                    <p><strong>Email:</strong> {order.customer_email}</p>
                    <p><strong>Amount:</strong> ₹{order.total_amount}</p>
                    <p><strong>Date:</strong> {new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Status */}
                <div className="flex flex-col justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Current Status</p>
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                  {order.tracking_number && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">Tracking #</p>
                      <p className="font-mono text-sm bg-gray-100 p-2 rounded">{order.tracking_number}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Update Form (shown if selected) */}
              {selectedOrder?.id === order.id && (
                <div className="mt-6 pt-6 border-t-2 bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-bold mb-4">Update Order Status</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Status
                      </label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2"
                      >
                        <option value="">Select Status...</option>
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tracking Number (Optional)
                      </label>
                      <input
                        type="text"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="e.g., ABC123456789"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleUpdateOrder(order.id)}
                        disabled={loading || !newStatus}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 transition flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        Save to Database
                      </button>
                      <button
                        onClick={() => {
                          setSelectedOrder(null);
                          setNewStatus('');
                          setTrackingNumber('');
                        }}
                        className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-400 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Edit Button */}
              {selectedOrder?.id !== order.id && (
                <button
                  onClick={() => {
                    setSelectedOrder(order);
                    setNewStatus(order.status);
                    setTrackingNumber(order.tracking_number || '');
                  }}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  Update Status
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* NOTIFICATIONS TAB */}
      {activeTab === 'notifications' && (
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg">
              <p className="text-gray-600">No notifications</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 rounded-lg border-2 ${
                  notif.is_read
                    ? 'bg-gray-50 border-gray-200'
                    : 'bg-blue-50 border-blue-400'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-bold">Order #{notif.order_number}</h4>
                    <p className="text-sm text-gray-600">{notif.customer_name}</p>
                    <p className="text-sm text-gray-600">{notif.customer_email}</p>
                    <p className="text-sm font-medium text-green-600 mt-2">₹{notif.total_amount}</p>
                  </div>
                  {!notif.is_read && (
                    <button
                      onClick={() => handleMarkNotificationRead(notif.id)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                    >
                      Mark Read
                    </button>
                  )}
                  {notif.is_read && (
                    <span className="text-green-600 text-sm font-medium">✓ Read</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Auto-refresh info */}
      <div className="mt-8 p-4 bg-blue-100 border border-blue-400 rounded-lg">
        <p className="text-sm text-blue-800">
          ✅ <strong>Data automatically refreshes every 10 seconds from database</strong>
        </p>
        <p className="text-sm text-blue-800 mt-1">
          💾 <strong>All status updates are saved permanently to the database</strong>
        </p>
      </div>
    </div>
  );
};

export default AdminOrderManagement;
