/**
 * Order Notification Badge Component
 * 
 * Simple badge component for displaying unread order count.
 * Can be placed in header/navbar.
 */

import React, { useState } from 'react';
import { useOrderNotifications } from '../hooks/useOrderNotifications';
import { Bell } from 'lucide-react';

interface NotificationBadgeProps {
  className?: string;
  onBadgeClick?: () => void;
  showLabel?: boolean;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  className = '',
  onBadgeClick,
  showLabel = false,
}) => {
  const [unreadCount, setUnreadCount] = useState(0);

  const { isConnected, connectionError } = useOrderNotifications({
    onUnreadCountUpdate: setUnreadCount,
    autoConnect: true,
  });

  return (
    <div
      onClick={onBadgeClick}
      className={`relative inline-flex items-center cursor-pointer ${className}`}
      title={connectionError || (isConnected ? 'Connected' : 'Connecting...')}
    >
      <div className="relative">
        <Bell className="w-6 h-6 text-gray-700" />

        {/* Connection Status */}
        <span
          className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
            isConnected ? 'bg-green-500' : 'bg-yellow-500'
          }`}
        />

        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </div>

      {showLabel && <span className="ml-2 text-sm font-medium">{unreadCount}</span>}
    </div>
  );
};

export default NotificationBadge;
