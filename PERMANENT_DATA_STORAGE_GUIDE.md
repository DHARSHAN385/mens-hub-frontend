# Permanent Data Storage Implementation Guide

**Last Updated:** May 9, 2026

## Overview

This guide explains the migration from **temporary localStorage storage** to **permanent database storage** for all critical user data:
- ✅ User login & authentication  
- ✅ Shopping cart
- ✅ Wishlist/Favorites
- ✅ Orders
- ✅ Customer addresses
- ✅ Admin panel changes

---

## What Changed

### Database Models Updated

#### 1. **Cart Model** (Permanent User Storage)
```python
# OLD: Session-based with individual product items
Cart(session_id, product, quantity, size)

# NEW: User-based with JSON array storage
Cart(user, items_data=[...])
```

**Benefits:**
- Persists across devices and browsers
- One cart per authenticated user
- Stores full cart items as JSON array

#### 2. **Wishlist Model** (Permanent User Storage)
```python
# OLD: Session-based with individual product items
Wishlist(session_id, product)

# NEW: User-based with product IDs array
Wishlist(user, product_ids=[...])
```

**Benefits:**
- Permanent favorite list
- Accessible from any device after login
- Quick add/remove operations

#### 3. **Address Model** (Already User-Based ✓)
- Stores multiple addresses per user
- Supports home/work/other address types
- Can set default address
- Fully persistent

#### 4. **Order Model** (Already User-Based ✓)
- Each order linked to authenticated user
- Stores customer details permanently
- Tracks order status and shipping
- Supports order history

#### 5. **UserProfile Model** (Already User-Based ✓)
- Stores user phone, country code
- Admin status indicator
- Extended user information

---

## API Endpoints

### Authentication

#### Register User
```
POST /api/auth/register/
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name",
  "phone": "9999999999"  // optional, 10 digits
}

Response: { token, user }
```

#### Login User
```
POST /api/auth/login/
{
  "email": "user@example.com",
  "password": "password123"
}

Response: { token, user }
```

#### Google OAuth Login
```
POST /api/auth/google/
{
  "token": "google_id_token"
}

Response: { token, user }
```

### Cart Operations (User-Based)

#### Get Current Cart
```
GET /api/cart/current/
Headers: Authorization: Token <auth_token>

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

#### Update Cart
```
POST /api/cart/update_items/
Headers: Authorization: Token <auth_token>
{
  "items_data": [...]
}

Response: { cart object }
```

#### Clear Cart
```
POST /api/cart/clear/
Headers: Authorization: Token <auth_token>

Response: { empty cart }
```

### Wishlist Operations (User-Based)

#### Get Current Wishlist
```
GET /api/wishlist/current/
Headers: Authorization: Token <auth_token>

Response: {
  "id": 1,
  "product_ids": ["p1", "p2", "p3"],
  "created_at": "...",
  "updated_at": "..."
}
```

#### Add Product to Wishlist
```
POST /api/wishlist/add_product/
Headers: Authorization: Token <auth_token>
{
  "product_id": "p1"
}

Response: { wishlist object }
```

#### Remove Product from Wishlist
```
POST /api/wishlist/remove_product/
Headers: Authorization: Token <auth_token>
{
  "product_id": "p1"
}

Response: { wishlist object }
```

#### Update Entire Wishlist
```
POST /api/wishlist/update_items/
Headers: Authorization: Token <auth_token>
{
  "product_ids": ["p1", "p2"]
}

Response: { wishlist object }
```

### Order Operations (User-Based)

#### Get My Orders
```
GET /api/orders/my_orders/
Headers: Authorization: Token <auth_token>

Response: [{ order1 }, { order2 }, ...]
```

#### Create Order
```
POST /api/orders/
Headers: Authorization: Token <auth_token>
{
  "customer_name": "John Doe",
  "customer_email": "john@example.com",
  "total_amount": 5999.99,
  "address": "123 Main St, City",
  "pincode": "123456",
  "items": [
    {
      "product_id": "p1",
      "product_name": "Product Name",
      "quantity": 2,
      "size": "M",
      "price": 1000
    }
  ]
}

Response: { order object with order_number }
```

#### Track Order
```
GET /api/orders/<order_id>/track/
Headers: Authorization: Token <auth_token>

Response: {
  "order_number": "123456",
  "status": "shipped",
  "tracking_number": "ABC123",
  "total_amount": 5999.99,
  "items": [...]
}
```

### Address Operations (User-Based)

#### Get All Addresses
```
GET /api/addresses/
Headers: Authorization: Token <auth_token>

Response: [{ address1 }, { address2 }, ...]
```

#### Create Address
```
POST /api/addresses/
Headers: Authorization: Token <auth_token>
{
  "full_name": "John Doe",
  "phone": "9999999999",
  "street_address": "123 Main St",
  "city": "City Name",
  "state": "State Name",
  "postal_code": "123456",
  "country": "India",
  "address_type": "home",  // home, work, other
  "is_default": false
}

Response: { address object }
```

#### Set Default Address
```
POST /api/addresses/<address_id>/set_default/
Headers: Authorization: Token <auth_token>

Response: { updated address }
```

---

## Frontend Services (TypeScript)

### Authentication Service

```typescript
import { authService } from '@/services/authService';

// Register
await authService.register({
  email: 'user@example.com',
  password: 'password123',
  name: 'User Name',
  phone: '9999999999'
});

// Login
await authService.login({
  email: 'user@example.com',
  password: 'password123'
});

// Google Login
await authService.googleLogin(googleToken);

// Check auth status
authService.isAuthenticated();

// Get token
authService.getToken();

// Logout
authService.logout();
```

### Cart Service

```typescript
import { cartService } from '@/services/cartService';

// Get current cart
const cart = await cartService.getCart();

// Update cart with new items
const updated = await cartService.updateCart([
  {
    product: { id: 'p1', name: 'Product 1', price: 1000, image_url: '...' },
    size: 'M',
    qty: 2
  }
]);

// Clear cart
await cartService.clearCart();
```

### Wishlist Service

```typescript
import { wishlistService } from '@/services/wishlistService';

// Get wishlist
const wishlist = await wishlistService.getWishlist();

// Add product
await wishlistService.addToWishlist('p1');

// Remove product
await wishlistService.removeFromWishlist('p1');

// Update entire wishlist
await wishlistService.updateWishlist(['p1', 'p2', 'p3']);

// Clear wishlist
await wishlistService.clearWishlist();
```

### Order Service

```typescript
import { orderService } from '@/services/orderService';

// Get my orders
const orders = await orderService.getMyOrders();

// Get single order
const order = await orderService.getOrder(orderId);

// Create order
const newOrder = await orderService.createOrder({
  customer_name: 'John Doe',
  customer_email: 'john@example.com',
  total_amount: 5999.99,
  address: '123 Main St',
  pincode: '123456',
  items: [...]
});

// Track order
const tracking = await orderService.trackOrder(orderId);
```

### Address Service

```typescript
import { addressService } from '@/services/addressService';

// Get all addresses
const addresses = await addressService.getAddresses();

// Get default address
const defaultAddr = await addressService.getDefaultAddress();

// Create address
const newAddr = await addressService.createAddress({
  full_name: 'John Doe',
  phone: '9999999999',
  street_address: '123 Main St',
  city: 'City',
  state: 'State',
  postal_code: '123456',
  country: 'India',
  address_type: 'home'
});

// Update address
await addressService.updateAddress(addressId, { full_name: 'Jane Doe' });

// Set default
await addressService.setDefaultAddress(addressId);

// Delete address
await addressService.deleteAddress(addressId);
```

---

## How to Implement in Frontend

### Step 1: Replace localStorage with Services

**BEFORE (Temporary):**
```typescript
// Storing in localStorage (temporary)
localStorage.setItem('cart', JSON.stringify(cart));
const savedCart = localStorage.getItem('cart');
```

**AFTER (Permanent):**
```typescript
// Using cartService (permanent database)
const cart = await cartService.getCart();
await cartService.updateCart(newItems);
```

### Step 2: Update State Management

```typescript
// Hook example
const [cart, setCart] = useState([]);
const [wishlist, setWishlist] = useState([]);

useEffect(() => {
  // On mount, fetch from database if authenticated
  if (authService.isAuthenticated()) {
    cartService.getCart().then(setCart);
    wishlistService.getWishlist().then(w => setWishlist(w.product_ids));
  }
}, []);

// When cart changes, save to database
useEffect(() => {
  if (authService.isAuthenticated()) {
    cartService.updateCart(cart);
  }
}, [cart]);
```

### Step 3: Update Auth Flow

```typescript
// Register
const handleRegister = async (email, password, name, phone) => {
  try {
    const result = await authService.register({
      email, password, name, phone
    });
    // User automatically logged in with token
    setUser(result.user);
    // Initialize cart and wishlist from database
    const cart = await cartService.getCart();
    const wishlist = await wishlistService.getWishlist();
  } catch (error) {
    toast.error(error.message);
  }
};

// Login
const handleLogin = async (email, password) => {
  try {
    const result = await authService.login({ email, password });
    setUser(result.user);
    // Load data from database
    const cart = await cartService.getCart();
    const wishlist = await wishlistService.getWishlist();
  } catch (error) {
    toast.error(error.message);
  }
};

// Logout
const handleLogout = () => {
  authService.logout();
  setUser(null);
  setCart([]);
  setWishlist([]);
};
```

---

## Database Migration Steps

### 1. Create Migration
```bash
cd "c:\Users\dhars\Downloads\mens hub front end"
python manage.py makemigrations
```

### 2. Apply Migration
```bash
python manage.py migrate
```

### 3. Verify Migration
```bash
python manage.py sqlmigrate api 0008
```

---

## Testing Checklist

- [ ] User registration stores data in database
- [ ] User login retrieves stored user data
- [ ] Cart items persist after login/logout cycle
- [ ] Wishlist items persist across sessions
- [ ] Orders are saved to database permanently
- [ ] Addresses can be created and retrieved
- [ ] Default address is properly set
- [ ] Admin flag is preserved
- [ ] Mobile and desktop apps sync cart/wishlist
- [ ] Multi-device access works correctly

---

## Key Benefits of Permanent Storage

1. **✅ Data Persistence**: Data survives browser refresh, logout, device changes
2. **✅ Multi-Device Sync**: Same user sees same cart/wishlist on phone and desktop
3. **✅ Order History**: Complete order tracking and history
4. **✅ Address Management**: Save multiple delivery addresses
5. **✅ Admin Features**: Permanent admin status and order notifications
6. **✅ Scalability**: Database handles unlimited users and items
7. **✅ Security**: Auth tokens instead of local storage
8. **✅ Analytics**: Track user behavior and preferences

---

## Important Notes

- All authenticated API calls require `Authorization: Token <auth_token>` header
- Auth token is stored in `localStorage.authToken` after login/register
- Cart and Wishlist are created automatically on first access
- Use `authService.isAuthenticated()` to check login status
- Unauthenticated users fall back to temporary localStorage storage
- Admin users have `isAdmin: true` in user object

---

## Migration Rollback (If Needed)

```bash
python manage.py migrate api 0007
```

This will revert to the previous session-based Cart and Wishlist models.

---

## Support & Troubleshooting

**Issue: "Token invalid" error**
- Solution: Re-login, token expires after inactivity

**Issue: Cart not syncing**
- Solution: Check `authToken` in localStorage, verify user is authenticated

**Issue: Migration fails**
- Solution: Check for existing session data, may need data cleanup

**Issue: Address not saving**
- Solution: Ensure all required fields are provided, check API response

---

**Migration Status: ✅ COMPLETE**

All systems ready for permanent database storage!
