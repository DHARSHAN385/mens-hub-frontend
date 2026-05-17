# MySQL Database - Quick Reference

## 🚀 Quick Start

### Start Backend
```bash
cd "c:\Users\dhars\Downloads\mens hub front end"
venv\Scripts\activate
python manage.py runserver
```

### Start Frontend
```bash
npm run dev
```

---

## 📊 6 Database Tables

| Table | Purpose | Records |
|-------|---------|---------|
| `categories` | Product categories | 5 |
| `products` | All products with sizes & featured flag | 12 |
| `orders` | Customer orders with items & status | Auto-saved |
| `cart` | Shopping cart per session | Auto-saved |
| `wishlist` | Wishlist per session | Auto-saved |
| `banners` | Homepage banners | 3 |

---

## 📍 Key API Endpoints

```
Products:      /api/products/
Categories:    /api/categories/
Orders:        /api/orders/
Cart:          /api/cart/
Wishlist:      /api/wishlist/
Banners:       /api/banners/
```

---

## 🎯 Frontend Services

```typescript
// Import services
import { productService } from '@/services/productService';
import { categoryService } from '@/services/categoryService';
import { orderService } from '@/services/orderService';
import { cartService } from '@/services/cartService';
import { wishlistService } from '@/services/wishlistService';
import { bannerService } from '@/services/bannerService';

// Use them
const products = await productService.getAllProducts();
const categories = await categoryService.getAllCategories();
const orders = await orderService.getAllOrders();
const cartItems = await cartService.getCart('session-123');
const wishlistItems = await wishlistService.getWishlist('session-123');
const banners = await bannerService.getActiveBanners();
```

---

## 💡 Common Operations

### Add to Cart
```typescript
await cartService.addToCart({
  session_id: 'user-session',
  product: productId,
  size: 'M',
  quantity: 1
});
```

### Create Order
```typescript
await orderService.createOrder({
  customer_name: 'John Doe',
  customer_email: 'john@example.com',
  total_amount: 149.99,
  address: '123 Main St',
  items: [/* cart items */],
  status: 'pending'
});
```

### Create Product (Admin)
```typescript
await productService.createProduct({
  name: 'New Shirt',
  description: 'Premium cotton',
  price: 29.99,
  category: 'shirt',
  stock: 50,
  sizes: ['S', 'M', 'L', 'XL'],
  featured: true,
  image_url: 'https://...',
  category_image: 'https://...',
  banner_image: 'https://...'
});
```

### Update Order Status (Admin)
```typescript
await orderService.updateOrderStatus(orderId, 'shipped');
```

### Manage Categories (Admin)
```typescript
// Create
await categoryService.createCategory({
  name: 'T-Shirts',
  img: 'https://...'
});

// Update
await categoryService.updateCategory(catId, { name: 'Updated Name' });

// Delete
await categoryService.deleteCategory(catId);
```

---

## 🗄️ Database Schema Summary

### Products
```
- id: int
- name: string
- description: text
- price: decimal
- category: string (shirt, pants, jacket, shoes, accessories)
- stock: int
- sizes: json array (e.g., ["S", "M", "L"])
- popularity: int (0-100)
- featured: boolean
- 3x image URLs: image_url, category_image, banner_image
- timestamps: created_at, updated_at
```

### Orders
```
- id: int
- customer_name: string
- customer_email: string
- items: json array [{product_id, product_name, qty, size, price}]
- total_amount: decimal
- address: text
- status: enum (pending, processing, shipped, delivered, cancelled)
- timestamps: created_at, updated_at
```

### Cart
```
- id: int
- session_id: string (unique per product+size)
- product: int (foreign key)
- size: string (nullable)
- quantity: int
- timestamps: created_at, updated_at
```

### Wishlist
```
- id: int
- session_id: string
- product: int (foreign key)
- timestamp: created_at
```

### Categories
```
- id: int
- name: string (unique)
- img: url (nullable)
- timestamps: created_at, updated_at
```

### Banners
```
- id: int
- image_url: string
- title: string (nullable)
- description: text (nullable)
- is_active: boolean
- timestamps: created_at, updated_at
```

---

## ✅ Seed Data

Pre-loaded data:
- 5 Categories (Shirt, Pants, Jacket, Shoes, Accessories)
- 12 Featured Products (with Unsplash images)
- 3 Homepage Banners

---

## 🔧 Admin Panel

Access at: `http://localhost:8000/admin`

Manage all 6 tables:
- Add/Edit/Delete Products
- Create/Edit Categories
- View all Orders
- Change order statuses
- Create/Edit Banners
- View Cart & Wishlist data

---

## 📝 TypeScript Interfaces

```typescript
// Product with all new fields
interface Product {
  id?: number;
  name: string;
  description: string;
  price: number | string;
  category: 'shirt' | 'pants' | 'jacket' | 'shoes' | 'accessories';
  image_url?: string;
  category_image?: string;
  banner_image?: string;
  stock?: number;
  sizes?: string[];
  popularity?: number;
  featured?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Order with items array
interface Order {
  id?: number;
  customer_name: string;
  customer_email: string;
  total_amount: number | string;
  address?: string;
  items?: OrderItem[];
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  created_at?: string;
  updated_at?: string;
}

// Cart with related product data
interface Cart {
  id: number;
  session_id: string;
  product: number;
  product_details?: Product;
  size?: string;
  quantity: number;
  created_at: string;
  updated_at: string;
}
```

---

## 🎓 Usage Example

```tsx
import React, { useState, useEffect } from 'react';
import { productService } from '@/services/productService';
import { cartService } from '@/services/cartService';

export default function Shop() {
  const [products, setProducts] = useState([]);
  const sessionId = 'user-' + Date.now();

  useEffect(() => {
    // Load products on mount
    productService.getAllProducts().then(setProducts);
  }, []);

  return (
    <div>
      {/* Display featured products */}
      {products
        .filter(p => p.featured)
        .map(p => (
          <div key={p.id}>
            <h3>{p.name}</h3>
            <img src={p.image_url} alt={p.name} />
            <p>${p.price}</p>
            {p.sizes?.map(size => (
              <button
                key={size}
                onClick={() =>
                  cartService.addToCart({
                    session_id: sessionId,
                    product: p.id,
                    size,
                    quantity: 1
                  })
                }
              >
                Buy Size {size}
              </button>
            ))}
          </div>
        ))}
    </div>
  );
}
```

---

## ✨ All Done!

- ✅ MySQL: 6 tables with 20+ records
- ✅ Django: REST API with CRUD endpoints
- ✅ React: TypeScript services ready to use
- ✅ Admin: Full management panel
- ✅ Data: Persists across refreshes

**Start building!** 🚀
