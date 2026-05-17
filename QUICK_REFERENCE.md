# Quick Reference - Permanent Database Storage

**TL;DR:** Everything is now permanently stored in the database instead of localStorage!

---

## What Was Done ✅

### Database Changes
| Component | Before | After |
|-----------|--------|-------|
| Cart | Session-based (localStorage) | **User-based (Database)** |
| Wishlist | Session-based (localStorage) | **User-based (Database)** |
| Orders | User-based (Database) | Still Database ✓ |
| Addresses | User-based (Database) | Still Database ✓ |
| Users | Auth tokens | Still Tokens ✓ |

### Storage Changes
```
localStorage → Database
- Cart items
- Wishlist items
- User login status
- Address information
- Order history
- Admin status
```

---

## API Endpoints Quick List

### Auth
- `POST /api/auth/register/` - New account
- `POST /api/auth/login/` - Login
- `POST /api/auth/google/` - Google OAuth

### Cart
- `GET /api/cart/current/` - Get cart
- `POST /api/cart/update_items/` - Save cart
- `POST /api/cart/clear/` - Clear cart

### Wishlist
- `GET /api/wishlist/current/` - Get wishlist
- `POST /api/wishlist/add_product/` - Add item
- `POST /api/wishlist/remove_product/` - Remove item
- `POST /api/wishlist/clear/` - Clear all

### Orders
- `GET /api/orders/my_orders/` - My orders
- `POST /api/orders/` - Create order
- `GET /api/orders/<id>/track/` - Track order

### Addresses
- `GET /api/addresses/` - Get addresses
- `POST /api/addresses/` - Create address
- `POST /api/addresses/<id>/set_default/` - Set default

---

## Frontend Services

All services include built-in authentication token handling!

```typescript
// Auth
authService.register({email, password, name, phone})
authService.login({email, password})
authService.logout()
authService.isAuthenticated()

// Cart
cartService.getCart()
cartService.updateCart(items)
cartService.clearCart()

// Wishlist
wishlistService.getWishlist()
wishlistService.addToWishlist(productId)
wishlistService.removeFromWishlist(productId)
wishlistService.clearWishlist()

// Addresses
addressService.getAddresses()
addressService.createAddress(data)
addressService.setDefaultAddress(id)

// Orders
orderService.getMyOrders()
orderService.createOrder(data)
orderService.trackOrder(id)
```

---

## How to Apply

### 1. Backend (Required)
```bash
python manage.py migrate
```

### 2. Frontend (Required)
Update components to use the services instead of localStorage:

```typescript
// OLD
const cart = JSON.parse(localStorage.getItem('cart') || '[]');

// NEW
const cart = await cartService.getCart();
```

---

## Key Points

✅ **Permanent:** Data survives browser refresh, logout, device changes  
✅ **Automatic:** Token-based auth, no manual session management  
✅ **Synced:** Same data on all devices after login  
✅ **Secure:** Database storage, no localStorage exposure  
✅ **Complete:** Cart, Wishlist, Orders, Addresses all permanent  

---

## Files Changed

**Backend:**
- `api/models.py` - Cart & Wishlist models
- `api/views.py` - CartViewSet & WishlistViewSet  
- `api/serializers.py` - Updated serializers
- `api/migrations/0008_*.py` - Database migration

**Frontend:**
- `src/api/client.ts` - Auth token support
- `src/services/cartService.ts` - Updated
- `src/services/wishlistService.ts` - Updated
- `src/services/authService.ts` - New
- `src/services/addressService.ts` - New

**Documentation:**
- `PERMANENT_DATA_STORAGE_GUIDE.md` - Full guide
- `IMPLEMENTATION_SUMMARY.md` - What changed
- `IMPLEMENTATION_CHECKLIST.md` - Tasks to do
- `QUICK_REFERENCE.md` - This file

---

## Next Step

→ Open [PERMANENT_DATA_STORAGE_GUIDE.md](./PERMANENT_DATA_STORAGE_GUIDE.md) for complete implementation guide

→ Follow [IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md) for frontend integration

---

**Status:** 🚀 Ready to use!
