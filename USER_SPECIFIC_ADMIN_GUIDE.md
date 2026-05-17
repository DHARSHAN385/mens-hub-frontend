# Complete User-Specific & Admin Implementation Guide

**Amazon/Flipkart Style Database with User Login & Admin Features**

---

## Overview

Every user's data is **isolated and unique** in the database:
- ✅ Each user has their own cart
- ✅ Each user has their own wishlist
- ✅ Each user has their own orders
- ✅ Each user has their own addresses
- ✅ Admins can see ALL customer data
- ✅ Admins can manage orders and send notifications

---

## Database Flow

```
User Registration/Login
        ↓
User Record Created (auth_user)
        ↓
UserProfile Created (is_admin = False)
        ↓
Cart Created (OneToOne with user)
        ↓
Wishlist Created (OneToOne with user)
        ↓
User can add orders, addresses, items to cart/wishlist
        ↓
All data linked to that specific user_id
        ↓
Admins can query all users' data using user_id
```

---

## Part 1: USER ENDPOINTS (Regular Users)

### 1. Get Current User Profile
```
GET /api/me/profile/
Authorization: Token <auth_token>

Response: {
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "username": "john_doe",
    "date_joined": "2026-05-09T10:00:00Z"
  },
  "profile": {
    "phone": "9999999999",
    "country_code": "+91",
    "is_admin": false
  },
  "cart": {
    "id": 1,
    "items_data": [
      {
        "product": {
          "id": "p1",
          "name": "Product Name",
          "price": 1000,
          "image_url": "..."
        },
        "size": "M",
        "qty": 2
      }
    ]
  },
  "wishlist": {
    "id": 1,
    "product_ids": ["p1", "p2", "p3"]
  },
  "addresses": [
    {
      "id": 1,
      "full_name": "John Doe",
      "phone": "9999999999",
      "street_address": "123 Main St",
      "city": "City",
      "state": "State",
      "postal_code": "123456",
      "country": "India",
      "address_type": "home",
      "is_default": true
    }
  ],
  "orders": [
    {
      "id": 1,
      "order_number": "123456",
      "customer_name": "John Doe",
      "customer_email": "user@example.com",
      "total_amount": "5999.99",
      "address": "123 Main St, City",
      "pincode": "123456",
      "items": [...],
      "status": "shipped",
      "tracking_number": "ABC123",
      "created_at": "..."
    }
  ],
  "stats": {
    "total_orders": 5,
    "total_spent": 25000,
    "addresses_count": 2,
    "wishlist_items": 3
  }
}
```

### 2. Get User's Cart
```
GET /api/me/cart/
Authorization: Token <auth_token>

Response: {
  "id": 1,
  "items_data": [
    {
      "product": {...},
      "size": "M",
      "qty": 2
    }
  ],
  "created_at": "...",
  "updated_at": "..."
}
```

### 3. Get User's Wishlist
```
GET /api/me/wishlist/
Authorization: Token <auth_token>

Response: {
  "id": 1,
  "product_ids": ["p1", "p2", "p3"],
  "created_at": "...",
  "updated_at": "..."
}
```

### 4. Get User's All Orders
```
GET /api/me/orders/
Authorization: Token <auth_token>

Response: [
  {
    "id": 1,
    "order_number": "123456",
    "customer_name": "John Doe",
    "total_amount": "5999.99",
    "status": "shipped",
    "created_at": "..."
  },
  ...
]
```

### 5. Get Specific Order Details
```
GET /api/me/orders/<order_id>/
Authorization: Token <auth_token>

Response: {
  "id": 1,
  "order_number": "123456",
  "customer_name": "John Doe",
  "customer_email": "user@example.com",
  "total_amount": "5999.99",
  "address": "123 Main St",
  "pincode": "123456",
  "items": [...],
  "status": "shipped",
  "tracking_number": "ABC123",
  "created_at": "..."
}
```

### 6. Track Specific Order
```
GET /api/me/orders/<order_id>/track/
Authorization: Token <auth_token>

Response: {
  "order_number": "123456",
  "status": "shipped",
  "tracking_number": "ABC123",
  "customer_name": "John Doe",
  "customer_email": "user@example.com",
  "total_amount": "5999.99",
  "address": "123 Main St",
  "items": [...],
  "created_at": "...",
  "updated_at": "..."
}
```

### 7. Get User's All Addresses
```
GET /api/me/addresses/
Authorization: Token <auth_token>

Response: [
  {
    "id": 1,
    "full_name": "John Doe",
    "phone": "9999999999",
    "street_address": "123 Main St",
    "city": "City",
    "state": "State",
    "postal_code": "123456",
    "country": "India",
    "address_type": "home",
    "is_default": true,
    "created_at": "..."
  },
  {
    "id": 2,
    "full_name": "John Doe",
    "phone": "9999999999",
    "street_address": "456 Work Ave",
    "city": "City",
    "state": "State",
    "postal_code": "654321",
    "country": "India",
    "address_type": "work",
    "is_default": false,
    "created_at": "..."
  }
]
```

---

## Part 2: ADMIN ENDPOINTS (Admin Only)

### Authentication Check
```
Admin user must have:
- user.is_staff = True  OR
- user.profile.is_admin = True

Otherwise: 403 Forbidden
```

### 1. Get All Customers List
```
GET /api/admin/customers/
Authorization: Token <admin_token>
Required: Admin user

Response: [
  {
    "id": 1,
    "email": "customer1@example.com",
    "name": "Customer 1",
    "phone": "9999999999",
    "orders_count": 5,
    "total_spent": 25000.00,
    "last_order_date": "2026-05-08T10:00:00Z",
    "date_joined": "2026-05-01T10:00:00Z"
  },
  {
    "id": 2,
    "email": "customer2@example.com",
    "name": "Customer 2",
    "phone": "8888888888",
    "orders_count": 3,
    "total_spent": 15000.00,
    "last_order_date": "2026-05-07T10:00:00Z",
    "date_joined": "2026-04-15T10:00:00Z"
  }
]
```

### 2. Get Specific Customer Complete Profile
```
GET /api/admin/customers/<customer_id>/profile/
Authorization: Token <admin_token>
Required: Admin user

Response: {
  "customer": {
    "id": 1,
    "email": "customer@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "username": "john_doe",
    "date_joined": "2026-05-01T10:00:00Z"
  },
  "profile": {
    "phone": "9999999999",
    "country_code": "+91"
  },
  "cart": {
    "id": 1,
    "items_data": [...]
  },
  "wishlist": {
    "id": 1,
    "product_ids": ["p1", "p2"]
  },
  "addresses": [...],
  "orders": [...],
  "stats": {
    "total_orders": 5,
    "total_spent": 25000.00,
    "addresses_count": 2,
    "wishlist_items": 2
  }
}
```

### 3. Get Customer's All Orders
```
GET /api/admin/customers/<customer_id>/orders/
Authorization: Token <admin_token>
Required: Admin user

Response: [
  {
    "id": 1,
    "order_number": "123456",
    "customer_name": "John Doe",
    "total_amount": "5999.99",
    "status": "shipped",
    "items": [...],
    "tracking_number": "ABC123",
    "created_at": "..."
  }
]
```

### 4. Get Customer's All Addresses
```
GET /api/admin/customers/<customer_id>/addresses/
Authorization: Token <admin_token>
Required: Admin user

Response: [
  {
    "id": 1,
    "full_name": "John Doe",
    "phone": "9999999999",
    "street_address": "123 Main St",
    "city": "City",
    "state": "State",
    "postal_code": "123456",
    "country": "India",
    "address_type": "home",
    "is_default": true
  }
]
```

### 5. Get ALL Orders (From All Customers)
```
GET /api/admin/orders/
Authorization: Token <admin_token>
Required: Admin user

Response: [
  {
    "id": 1,
    "order_number": "123456",
    "customer": {
      "id": 1,
      "email": "customer@example.com",
      "name": "John Doe"
    },
    "total_amount": "5999.99",
    "status": "shipped",
    "items": [...],
    "tracking_number": "ABC123",
    "created_at": "..."
  },
  {
    "id": 2,
    "order_number": "654321",
    "customer": {
      "id": 2,
      "email": "another@example.com",
      "name": "Jane Smith"
    },
    "total_amount": "3999.99",
    "status": "pending",
    "items": [...],
    "tracking_number": null,
    "created_at": "..."
  }
]
```

### 6. Update Order Status
```
PATCH /api/admin/orders/<order_id>/status/
Authorization: Token <admin_token>
Required: Admin user

Request Body:
{
  "status": "shipped",
  "tracking_number": "ABC123XYZ"
}

Response: {
  "success": true,
  "message": "Order 123456 status updated to shipped",
  "order": {
    "id": 1,
    "order_number": "123456",
    "status": "shipped",
    "tracking_number": "ABC123XYZ",
    ...
  }
}
```

### 7. Get All Notifications
```
GET /api/admin/notifications/
Authorization: Token <admin_token>
Required: Admin user

Response: [
  {
    "id": 1,
    "order_number": "123456",
    "customer_name": "John Doe",
    "customer_email": "john@example.com",
    "total_amount": "5999.99",
    "items_count": 3,
    "items_summary": [
      {"name": "Product 1", "qty": 2, "size": "M"}
    ],
    "is_read": false,
    "created_at": "2026-05-09T10:00:00Z",
    "read_at": null,
    "order_status": "pending"
  }
]
```

### 8. Get Unread Notifications
```
GET /api/admin/notifications/unread/
Authorization: Token <admin_token>
Required: Admin user

Response: {
  "unread_count": 3,
  "notifications": [
    {
      "id": 1,
      "order_number": "123456",
      "customer_name": "John Doe",
      "is_read": false,
      ...
    }
  ]
}
```

### 9. Mark Notification as Read
```
POST /api/admin/notifications/<notification_id>/read/
Authorization: Token <admin_token>
Required: Admin user

Response: {
  "id": 1,
  "order_number": "123456",
  "is_read": true,
  "read_at": "2026-05-09T10:30:00Z",
  ...
}
```

### 10. Get Dashboard Statistics
```
GET /api/admin/dashboard/stats/
Authorization: Token <admin_token>
Required: Admin user

Response: {
  "overview": {
    "total_customers": 150,
    "total_orders": 450,
    "total_revenue": 2250000.00,
    "unread_notifications": 5
  },
  "today": {
    "orders_count": 15,
    "revenue": 89999.99
  },
  "week": {
    "orders_count": 95
  },
  "order_status_breakdown": [
    {"status": "pending", "count": 10},
    {"status": "processing", "count": 20},
    {"status": "shipped", "count": 300},
    {"status": "delivered", "count": 119},
    {"status": "cancelled", "count": 1}
  ]
}
```

### 11. Get Order History with Filters
```
GET /api/admin/order-history/
GET /api/admin/order-history/?days=7
GET /api/admin/order-history/?days=30
GET /api/admin/order-history/?status=shipped
GET /api/admin/order-history/?days=7&status=pending

Authorization: Token <admin_token>
Required: Admin user

Response: {
  "count": 15,
  "orders": [
    {
      "id": 1,
      "order_number": "123456",
      "customer": {
        "id": 1,
        "email": "customer@example.com",
        "name": "John Doe",
        "phone": "9999999999"
      },
      "total_amount": "5999.99",
      "status": "shipped",
      "items_count": 3,
      "tracking_number": "ABC123",
      "created_at": "2026-05-09T10:00:00Z",
      "updated_at": "2026-05-09T15:00:00Z"
    }
  ]
}
```

---

## Part 3: Frontend Integration Example

### User Component
```typescript
import { authService } from '@/services/authService';

const UserProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch current user's complete profile
    fetch('/api/me/profile/', {
      headers: {
        'Authorization': `Token ${localStorage.getItem('authToken')}`
      }
    })
    .then(res => res.json())
    .then(data => setProfile(data))
    .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>{profile.user.first_name} {profile.user.last_name}</h1>
      <p>Email: {profile.user.email}</p>
      <p>Phone: {profile.profile.phone}</p>
      
      <h2>Cart Items: {profile.stats.total_orders}</h2>
      <h2>Wishlist: {profile.stats.wishlist_items} items</h2>
      <h2>Total Spent: ₹{profile.stats.total_spent}</h2>

      <h3>Recent Orders</h3>
      {profile.orders.map(order => (
        <div key={order.id}>
          <p>Order #{order.order_number} - {order.status}</p>
          <p>Amount: ₹{order.total_amount}</p>
        </div>
      ))}

      <h3>Saved Addresses</h3>
      {profile.addresses.map(addr => (
        <div key={addr.id}>
          <p>{addr.full_name}</p>
          <p>{addr.street_address}, {addr.city}</p>
          {addr.is_default && <badge>Default</badge>}
        </div>
      ))}
    </div>
  );
};
```

### Admin Dashboard Component
```typescript
const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    // Fetch dashboard stats
    fetch('/api/admin/dashboard/stats/', {
      headers: {
        'Authorization': `Token ${localStorage.getItem('authToken')}`
      }
    })
    .then(res => res.json())
    .then(data => setStats(data));

    // Fetch all customers
    fetch('/api/admin/customers/', {
      headers: {
        'Authorization': `Token ${localStorage.getItem('authToken')}`
      }
    })
    .then(res => res.json())
    .then(data => setCustomers(data));

    // Fetch all orders
    fetch('/api/admin/orders/', {
      headers: {
        'Authorization': `Token ${localStorage.getItem('authToken')}`
      }
    })
    .then(res => res.json())
    .then(data => setOrders(data));
  }, []);

  return (
    <div className="admin-dashboard">
      {stats && (
        <div className="stats">
          <div>Total Customers: {stats.overview.total_customers}</div>
          <div>Total Orders: {stats.overview.total_orders}</div>
          <div>Total Revenue: ₹{stats.overview.total_revenue}</div>
          <div>Unread Notifications: {stats.overview.unread_notifications}</div>
        </div>
      )}

      <h2>Customers</h2>
      <table>
        <thead>
          <tr>
            <th>Email</th>
            <th>Orders</th>
            <th>Total Spent</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {customers.map(customer => (
            <tr key={customer.id}>
              <td>{customer.email}</td>
              <td>{customer.orders_count}</td>
              <td>₹{customer.total_spent}</td>
              <td>
                <button onClick={() => viewCustomer(customer.id)}>
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Recent Orders</h2>
      <table>
        <thead>
          <tr>
            <th>Order #</th>
            <th>Customer</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.id}>
              <td>{order.order_number}</td>
              <td>{order.customer.name}</td>
              <td>₹{order.total_amount}</td>
              <td>{order.status}</td>
              <td>
                <select 
                  onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                >
                  <option value="">Update Status</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

---

## Summary

✅ **User-Specific Data:**
- Each user has isolated cart, wishlist, orders, addresses
- Users only see their own data
- Data fetched using auth token

✅ **Admin Features:**
- View all customers
- View all orders with customer info
- Update order status
- See order notifications
- View dashboard statistics
- Filter order history by date/status

✅ **Security:**
- Regular users can only access their own data
- Admins can access all data (read/update)
- Permission checks on all admin endpoints

This is **Amazon/Flipkart style implementation**!
