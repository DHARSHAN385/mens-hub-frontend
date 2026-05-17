# Frontend API Integration Guide

## Overview
This guide explains how to use the API services to connect your React frontend to the Django backend database. All data is now **persisted permanently** in MySQL and will survive page refreshes!

## Folder Structure
```
src/
├── api/
│   └── client.ts              # Base API client
├── services/
│   ├── productService.ts      # Product CRUD operations
│   └── orderService.ts        # Order CRUD operations
└── components/
    └── ExampleProductManager.tsx  # Example component
```

## Setting Up the Services

### 1. Product Service

#### Get All Products
```tsx
import { productService } from '@/services/productService';

const products = await productService.getAllProducts();
// Returns array from database
```

#### Get Products by Category
```tsx
const shirts = await productService.getProductsByCategory('shirt');
// Filter: 'shirt', 'pants', 'jacket', 'shoes', 'accessories'
```

#### Get Single Product
```tsx
const product = await productService.getProduct(1);
// Get product with ID 1 from database
```

#### Create Product (Save to Database)
```tsx
const newProduct = await productService.createProduct({
  name: 'Blue T-Shirt',
  description: 'Premium 100% cotton',
  price: 29.99,
  category: 'shirt',
  image_url: 'https://example.com/image.jpg',
  stock: 100
});
// Data is now saved in MySQL database!
```

#### Update Product
```tsx
const updated = await productService.updateProduct(1, {
  price: 25.99,
  stock: 50
});
// Changes are saved to database immediately
```

#### Delete Product
```tsx
await productService.deleteProduct(1);
// Product removed from database
```

### 2. Order Service

Similar to products, use the order service for orders:

```tsx
import { orderService } from '@/services/orderService';

// Get all orders
const orders = await orderService.getAllOrders();

// Create order
const order = await orderService.createOrder({
  customer_name: 'John Doe',
  customer_email: 'john@example.com',
  total_amount: 99.99,
  status: 'pending'
});

// Update order status
await orderService.updateOrder(1, {
  status: 'shipped'
});

// Delete order
await orderService.deleteOrder(1);
```

## Usage in React Components

### Class Component Example
```tsx
import React from 'react';
import { productService } from '@/services/productService';

class ProductList extends React.Component {
  state = { products: [], loading: true };

  componentDidMount() {
    this.loadProducts();
  }

  loadProducts = async () => {
    try {
      const products = await productService.getAllProducts();
      this.setState({ products, loading: false });
    } catch (error) {
      console.error('Error:', error);
      this.setState({ loading: false });
    }
  };

  addProduct = async (name, price, category) => {
    const newProduct = await productService.createProduct({
      name,
      price,
      category,
      description: '',
      stock: 0
    });
    this.setState({
      products: [...this.state.products, newProduct]
    });
  };

  render() {
    const { products, loading } = this.state;
    return (
      <div>
        {loading ? <p>Loading...</p> : (
          <ul>
            {products.map(p => (
              <li key={p.id}>{p.name} - ${p.price}</li>
            ))}
          </ul>
        )}
      </div>
    );
  }
}

export default ProductList;
```

### Functional Component Example (Hooks)
```tsx
import React, { useState, useEffect } from 'react';
import { productService } from '@/services/productService';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load products on component mount
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await productService.getAllProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    const newProduct = await productService.createProduct({
      name: 'New Product',
      price: 50,
      category: 'shirt',
      description: 'Description',
      stock: 10
    });
    setProducts([...products, newProduct]);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Products</h1>
      <button onClick={handleAddProduct}>Add Product</button>
      
      {products.map(product => (
        <div key={product.id} className="product">
          <h3>{product.name}</h3>
          <p>${product.price}</p>
          <p>Stock: {product.stock}</p>
        </div>
      ))}
    </div>
  );
};

export default ProductList;
```

## Data Persistence

**Before (without database):** 
- Add product → Page refresh → Data lost ❌

**Now (with API services):**
- Add product → Saved to MySQL database → Page refresh → Data still there! ✓

## Error Handling

```tsx
try {
  const product = await productService.createProduct(data);
} catch (error) {
  if (error instanceof Error) {
    console.error('Error:', error.message);
  }
}
```

## Available Categories
```
- 'shirt'
- 'pants'
- 'jacket'
- 'shoes'
- 'accessories'
```

## Order Statuses
```
- 'pending'
- 'processing'
- 'shipped'
- 'delivered'
- 'cancelled'
```

## Important Notes

1. **Backend Must Be Running**
   ```bash
   cd "c:\Users\dhars\Downloads\mens hub front end"
   venv\Scripts\activate
   python manage.py runserver
   ```

2. **CORS is Configured** - Frontend (port 5173) can talk to Backend (port 8000)

3. **All Data is Persistent** - Every create/update/delete is saved to MySQL immediately

4. **Real-time Updates** - When you refresh the page, data from database loads automatically

## Example: Complete Product Form

```tsx
import React, { useState } from 'react';
import { productService } from '@/services/productService';

const ProductForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'shirt',
    stock: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await productService.createProduct({
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock)
      });
      // Product saved to database!
      alert('Product added successfully!');
      setFormData({
        name: '',
        description: '',
        price: '',
        category: 'shirt',
        stock: ''
      });
    } catch (error) {
      alert('Error adding product: ' + error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        name="name"
        placeholder="Product Name"
        value={formData.name}
        onChange={handleChange}
        required
      />
      <textarea
        name="description"
        placeholder="Description"
        value={formData.description}
        onChange={handleChange}
      />
      <input
        type="number"
        name="price"
        placeholder="Price"
        value={formData.price}
        onChange={handleChange}
        step="0.01"
        required
      />
      <select
        name="category"
        value={formData.category}
        onChange={handleChange}
      >
        <option value="shirt">Shirt</option>
        <option value="pants">Pants</option>
        <option value="jacket">Jacket</option>
        <option value="shoes">Shoes</option>
        <option value="accessories">Accessories</option>
      </select>
      <input
        type="number"
        name="stock"
        placeholder="Stock"
        value={formData.stock}
        onChange={handleChange}
        required
      />
      <button type="submit">Add Product to Database</button>
    </form>
  );
};

export default ProductForm;
```

## Troubleshooting

### "Failed to fetch" Error
- Make sure Django backend is running on http://localhost:8000
- Check that MySQL is running

### "CORS Error"
- Backend CORS is already configured
- Ensure frontend runs on port 5173 (Vite)

### Data Not Persisting
- Check if API call succeeded (check browser console)
- Verify backend received the data (Django admin)
- Restart browser

## Next Steps

1. ✓ Folder structure created
2. ✓ API services ready
3. Now update your components to use these services
4. All data will be saved to MySQL database!

---
**Important:** Replace all local state (useState for products/orders) with these API services for permanent data storage!
