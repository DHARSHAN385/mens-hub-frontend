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
    onNotification,
    onConnectionEstablished,
    onError,
    onUnreadCountUpdate,
    autoConnect = true,
    reconnectAttempts = 5,
    reconnectDelay = 3000,
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectCountRef = useRef(0);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  /**
   * Get WebSocket URL based on current location
   */
  const getWebSocketURL = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/ws/orders/notifications/`;
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
      console.log(`Connecting to WebSocket: ${wsURL}`);

      wsRef.current = new WebSocket(wsURL);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setConnectionError(null);
        reconnectCountRef.current = 0;

        // Call connection established callback
        onConnectionEstablished?.();

        // Start ping to keep connection alive
        startPingInterval();

        // Request initial unread count
        sendMessage({ type: 'get_unread_count' });
      };

      wsRef.current.onmessage = (event) => {
        handleMessage(JSON.parse(event.data));
      };

      wsRef.current.onerror = (error) => {
        const errorMsg = 'WebSocket error occurred';
        console.error(errorMsg, error);
        setConnectionError(errorMsg);
        onError?.(errorMsg);
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
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
          const errorMsg = 'Max reconnection attempts reached';
          setConnectionError(errorMsg);
          onError?.(errorMsg);
        }
      };
    } catch (error) {
      const errorMsg = `Failed to connect: ${error}`;
      console.error(errorMsg);
      setConnectionError(errorMsg);
      onError?.(errorMsg);
    }
  }, [getWebSocketURL, onConnectionEstablished, onError, reconnectAttempts, reconnectDelay]);

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
          onNotification?.(message as OrderNotification);
          break;

        case 'notification_read':
          console.log('Notification marked as read:', message.notification_id);
          break;

        case 'unread_count':
          console.log('Unread count:', message.count);
          onUnreadCountUpdate?.(message.count);
          break;

        case 'pong':
          console.log('Pong received');
          break;

        case 'error':
          console.error('Server error:', message.message);
          onError?.(message.message);
          break;

        default:
          console.warn('Unknown message type:', message.type);
      }
    },
    [onNotification, onUnreadCountUpdate, onError]
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
