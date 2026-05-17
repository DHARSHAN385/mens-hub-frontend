/**
 * Browser Notification Permissions Utility
 * 
 * Handles browser notification API permissions and lifecycle.
 */

export interface NotificationPermissionConfig {
  title?: string;
  message?: string;
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
}

/**
 * Check if browser supports notifications
 */
export function isNotificationSupported(): boolean {
  return 'Notification' in window;
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(
  config?: NotificationPermissionConfig
): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    console.warn('Browser does not support notifications');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    config?.onPermissionGranted?.();
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    config?.onPermissionDenied?.();
    return 'denied';
  }

  // Request permission (only works in response to user gesture)
  try {
    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      config?.onPermissionGranted?.();
      
      // Show initial notification
      if (config?.title) {
        showNotification(config.title, {
          body: config.message || 'You will now receive order notifications',
          icon: '/notification-icon.png',
        });
      }
    } else {
      config?.onPermissionDenied?.();
    }

    return permission;
  } catch (error) {
    console.error('Failed to request notification permission:', error);
    return 'denied';
  }
}

/**
 * Show a browser notification
 */
export function showNotification(
  title: string,
  options?: NotificationOptions
): Notification | null {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    console.warn('Notifications not available or not permitted');
    return null;
  }

  try {
    return new Notification(title, {
      icon: '/notification-icon.png',
      badge: '/notification-badge.png',
      ...options,
    });
  } catch (error) {
    console.error('Failed to show notification:', error);
    return null;
  }
}

/**
 * Check and request permissions if needed
 * This should be called early in the app lifecycle
 */
export async function initializeNotifications(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    return 'denied';
  }

  const permission = getNotificationPermission();

  // If permission is 'default', we can request it
  if (permission === 'default') {
    return requestNotificationPermission({
      title: 'Enable Notifications',
      message: 'Stay updated with real-time order notifications',
      onPermissionGranted: () => {
        console.log('Notifications enabled');
      },
      onPermissionDenied: () => {
        console.log('Notifications disabled');
      },
    });
  }

  return permission;
}

/**
 * React hook for browser notifications
 */
export function useBrowserNotifications() {
  const isSupported = isNotificationSupported();
  const permission = getNotificationPermission();
  const isGranted = permission === 'granted';

  const requestPermission = async () => {
    return requestNotificationPermission({
      title: 'Enable Notifications',
      message: 'Get real-time alerts for new orders',
    });
  };

  const show = (title: string, options?: NotificationOptions) => {
    return showNotification(title, options);
  };

  return {
    isSupported,
    isGranted,
    permission,
    requestPermission,
    show,
  };
}
