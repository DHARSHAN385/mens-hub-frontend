# Quick Reference - API Services

## 🚀 Import Services
```tsx
import { productService } from '@/services/productService';
import { orderService } from '@/services/orderService';
import { API_CONFIG } from '@/api/config';
```

## 📦 Product Operations

### Get All Products
```tsx
const products = await productService.getAllProducts();
```

### Get by Category
```tsx
const shirts = await productService.getProductsByCategory('shirt');
// Categories: shirt, pants, jacket, shoes, accessories
```

### Get Single Product
```tsx
const product = await productService.getProduct(1);
```

### Create Product ➕
```tsx
const newProduct = await productService.createProduct({
  name: 'Blue T-Shirt',
  description: 'Premium cotton',
  price: 29.99,
  category: 'shirt',
  stock: 100,
  image_url: 'https://...'  // optional
});
// Saved to MySQL database immediately!
```

### Update Product ✏️
```tsx
await productService.updateProduct(productId, {
  price: 25.99,
  stock: 50
});
```

### Delete Product ❌
```tsx
await productService.deleteProduct(productId);
```

---

## 📋 Order Operations

### Get All Orders
```tsx
const orders = await orderService.getAllOrders();
```

### Get Single Order
```tsx
const order = await orderService.getOrder(orderId);
```

### Create Order ➕
```tsx
const newOrder = await orderService.createOrder({
  customer_name: 'John Doe',
  customer_email: 'john@example.com',
  total_amount: 99.99,
  status: 'pending'  // pending, processing, shipped, delivered, cancelled
});
```

### Update Order ✏️
```tsx
await orderService.updateOrder(orderId, {
  status: 'shipped'
});
```

### Delete Order ❌
```tsx
await orderService.deleteOrder(orderId);
```

---

## 🪝 React Hooks Pattern

### Load Data on Mount
```tsx
useEffect(() => {
  const loadProducts = async () => {
    try {
      const data = await productService.getAllProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };
  loadProducts();
}, []);
```

### Add Product
```tsx
const handleAddProduct = async (productData) => {
  try {
    const created = await productService.createProduct(productData);
    setProducts([...products, created]);
  } catch (error) {
    alert('Error: ' + error.message);
  }
};
```

### Update Product
```tsx
const handleUpdate = async (id, updatedData) => {
  const updated = await productService.updateProduct(id, updatedData);
  setProducts(products.map(p => p.id === id ? updated : p));
};
```

### Delete Product
```tsx
const handleDelete = async (id) => {
  await productService.deleteProduct(id);
  setProducts(products.filter(p => p.id !== id));
};
```

---

## ✅ Complete Example Component

```tsx
import React, { useState, useEffect } from 'react';
import { productService } from '@/services/productService';

export default function ProductManager() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load products from database on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await productService.getAllProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const addProduct = async () => {
    const newProduct = await productService.createProduct({
      name: 'T-Shirt',
      description: 'Casual wear',
      price: 29.99,
      category: 'shirt',
      stock: 50
    });
    setProducts([...products, newProduct]);
  };

  const updateProduct = async (id) => {
    await productService.updateProduct(id, { stock: 100 });
    fetchProducts(); // Refresh
  };

  const deleteProduct = async (id) => {
    await productService.deleteProduct(id);
    setProducts(products.filter(p => p.id !== id));
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Products ({products.length})</h1>
      <button onClick={addProduct}>Add Product</button>

      {products.map(product => (
        <div key={product.id} className="product">
          <h3>{product.name}</h3>
          <p>${product.price} - Stock: {product.stock}</p>
          <button onClick={() => updateProduct(product.id)}>Update</button>
          <button onClick={() => deleteProduct(product.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
```

---

## 🛠 Constants from Config

```tsx
import { API_CONFIG, API_MESSAGES } from '@/api/config';

// Categories
API_CONFIG.CATEGORIES
// [{value: 'shirt', label: 'Shirt'}, ...]

// Order statuses
API_CONFIG.ORDER_STATUSES
// [{value: 'pending', label: 'Pending'}, ...]

// Messages
API_MESSAGES.PRODUCT_CREATED
// "Product added to database successfully!"
```

---

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| Network Error | Start Django: `python manage.py runserver` |
| CORS Error | Already configured for port 5173 |
| Data Lost on Refresh | You're using API services ✓ Data persists |
| 404 Not Found | Check Django URLs are configured |
| 500 Server Error | Check Django console for errors |

---

## ⚡ Key Points

✅ **All data saves to MySQL database**
✅ **Data persists after page refresh**
✅ **CORS configured for frontend-backend communication**
✅ **TypeScript types included**
✅ **Error handling built-in**
✅ **Ready to use in components**

---

## 📱 Backend Running Check

Frontend will work only if Django backend is running:
```bash
# Terminal 1 - Start Backend
cd "c:\Users\dhars\Downloads\mens hub front end"
venv\Scripts\activate
python manage.py runserver

# Terminal 2 - Start Frontend
npm run dev
```

Backend: http://localhost:8000
Frontend: http://localhost:5173
