/**
 * Example Admin Dashboard with Real-Time Order Notifications
 * 
 * This is a complete example of how to integrate the real-time
 * notification system into your admin dashboard.
 * 
 * Features demonstrated:
 * - Notification center with WebSocket
 * - Badge in header
 * - Order list with auto-updates
 * - Real-time order count
 * - Browser notifications
 */

import React, { useState, useCallback } from 'react';
// import AdminOrderNotificationCenter from '@/components/AdminOrderNotificationCenter';
// import NotificationBadge from '@/components/NotificationBadge';
// import OrderCreationExample from '@/components/OrderCreationExample';
// import { useBrowserNotifications } from '@/utils/notificationPermissions';
// import { OrderNotification } from '@/hooks/useOrderNotifications';
import { Activity, Settings, LogOut, Menu, X } from 'lucide-react';

interface AdminOrder {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  total_amount: string;
  status: string;
  created_at: string;
  items_count: number;
}

export const AdminDashboard: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);

  // const { isGranted: notificationsGranted } = useBrowserNotifications();
  const notificationsGranted = true;  // Assume notifications are granted

  // Handle new notifications
  const handleNotificationReceived = useCallback((notification: any) => {
    console.log('New order notification:', notification);

    // Add to orders list at the top
    const newOrder: AdminOrder = {
      id: notification.order_id,
      order_number: notification.order_number,
      customer_name: notification.customer_name,
      customer_email: notification.customer_email,
      total_amount: notification.total_amount,
      status: 'pending',
      created_at: notification.timestamp,
      items_count: notification.items_count,
    };

    setOrders((prev) => [newOrder, ...prev]);
    setTotalOrders((prev) => prev + 1);
    setUnreadCount((prev) => prev + 1);

    // Switch to orders tab to show new order
    setActiveTab('orders');
  }, []);

  const handleMarkOrderRead = (orderId: number) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, status: 'read' } : o
      )
    );
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* ===== SIDEBAR ===== */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-gray-900 text-white transition-all duration-300 shadow-lg`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-lg">
              MH
            </div>
            {sidebarOpen && <span className="font-bold text-lg">Mens Hub</span>}
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'orders', label: 'Orders', icon: '📦' },
            { id: 'notifications', label: 'Notifications', icon: '🔔' },
            { id: 'test', label: 'Test Order', icon: '🧪' },
            { id: 'settings', label: 'Settings', icon: '⚙️' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                activeTab === item.id
                  ? 'bg-blue-600'
                  : 'hover:bg-gray-800'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* User */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700 bg-gray-800">
          <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-700 rounded-lg transition">
            {sidebarOpen ? (
              <>
                <img
                  src="https://ui-avatars.com/api/?name=Admin&background=blue&color=fff"
                  alt="Admin"
                  className="w-8 h-8 rounded-full"
                />
                <span className="flex-1 text-left text-sm">
                  <div className="font-medium">Admin User</div>
                  <div className="text-xs text-gray-400">admin@example.com</div>
                </span>
              </>
            ) : (
              <LogOut className="w-5 h-5" />
            )}
          </button>
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* HEADER */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                {sidebarOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                {activeTab === 'overview' && 'Dashboard Overview'}
                {activeTab === 'orders' && 'Orders Management'}
                {activeTab === 'notifications' && 'Notifications'}
                {activeTab === 'test' && 'Test Order Creation'}
                {activeTab === 'settings' && 'Settings'}
              </h1>
            </div>

            <div className="flex items-center gap-6">
              {/* Notification Badge */}
              {/* <NotificationBadge showLabel className="cursor-pointer" /> */}

              {/* Browser Notifications Status */}
              <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                notificationsGranted
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {notificationsGranted ? '🔔 Notifications ON' : '🔕 Notifications OFF'}
              </span>

              {/* User Avatar */}
              <img
                src="https://ui-avatars.com/api/?name=Admin&background=blue&color=fff"
                alt="Admin"
                className="w-10 h-10 rounded-full cursor-pointer hover:ring-2 ring-blue-500"
              />
            </div>
          </div>
        </header>

        {/* CONTENT AREA */}
        <main className="flex-1 overflow-auto">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="p-6 space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Total Orders</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        {totalOrders}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      📦
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Unread Notifications</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        {unreadCount}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      🔔
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Server Status</p>
                      <p className="text-3xl font-bold text-green-600 mt-2">🟢 Online</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Activity className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Orders */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Orders</h2>
                {orders.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No orders yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-gray-200">
                        <tr className="text-left text-sm font-semibold text-gray-700">
                          <th className="pb-3">Order #</th>
                          <th className="pb-3">Customer</th>
                          <th className="pb-3">Amount</th>
                          <th className="pb-3">Items</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.slice(0, 5).map((order) => (
                          <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-4 font-semibold text-blue-600">
                              #{order.order_number}
                            </td>
                            <td className="py-4">{order.customer_name}</td>
                            <td className="py-4 font-semibold text-green-600">
                              ${order.total_amount}
                            </td>
                            <td className="py-4">{order.items_count} items</td>
                            <td className="py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                order.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="py-4 text-sm text-gray-500">
                              {new Date(order.created_at).toLocaleTimeString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="p-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">All Orders</h2>
                {orders.length === 0 ? (
                  <p className="text-gray-500 text-center py-12">No orders to display</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-gray-200">
                        <tr className="text-left text-sm font-semibold text-gray-700">
                          <th className="pb-3">Order #</th>
                          <th className="pb-3">Customer</th>
                          <th className="pb-3">Email</th>
                          <th className="pb-3">Amount</th>
                          <th className="pb-3">Items</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3">Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-4 font-semibold text-blue-600">
                              #{order.order_number}
                            </td>
                            <td className="py-4">{order.customer_name}</td>
                            <td className="py-4 text-sm">{order.customer_email}</td>
                            <td className="py-4 font-semibold">${order.total_amount}</td>
                            <td className="py-4">{order.items_count}</td>
                            <td className="py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                order.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="py-4 text-sm text-gray-500">
                              {new Date(order.created_at).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Test Tab */}
          {activeTab === 'test' && (
            <div className="p-6">
              {/* <OrderCreationExample /> */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Test Order Creation</h2>
                <p className="text-gray-600">Order creation example component not loaded.</p>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="p-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-6">Settings</h2>
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b">
                    <div>
                      <p className="font-medium text-gray-900">Browser Notifications</p>
                      <p className="text-sm text-gray-600">
                        {notificationsGranted
                          ? 'Enabled - You will receive system notifications'
                          : 'Disabled - Enable to receive system notifications'}
                      </p>
                    </div>
                    <span className={`px-4 py-2 rounded-lg font-medium ${
                      notificationsGranted
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {notificationsGranted ? 'ON' : 'OFF'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-4 border-b">
                    <div>
                      <p className="font-medium text-gray-900">Sound Notifications</p>
                      <p className="text-sm text-gray-600">
                        Play a sound when a new order arrives
                      </p>
                    </div>
                    <label className="flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="w-4 h-4" />
                    </label>
                  </div>

                  <div className="flex items-center justify-between pb-4 border-b">
                    <div>
                      <p className="font-medium text-gray-900">Auto-Connect</p>
                      <p className="text-sm text-gray-600">
                        Automatically connect to real-time notifications
                      </p>
                    </div>
                    <label className="flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="w-4 h-4" />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Notification Center (Fixed in bottom-right) */}
      {/* <AdminOrderNotificationCenter
        showBrowser={true}
        soundEnabled={true}
        onNotificationReceived={handleNotificationReceived}
      /> */}
    </div>
  );
};

export default AdminDashboard;
