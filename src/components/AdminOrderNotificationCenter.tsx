/**
 * Admin Order Notification Component
 * 
 * Real-time order notification display component for admin dashboard.
 * Features:
 * - Real-time notification popup
 * - Browser notification sound
 * - Notification history
 * - Mark as read functionality
 * - Unread badge counter
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useOrderNotifications, OrderNotification } from '../hooks/useOrderNotifications';
import { Bell, X, CheckCircle, AlertCircle } from 'lucide-react';

interface AdminNotificationProps {
  onNotificationReceived?: (notification: OrderNotification) => void;
  showBrowser?: boolean;
  soundEnabled?: boolean;
}

export const AdminOrderNotificationCenter: React.FC<AdminNotificationProps> = ({
  onNotificationReceived,
  showBrowser = true,
  soundEnabled = true,
}) => {
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  const {
    isConnected,
    connectionError,
    markNotificationAsRead,
    getUnreadCount,
  } = useOrderNotifications({
    onNotification: handleNewNotification,
    onConnectionEstablished: handleConnectionEstablished,
    onError: handleConnectionError,
    onUnreadCountUpdate: setUnreadCount,
  });

  function handleNewNotification(notification: OrderNotification) {
    console.log('New notification received:', notification);

    // Add to notifications list
    setNotifications((prev) => [notification, ...prev].slice(0, 50)); // Keep last 50

    // Update unread count
    setUnreadCount((prev) => prev + 1);

    // Play sound if enabled
    if (soundEnabled) {
      playNotificationSound();
    }

    // Show browser notification if enabled
    if (showBrowser && 'Notification' in window && Notification.permission === 'granted') {
      showBrowserNotification(notification);
    }

    // Call parent callback
    onNotificationReceived?.(notification);
  }

  function handleConnectionEstablished() {
    console.log('Connected to order notifications');
    getUnreadCount();
  }

  function handleConnectionError(error: string) {
    console.error('Connection error:', error);
  }

  function playNotificationSound() {
    // Create a simple beep sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gain.gain.setValueAtTime(0.3, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  }

  function showBrowserNotification(notification: OrderNotification) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const title = `New Order #${notification.order_number}`;
      const options: NotificationOptions = {
        body: `${notification.customer_name} - $${notification.total_amount}`,
        icon: '/mens-hub-logo.png',
        badge: '/notification-badge.png',
        tag: `order-${notification.order_id}`,
        requireInteraction: true,
      };

      const browserNotification = new Notification(title, options);

      browserNotification.onclick = () => {
        window.focus();
        setShowNotificationPanel(true);
        browserNotification.close();
      };
    }
  }

  const handleMarkAsRead = useCallback(
    (notification: OrderNotification) => {
      markNotificationAsRead(notification.notification_id);

      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          n.notification_id === notification.notification_id
            ? { ...n, status: 'read' }
            : n
        )
      );

      setUnreadCount((prev) => Math.max(0, prev - 1));
    },
    [markNotificationAsRead]
  );

  const handleDismiss = (notificationId: number) => {
    setNotifications((prev) => prev.filter((n) => n.notification_id !== notificationId));
  };

  // Request browser notification permission on mount
  useEffect(() => {
    if (showBrowser && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [showBrowser]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Notification Button */}
      <div className="relative">
        <button
          onClick={() => setShowNotificationPanel(!showNotificationPanel)}
          className={`relative p-3 rounded-full transition-all ${
            isConnected
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-400 text-gray-800 cursor-not-allowed'
          }`}
          title={isConnected ? 'Connected' : 'Disconnected'}
        >
          <Bell className="w-6 h-6" />

          {/* Unread Badge */}
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}

          {/* Connection Status Indicator */}
          <span
            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
        </button>
      </div>

      {/* Notification Panel */}
      {showNotificationPanel && (
        <div className="absolute bottom-20 right-0 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 max-h-96 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex justify-between items-center">
            <h3 className="font-semibold text-lg">Order Notifications</h3>
            <button
              onClick={() => setShowNotificationPanel(false)}
              className="hover:bg-blue-500 p-1 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Connection Status */}
          <div className="px-4 py-2 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span className="text-sm text-gray-600">
                {isConnected ? 'Connected to updates' : 'Disconnected'}
              </span>
              {connectionError && <span className="text-red-600 text-xs ml-auto">{connectionError}</span>}
            </div>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.notification_id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      notification.status === 'read' ? 'opacity-60' : 'bg-blue-50'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-sm text-gray-900">
                            Order #{notification.order_number}
                          </p>
                          {notification.status === 'read' && (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          )}
                        </div>

                        <p className="text-xs text-gray-600 truncate">
                          {notification.customer_name}
                        </p>

                        <p className="text-xs text-gray-500 mb-2">
                          {notification.customer_email}
                        </p>

                        {/* Items Summary */}
                        <div className="text-xs text-gray-600 mb-2">
                          <p className="font-medium">
                            {notification.items_count} item{notification.items_count !== 1 ? 's' : ''}
                          </p>
                          {notification.items_summary.slice(0, 2).map((item, idx) => (
                            <p key={idx} className="text-gray-500">
                              • {item.product_name} x{item.quantity}
                            </p>
                          ))}
                        </div>

                        <p className="font-semibold text-sm text-blue-600">
                          Total: ${notification.total_amount}
                        </p>

                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(notification.timestamp).toLocaleString()}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 flex-shrink-0">
                        {notification.status !== 'read' && (
                          <button
                            onClick={() => handleMarkAsRead(notification)}
                            className="p-1 hover:bg-green-100 rounded text-green-600"
                            title="Mark as read"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDismiss(notification.notification_id)}
                          className="p-1 hover:bg-red-100 rounded text-red-600"
                          title="Dismiss"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-100 p-3 bg-gray-50 text-center">
              <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                Clear All
              </button>
            </div>
          )}
        </div>
      )}

      {/* Hidden Audio Element for Notification Sound */}
      <audio ref={audioRef} />
    </div>
  );
};

export default AdminOrderNotificationCenter;
