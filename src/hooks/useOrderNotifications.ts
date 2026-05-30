/**
 * WebSocket Hook for Real-time Order Notifications
 * 
 * This hook manages WebSocket connection to the Django Channels server
 * for receiving real-time admin order notifications.
 * 
 * Features:
 * - Auto-connect on mount
 * - Auto-reconnect on disconnect
 * - Message handling with type routing
 * - Connection state tracking
 * - Error handling and logging
 */

import { useEffect, useRef, useCallback, useState } from 'react';

export interface OrderNotification {
  type: string;
  order_id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  phone: string;
  city: string;
  address: string;
  pincode: string;
  total_amount: string;
  items_count: number;
  items_summary: Array<{
    product_name: string;
    quantity: number;
    price: string;
    size?: string;
  }>;
  notification_id: number;
  timestamp: string;
  status: string;
}

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

interface UseOrderNotificationsOptions {
  onNotification?: (notification: OrderNotification) => void;
  onConnectionEstablished?: () => void;
  onError?: (error: string) => void;
  onUnreadCountUpdate?: (count: number) => void;
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

export const useOrderNotifications = (options: UseOrderNotificationsOptions = {}) => {
  const {
    autoConnect = true,
    reconnectAttempts = 5,
    reconnectDelay = 3000,
  } = options;

  // Use a ref to store the latest options (callbacks) to prevent infinite loops from changing references
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const reconnectCountRef = useRef(0);
  const pingIntervalRef = useRef<any>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  /**
   * Get WebSocket URL based on current location
   */
  const getWebSocketURL = useCallback(() => {
    // Try multiple token key combinations
    const token = 
      localStorage.getItem('authToken') ||
      localStorage.getItem('token') ||
      localStorage.getItem('access_token') ||
      '';

    const apiURL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
    // Handle both http and https
    const wsBase = apiURL
      .replace(/^https/, 'wss')
      .replace(/^http/, 'ws');

    if (!wsBase.includes('://')) {
      console.error('Invalid API URL:', apiURL);
      return '';
    }

    // Remove trailing slash if present
    const baseURL = wsBase.endsWith('/') ? wsBase.slice(0, -1) : wsBase;

    if (!token) {
      alert('You must be logged in as admin to receive notifications.');
      return '';
    }

    return `${baseURL}/ws/orders/notifications/?token=${token}`;
  }, []);

  /**
   * Connect to WebSocket server
   */
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    try {
      const wsURL = getWebSocketURL();

      if (!wsURL) {
        const errorMsg = 'No authentication token found. Please log in as admin.';
        setConnectionError(errorMsg);
        optionsRef.current.onError?.(errorMsg);
        return;
      }

      console.log(`Connecting to WebSocket: ${wsURL}`);

      wsRef.current = new WebSocket(wsURL);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected successfully');
        setIsConnected(true);
        setConnectionError(null);
        reconnectCountRef.current = 0;

        // Call connection established callback
        optionsRef.current.onConnectionEstablished?.();

        // Start ping to keep connection alive
        startPingInterval();

        // Request initial unread count
        sendMessage({ type: 'get_unread_count' });
      };

      wsRef.current.onmessage = (event) => {
        handleMessage(JSON.parse(event.data));
      };

      wsRef.current.onerror = (error) => {
        const errorMsg = `WebSocket error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMsg, error);
        console.error('WebSocket ready state:', wsRef.current?.readyState);
        setConnectionError(errorMsg);
        optionsRef.current.onError?.(errorMsg);
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket disconnected', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        });
        setIsConnected(false);
        stopPingInterval();

        // Attempt to reconnect
        if (reconnectCountRef.current < reconnectAttempts) {
          reconnectCountRef.current += 1;
          console.log(
            `Attempting to reconnect (${reconnectCountRef.current}/${reconnectAttempts})...`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectDelay);
        } else {
          const errorMsg = `WebSocket connection failed after ${reconnectAttempts} attempts. Check that Daphne server is running and WebSocket URL is correct.`;
          console.error(errorMsg);
          setConnectionError(errorMsg);
          optionsRef.current.onError?.(errorMsg);
          
          // Fallback: Try polling API instead
          console.log('Fallback: Enabling polling mode for notifications');
        }
      };
    } catch (error) {
      const errorMsg = `Failed to connect: ${error instanceof Error ? error.message : String(error)}`;
      console.error(errorMsg);
      setConnectionError(errorMsg);
      optionsRef.current.onError?.(errorMsg);
    }
  }, [getWebSocketURL, reconnectAttempts, reconnectDelay]);

  /**
   * Disconnect from WebSocket server
   */
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    stopPingInterval();

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  /**
   * Send message to WebSocket server
   */
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(message));
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  /**
   * Handle incoming WebSocket messages
   */
  const handleMessage = useCallback(
    (message: WebSocketMessage) => {
      console.log('Received message:', message);

      switch (message.type) {
        case 'connection_established':
          console.log('Connection established:', message.message);
          break;

        case 'order_notification':
          // Trigger callback with new notification
          optionsRef.current.onNotification?.(message as OrderNotification);
          break;

        case 'notification_read':
          console.log('Notification marked as read:', message.notification_id);
          break;

        case 'unread_count':
          console.log('Unread count:', message.count);
          optionsRef.current.onUnreadCountUpdate?.(message.count);
          break;

        case 'pong':
          console.log('Pong received');
          break;

        case 'error':
          console.error('Server error:', message.message);
          optionsRef.current.onError?.(message.message);
          break;

        default:
          console.warn('Unknown message type:', message.type);
      }
    },
    []
  );

  /**
   * Start ping interval to keep connection alive
   */
  const startPingInterval = useCallback(() => {
    stopPingInterval();
    pingIntervalRef.current = setInterval(() => {
      sendMessage({ type: 'ping' });
    }, 30000); // Ping every 30 seconds
  }, [sendMessage]);

  /**
   * Stop ping interval
   */
  const stopPingInterval = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  /**
   * Mark notification as read
   */
  const markNotificationAsRead = useCallback((notificationId: number) => {
    sendMessage({
      type: 'mark_read',
      notification_id: notificationId,
    });
  }, [sendMessage]);

  /**
   * Get unread notification count
   */
  const getUnreadCount = useCallback(() => {
    sendMessage({ type: 'get_unread_count' });
  }, [sendMessage]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    isConnected,
    connectionError,
    connect,
    disconnect,
    sendMessage,
    markNotificationAsRead,
    getUnreadCount,
  };
};
