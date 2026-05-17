# Integration Guide: Adding Notifications to Your Existing Admin Dashboard

## Overview

This guide shows how to integrate the real-time notification system into your existing admin dashboard with minimal changes.

---

## 🎯 Step-by-Step Integration

### Step 1: Import the Notification Center Component

In your main admin dashboard or layout component:

```tsx
// AdminLayout.tsx or AdminDashboard.tsx

import AdminOrderNotificationCenter from '@/components/AdminOrderNotificationCenter';

export default function AdminDashboard() {
  return (
    <div>
      {/* Your existing dashboard content */}
      <header>
        {/* Header content */}
      </header>
      
      <main>
        {/* Your dashboard pages */}
      </main>

      {/* Add notification center - fixed in bottom-right corner */}
      <AdminOrderNotificationCenter 
        showBrowser={true}
        soundEnabled={true}
      />
    </div>
  );
}
```

### Step 2: Add Notification Badge to Header

Add a badge to your header to show unread notification count:

```tsx
// Header.tsx

import NotificationBadge from '@/components/NotificationBadge';

export default function Header() {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="flex items-center justify-between p-4 bg-white border-b">
      <h1>Admin Dashboard</h1>
      
      {/* Add notification badge */}
      <div className="flex items-center gap-4">
        <NotificationBadge 
          onClick={() => setShowNotifications(!showNotifications)}
          showLabel={true}
          className="cursor-pointer hover:scale-110 transition"
        />
        
        {/* Other header items */}
      </div>
    </header>
  );
}
```

### Step 3: Create Orders Page with Real-Time Updates

```tsx
// AdminPages/Orders.tsx

import React, { useState, useCallback } from 'react';
import AdminOrderNotificationCenter from '@/components/AdminOrderNotificationCenter';
import { OrderNotification } from '@/hooks/useOrderNotifications';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);

  // Handle new order notifications
  const handleNewOrder = useCallback((notification: OrderNotification) => {
    // Add to orders list
    const newOrder = {
      id: notification.order_id,
      number: notification.order_number,
      customer: notification.customer_name,
      email: notification.customer_email,
      amount: notification.total_amount,
      items: notification.items_count,
      timestamp: new Date(notification.timestamp),
      status: 'pending',
    };

    setOrders(prev => [newOrder, ...prev]);
  }, []);

  return (
    <div>
      <h1>Orders</h1>
      
      {/* Order list */}
      <OrdersList orders={orders} />

      {/* Notification center */}
      <AdminOrderNotificationCenter 
        onNotificationReceived={handleNewOrder}
        showBrowser={true}
        soundEnabled={true}
      />
    </div>
  );
}

function OrdersList({ orders }) {
  return (
    <table className="w-full">
      <thead>
        <tr>
          <th>Order #</th>
          <th>Customer</th>
          <th>Amount</th>
          <th>Items</th>
          <th>Status</th>
          <th>Time</th>
        </tr>
      </thead>
      <tbody>
        {orders.map(order => (
          <tr key={order.id} className="border-b hover:bg-gray-50">
            <td className="font-semibold text-blue-600">#{order.number}</td>
            <td>{order.customer}</td>
            <td className="font-semibold">${order.amount}</td>
            <td>{order.items} items</td>
            <td>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded">
                {order.status}
              </span>
            </td>
            <td className="text-sm text-gray-500">
              {order.timestamp.toLocaleTimeString()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### Step 4: Create Notification History Page

```tsx
// AdminPages/Notifications.tsx

import React from 'react';
import { useOrderNotifications } from '@/hooks/useOrderNotifications';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const { markNotificationAsRead } = useOrderNotifications({
    onNotification: (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    },
    onUnreadCountUpdate: setUnreadCount,
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <span className="bg-red-100 text-red-800 px-4 py-2 rounded-lg">
          {unreadCount} Unread
        </span>
      </div>

      <div className="space-y-4">
        {notifications.map(notification => (
          <div 
            key={notification.notification_id}
            className={`p-4 rounded-lg border ${
              notification.status === 'read' 
                ? 'bg-gray-50 border-gray-200'
                : 'bg-blue-50 border-blue-200'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">
                  Order #{notification.order_number}
                </h3>
                <p className="text-sm text-gray-600">
                  {notification.customer_name} - {notification.customer_email}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {notification.items_count} items - ${notification.total_amount}
                </p>
              </div>
              {notification.status !== 'read' && (
                <button
                  onClick={() => markNotificationAsRead(notification.notification_id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Mark as Read
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Step 5: Update Your Layout/Root Component

```tsx
// App.tsx or main layout file

import AdminOrderNotificationCenter from '@/components/AdminOrderNotificationCenter';

export default function App() {
  return (
    <Router>
      {/* Your existing layout */}
      <Header />
      <Sidebar />
      <main>
        <Routes>
          {/* Your existing routes */}
        </Routes>
      </main>

      {/* Add this once (not in every page) */}
      <AdminOrderNotificationCenter 
        showBrowser={true}
        soundEnabled={true}
      />
    </Router>
  );
}
```

---

## 🎨 Customization Options

### Customize Notification Sound

```tsx
// Disable sound
<AdminOrderNotificationCenter soundEnabled={false} />

// Or modify the component to use custom audio
// Edit AdminOrderNotificationCenter.tsx playNotificationSound()
```

### Customize Notification Position

```tsx
// Edit the bottom-right fixed positioning in AdminOrderNotificationCenter.tsx
// Look for: className="fixed bottom-4 right-4 z-50"
// Change to: className="fixed top-4 left-4 z-50" (for top-left)
```

### Customize Colors & Theme

All components use Tailwind CSS classes. Customize by:

1. Edit the `className` props in components
2. Or add custom CSS overrides
3. Or use Tailwind's customization in `tailwind.config.ts`

```tsx
// Example: Change notification center header color
// Edit AdminOrderNotificationCenter.tsx
// Change: className="bg-gradient-to-r from-blue-600 to-blue-700"
// To: className="bg-gradient-to-r from-purple-600 to-purple-700"
```

---

## 🔌 API Integration Examples

### Create Order from Your Forms

```tsx
// YourCheckoutForm.tsx

import { useState } from 'react';

export default function CheckoutForm() {
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (formData) => {
    setIsCreating(true);
    try {
      const response = await fetch('http://localhost:8000/api/orders/create-with-notification/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: formData.name,
          customer_email: formData.email,
          total_amount: formData.total,
          address: formData.address,
          pincode: formData.pincode,
          items: formData.items,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Order created:', data.order.order_number);
        // Admin will receive notification automatically!
        // Show success message to user
      }
    } catch (error) {
      console.error('Order creation failed:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleSubmit(Object.fromEntries(new FormData(e.target)));
    }}>
      {/* Form fields */}
      <button type="submit" disabled={isCreating}>
        {isCreating ? 'Creating...' : 'Place Order'}
      </button>
    </form>
  );
}
```

### Fetch Orders with Real-Time Updates

```tsx
// useAdminOrders.ts

import { useState, useEffect } from 'react';
import { useOrderNotifications, OrderNotification } from '@/hooks/useOrderNotifications';

export function useAdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch initial orders
  useEffect(() => {
    fetchOrders();
  }, []);

  // Listen for new notifications
  const { isConnected } = useOrderNotifications({
    onNotification: (notification: OrderNotification) => {
      // Add new order to list
      const newOrder = {
        id: notification.order_id,
        order_number: notification.order_number,
        customer_name: notification.customer_name,
        customer_email: notification.customer_email,
        total_amount: notification.total_amount,
        items_count: notification.items_count,
        status: 'pending',
        created_at: notification.timestamp,
      };
      
      setOrders(prev => [newOrder, ...prev]);
    },
  });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/orders/');
      const data = await response.json();
      setOrders(data.results || data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  return { orders, loading, isConnected, refetch: fetchOrders };
}

// Usage in component
export default function AdminOrders() {
  const { orders, loading, isConnected } = useAdminOrders();

  return (
    <div>
      <h1>Orders {!isConnected && '(offline)'}</h1>
      {loading ? <div>Loading...</div> : <OrdersList orders={orders} />}
    </div>
  );
}
```

---

## 🚀 Environment Configuration

### Set API URL

Create `.env.local` in your frontend root:

```env
VITE_API_URL=http://localhost:8000
```

Then use in code:

```tsx
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

fetch(`${API_URL}/api/orders/`)
```

---

## 🧪 Testing Your Integration

### Test 1: Basic Connection

```tsx
// Create a test component
import { useOrderNotifications } from '@/hooks/useOrderNotifications';

export function WebSocketTest() {
  const { isConnected, connectionError } = useOrderNotifications();

  return (
    <div>
      Status: {isConnected ? '✅ Connected' : '❌ Disconnected'}
      {connectionError && <p>Error: {connectionError}</p>}
    </div>
  );
}
```

### Test 2: Order Creation

```tsx
// Use OrderCreationExample component
import OrderCreationExample from '@/components/OrderCreationExample';

// Add to your admin test page
<OrderCreationExample />
```

### Test 3: Notification Display

1. Open admin dashboard
2. Create an order (using example or API)
3. Verify notification appears immediately
4. Verify browser notification appears (if permitted)
5. Verify sound plays (if enabled)

---

## ⚠️ Common Integration Issues

### Issue: "Notifications not appearing after order creation"

**Solution**:
1. Verify Daphne is running (not Django's runserver)
2. Check WebSocket connection indicator
3. Verify admin user is logged in (is_staff=True)
4. Check browser console for errors
5. Verify API endpoint returns successful response

### Issue: "WebSocket connection refused"

**Solution**:
1. Check backend is running: `daphne -b 0.0.0.0 -p 8000 backend_project.asgi:application`
2. Check frontend API URL matches backend URL
3. Check CORS configuration in Django
4. Check firewall/proxy settings

### Issue: "Browser notifications not working"

**Solution**:
1. Request permission first:
   ```tsx
   import { requestNotificationPermission } from '@/utils/notificationPermissions';
   await requestNotificationPermission();
   ```
2. Check browser notification settings
3. Verify HTTPS or localhost (browsers require secure context)
4. Check notification permission status

---

## 📊 Integration Checklist

- [ ] Installed backend dependencies
- [ ] Started Daphne server
- [ ] Started frontend dev server
- [ ] Added AdminOrderNotificationCenter to main layout
- [ ] Added NotificationBadge to header
- [ ] Created/updated orders page with notification handling
- [ ] Created notifications history page
- [ ] Tested WebSocket connection
- [ ] Tested order creation
- [ ] Verified notifications appear
- [ ] Tested browser notifications
- [ ] Tested reconnection logic
- [ ] Customized appearance (colors, sounds)
- [ ] Set API URL in .env.local
- [ ] Tested on multiple browser tabs
- [ ] Verified admin-only access

---

## 🎓 Learning Resources

Refer to these files for more details:

- **Setup Guide**: `REALTIME_NOTIFICATIONS_SETUP.md`
- **Quick Reference**: `NOTIFICATIONS_QUICK_REFERENCE.md`
- **Implementation Complete**: `IMPLEMENTATION_COMPLETE.md`

---

## 💡 Pro Tips for Integration

1. **Use the Example Component**: Start with `AdminDashboardExample.tsx` and modify it
2. **Test in Browser DevTools**: Monitor WebSocket frames in Network tab
3. **Add Loading States**: Show "Connecting..." while WebSocket connects
4. **Handle Offline**: Add fallback UI when notifications unavailable
5. **Mobile Responsive**: Ensure notification panel works on mobile
6. **Performance**: Don't recreate useOrderNotifications hook in every component

---

## 🎉 Integration Complete!

Your admin dashboard now has real-time order notifications! 

Users will instantly see new orders without page refresh, with optional browser notifications and sound alerts.

For advanced features or custom requirements, modify the components in `src/components/` and hooks in `src/hooks/`.

