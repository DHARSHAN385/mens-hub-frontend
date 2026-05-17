# Database Architecture - Amazon/Flipkart Style

## User-Specific Data Structure

```
DATABASE
├── User (authenticated user)
│   ├── Profile (UserProfile)
│   │   ├── phone
│   │   ├── country_code
│   │   └── is_admin ← Admin flag
│   ├── Cart (OneToOne) ← User's shopping cart
│   │   └── items_data (JSON)
│   ├── Wishlist (OneToOne) ← User's favorites
│   │   └── product_ids (JSON)
│   ├── Orders (ForeignKey) ← All user orders
│   │   ├── order_number
│   │   ├── items
│   │   ├── total_amount
│   │   ├── status
│   │   └── tracking_number
│   ├── Addresses (ForeignKey) ← All user addresses
│   │   ├── full_name
│   │   ├── phone
│   │   ├── street_address
│   │   ├── city, state, postal_code
│   │   └── is_default
│   └── GoogleUser (OneToOne) ← OAuth login
│       ├── google_id
│       ├── picture
│       └── name

Admin Features
├── View All Customers
├── View All Orders (with customer details)
├── View All Addresses (by customer)
├── View Order Notifications
├── Update Order Status
└── View Order History
```

---

## API Endpoints Structure

### USER ENDPOINTS (Require Login)

#### My Account
```
GET /api/me/                        → Current user profile
GET /api/user/profile/              → Full profile with cart, wishlist, orders, addresses
```

#### My Cart (User-Specific)
```
GET /api/me/cart/                   → Get my cart
POST /api/me/cart/add/              → Add item to my cart
POST /api/me/cart/update/           → Update my cart items
POST /api/me/cart/clear/            → Clear my cart
DELETE /api/me/cart/item/<item_id>/ → Remove item
```

#### My Wishlist (User-Specific)
```
GET /api/me/wishlist/               → Get my wishlist
POST /api/me/wishlist/add/          → Add product to wishlist
POST /api/me/wishlist/remove/       → Remove product
DELETE /api/me/wishlist/clear/      → Clear wishlist
```

#### My Orders (User-Specific)
```
GET /api/me/orders/                 → Get all my orders
GET /api/me/orders/<order_id>/      → Get specific order details
POST /api/me/orders/                → Create new order
GET /api/me/orders/<order_id>/track/ → Track my order
```

#### My Addresses (User-Specific)
```
GET /api/me/addresses/              → Get all my addresses
POST /api/me/addresses/             → Add new address
GET /api/me/addresses/<id>/         → Get specific address
PATCH /api/me/addresses/<id>/       → Update address
DELETE /api/me/addresses/<id>/      → Delete address
POST /api/me/addresses/<id>/default/→ Set as default
```

---

### ADMIN ENDPOINTS (Admin Only)

#### Customer Management
```
GET /api/admin/customers/           → List all customers
GET /api/admin/customers/<user_id>/ → Get customer details
GET /api/admin/customers/<user_id>/profile/
                                    → Customer profile with all data
GET /api/admin/customers/<user_id>/orders/
                                    → Get customer's all orders
GET /api/admin/customers/<user_id>/addresses/
                                    → Get customer's all addresses
GET /api/admin/customers/<user_id>/wishlist/
                                    → Get customer's wishlist
GET /api/admin/customers/<user_id>/cart/
                                    → Get customer's cart
```

#### Order Management
```
GET /api/admin/orders/              → All orders (with customer info)
GET /api/admin/orders/<order_id>/   → Order details
PATCH /api/admin/orders/<order_id>/status/
                                    → Update order status
PATCH /api/admin/orders/<order_id>/tracking/
                                    → Update tracking number
POST /api/admin/orders/<order_id>/cancel/
                                    → Cancel order
```

#### Order Notifications
```
GET /api/admin/notifications/       → All order notifications
GET /api/admin/notifications/unread/ → Unread notifications only
POST /api/admin/notifications/<id>/read/
                                    → Mark as read
POST /api/admin/notifications/mark-all-read/
                                    → Mark all as read
GET /api/admin/notifications/count/ → Unread count
```

#### Order History
```
GET /api/admin/order-history/       → Complete order history
GET /api/admin/order-history/today/ → Today's orders
GET /api/admin/order-history/week/  → Last week orders
GET /api/admin/order-history/month/ → Last month orders
GET /api/admin/order-history/stats/ → Order statistics
```

#### Dashboard Analytics
```
GET /api/admin/dashboard/stats/     → Dashboard statistics
GET /api/admin/dashboard/sales/     → Sales data
GET /api/admin/dashboard/customers/ → Customer metrics
GET /api/admin/dashboard/products/  → Product performance
```

---

## Authentication Flow

```
1. User Registration/Login
   POST /api/auth/register/ or /api/auth/login/
   ↓
2. Backend creates User + UserProfile + Cart + Wishlist
   ↓
3. Returns auth token + user data
   ↓
4. Frontend stores token in localStorage
   ↓
5. All subsequent requests include: Authorization: Token <token>
   ↓
6. Backend validates token and:
   - For regular users: Show only their data
   - For admins: Show all customer data + admin features
```

---

## Admin Features Explained

### 1. View All Customers
```
Admin accesses: GET /api/admin/customers/
Returns: [
  {
    "id": 1,
    "email": "customer1@example.com",
    "name": "Customer 1",
    "phone": "9999999999",
    "orders_count": 5,
    "total_spent": 25000,
    "last_order_date": "2026-05-08"
  },
  ...
]
```

### 2. View Customer Details
```
Admin accesses: GET /api/admin/customers/<user_id>/profile/
Returns: {
  "id": 1,
  "email": "customer@example.com",
  "name": "Customer Name",
  "phone": "9999999999",
  "cart": [...],
  "wishlist": [...],
  "orders": [...],
  "addresses": [...]
}
```

### 3. View All Orders with Customer Info
```
Admin accesses: GET /api/admin/orders/
Returns: [
  {
    "id": 1,
    "order_number": "123456",
    "customer": {
      "id": 1,
      "email": "customer@example.com",
      "name": "Customer Name"
    },
    "total_amount": 5999.99,
    "status": "shipped",
    "items": [...],
    "created_at": "..."
  },
  ...
]
```

### 4. Order Notifications (Real-time)
```
When customer places order:
1. OrderNotification is created in database
2. Admin sees notification
3. Admin can mark as read
4. Admin can see:
   - Customer name
   - Order details
   - Total amount
   - Items ordered
   - Notification status
```

### 5. Order Status Updates
```
Admin updates: PATCH /api/admin/orders/<order_id>/status/
{
  "status": "shipped",
  "tracking_number": "ABC123XYZ"
}
↓
Customer sees updated status in: GET /api/me/orders/<order_id>/track/
```

---

## Data Isolation (Security)

```
Regular User Can Access:
✅ Their own cart
✅ Their own wishlist
✅ Their own orders
✅ Their own addresses
❌ Other users' data
❌ Admin endpoints

Admin Can Access:
✅ All customers' data
✅ All orders
✅ All addresses
✅ All wishlists
✅ All carts
✅ Order notifications
✅ Admin-only features
❌ Cannot modify customer data directly (only through proper endpoints)
```

---

## Database Relationships (Amazon-Style)

```sql
-- User is the central hub
SELECT * FROM auth_user WHERE id = <user_id>;

-- Get user's cart (one-to-one)
SELECT * FROM api_cart WHERE user_id = <user_id>;

-- Get user's wishlist (one-to-one)
SELECT * FROM api_wishlist WHERE user_id = <user_id>;

-- Get user's all orders
SELECT * FROM api_order WHERE user_id = <user_id>;

-- Get user's all addresses
SELECT * FROM api_address WHERE user_id = <user_id>;

-- Admin: Get all customers
SELECT * FROM auth_user WHERE is_staff = FALSE;

-- Admin: Get all orders
SELECT * FROM api_order ORDER BY created_at DESC;

-- Admin: Get customer data
SELECT * FROM api_order 
WHERE user_id = <customer_id>;
```

---

## Example: Customer Places Order

```
1. Customer Login
   POST /api/auth/login/
   → Returns token + user data

2. Customer Adds to Cart
   POST /api/me/cart/add/
   → Saves to database (Cart table, user_id = customer_id)

3. Customer Views Cart
   GET /api/me/cart/
   → Fetches from database WHERE user_id = current_user

4. Customer Checkout (Create Order)
   POST /api/me/orders/
   → Creates Order record with user_id = customer_id
   → Creates OrderNotification for admin

5. Admin Sees Notification
   GET /api/admin/notifications/
   → Shows new order from customer

6. Admin Updates Order Status
   PATCH /api/admin/orders/<order_id>/status/
   → Updates status in database

7. Customer Tracks Order
   GET /api/me/orders/<order_id>/track/
   → Shows updated status from database
```

---

## Summary

| Feature | User | Admin |
|---------|------|-------|
| View own cart | ✅ | ❌ |
| View all carts | ❌ | ✅ |
| View own wishlist | ✅ | ❌ |
| View all wishlists | ❌ | ✅ |
| Create order | ✅ | ❌ |
| View own orders | ✅ | ✅ (all) |
| Update order status | ❌ | ✅ |
| View own addresses | ✅ | ❌ |
| View all addresses | ❌ | ✅ |
| See notifications | ❌ | ✅ |
| Manage customers | ❌ | ✅ |

This is **Amazon/Flipkart style database architecture**!
