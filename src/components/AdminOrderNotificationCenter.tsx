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
import { Bell, X, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface AdminNotificationProps {
  onNotificationReceived?: (notification: OrderNotification) => void;
  onViewOrder?: (orderId: number | string) => void;
  showBrowser?: boolean;
  soundEnabled?: boolean;
}

export const AdminOrderNotificationCenter: React.FC<AdminNotificationProps> = ({
  onNotificationReceived,
  onViewOrder,
  showBrowser = true,
  soundEnabled = true,
}) => {
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const processedNotificationsRef = React.useRef<Set<number>>(new Set());

  const handleNewNotification = useCallback((notification: OrderNotification) => {
    console.log('New notification received:', notification);

    // Check if we've already processed this notification
    if (processedNotificationsRef.current.has(notification.notification_id)) {
      console.log('Duplicate notification ignored:', notification.notification_id);
      return;
    }

    // Mark as processed
    processedNotificationsRef.current.add(notification.notification_id);

    // Deduplicate: Only add if we haven't seen this notification ID before
    setNotifications((prev) => {
      // Check if this notification already exists
      if (prev.some(n => n.notification_id === notification.notification_id)) {
        console.log('Notification already in list:', notification.notification_id);
        return prev;
      }

      // Add to notifications list
      return [notification, ...prev].slice(0, 50); // Keep last 50
    });

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

    // Show in-app sonner toast
    toast(
      <div className="flex flex-col gap-2 w-full">
        <div className="font-semibold flex items-center gap-2">
          <Bell size={16} className="text-blue-500" /> New Order Received!
        </div>
        <div className="text-sm">
          <span className="font-medium">{notification.customer_name}</span> placed Order <span className="font-mono font-bold">#{notification.order_number}</span>
        </div>
        <div className="text-xs text-gray-600 space-y-1">
          <div>📧 {notification.customer_email}</div>
          <div>📱 {notification.phone}</div>
          <div>💰 ₹{parseFloat(String(notification.total_amount)).toLocaleString()}</div>
          {notification.items_count > 0 && <div>📦 {notification.items_count} item(s)</div>}
          <div>📍 {notification.address} {notification.city ? `(${notification.city})` : ''} {notification.pincode ? `- ${notification.pincode}` : ''}</div>
        </div>
        <button 
          onClick={() => {
            toast.dismiss();
            if (onViewOrder) onViewOrder(notification.order_id);
          }}
          className="mt-2 bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-medium self-start hover:bg-blue-700 transition w-full"
        >
          View Full Order Details
        </button>
      </div>,
      { duration: 10000 }
    );

    // Call parent callback
    onNotificationReceived?.(notification);
  }, [soundEnabled, showBrowser, onViewOrder, onNotificationReceived]);

  const handleConnectionError = useCallback((error: string) => {
    console.error('Connection error:', error);
  }, []);

  const {
    isConnected,
    connectionError,
    markNotificationAsRead,
    getUnreadCount,
  } = useOrderNotifications({
    onNotification: handleNewNotification,
    onConnectionEstablished: () => {
      console.log('Connected to order notifications');
    },
    onError: handleConnectionError,
    onUnreadCountUpdate: setUnreadCount,
  });

  // Get unread count after connection established
  useEffect(() => {
    if (isConnected) {
      getUnreadCount();
    }
  }, [isConnected, getUnreadCount]);

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
        body: `${notification.customer_name} - ₹${notification.total_amount}`,
        icon: '/mens-hub-logo.png',
        badge: '/notification-badge.png',
        tag: `order-${notification.order_id}`,
        requireInteraction: true,
      };

      const browserNotification = new Notification(title, options);

      browserNotification.onclick = () => {
        window.focus();
        onViewOrder?.(notification.order_id);
        setShowNotificationPanel(false);
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

  const handleDismiss = async (notificationId: number) => {
    // Remove from frontend immediately
    setNotifications((prev) => prev.filter((n) => n.notification_id !== notificationId));

    // Also call API to delete from database
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      if (token) {
        const apiURL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
        await fetch(`${apiURL}/api/order-notifications/${notificationId}/dismiss/`, {
          method: 'POST',
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Failed to dismiss notification from API:', error);
    }
  };

  // Request browser notification permission on mount
  useEffect(() => {
    if (showBrowser && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [showBrowser]);

  // Notification UI restored
  return (
    <div className="fixed top-20 right-6 z-40 w-96 max-w-full">
      {notifications.length > 0 && (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
          <div className="flex items-center justify-between px-4 py-2 bg-blue-50 border-b border-gray-200">
            <div className="flex items-center gap-2 font-semibold text-blue-700">
              <Bell size={18} />
              Admin Notifications
            </div>
            <span className="text-xs bg-blue-600 text-white rounded-full px-2 py-0.5 ml-2">
              {unreadCount} Unread
            </span>
          </div>
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
            {notifications.map((notif) => (
              <div
                key={notif.notification_id}
                className={`px-4 py-3 flex flex-col gap-2 hover:bg-blue-50 transition cursor-pointer ${notif.status === 'read' ? 'opacity-60' : 'bg-blue-50'}`}
                onClick={() => {
                  if (notif.status !== 'read') handleMarkAsRead(notif);
                  if (onViewOrder) onViewOrder(notif.order_id);
                  setShowNotificationPanel(false);
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 font-semibold text-gray-800">
                      <span>{notif.customer_name}</span>
                      <span className="text-xs bg-blue-600 text-white rounded px-2 py-0.5">Order #{notif.order_number}</span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1 space-y-0.5">
                      <div>📧 {notif.customer_email}</div>
                      <div>📱 {notif.phone}</div>
                      <div>💰 ₹{parseFloat(String(notif.total_amount)).toLocaleString()}</div>
                      {notif.items_count > 0 && <div>📦 {notif.items_count} item(s)</div>}
                      <div>📍 {notif.address} {notif.city ? `(${notif.city})` : ''}</div>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">{notif.timestamp ? new Date(notif.timestamp).toLocaleString() : ''}</div>
                <div className="flex gap-2 mt-1">
                  {notif.status !== 'read' && (
                    <button
                      className="text-xs text-blue-600 hover:underline"
                      onClick={e => { e.stopPropagation(); handleMarkAsRead(notif); }}
                    >Mark as read</button>
                  )}
                  <button
                    className="text-xs text-gray-500 hover:underline"
                    onClick={e => { e.stopPropagation(); handleDismiss(notif.notification_id); }}
                  >Dismiss</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrderNotificationCenter;
