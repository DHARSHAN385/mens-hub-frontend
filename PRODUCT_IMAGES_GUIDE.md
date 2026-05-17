# Product Images - Complete Guide

## 🖼️ New Image Fields Added

Your Product model now supports **3 types of images**, all saved permanently in MySQL:

```
Product Images:
├── image_url          → Product image
├── category_image     → Category/thumbnail image  
└── banner_image       → Banner/hero image
```

---

## 📊 Database Schema Updated

### New Columns Added to `api_product` Table

```sql
Column            | Type    | Description
─────────────────────────────────────────
image_url         | VARCHAR | Product image URL
category_image    | VARCHAR | Category image URL
banner_image      | VARCHAR | Banner image URL
```

All fields are **optional and persistent** in MySQL database! ✅

---

## 🚀 Using the New Image Fields

### Create Product with All Images

```tsx
import { productService } from '@/services/productService';

const newProduct = await productService.createProduct({
  name: 'Premium T-Shirt',
  description: 'High quality cotton T-shirt',
  price: 29.99,
  category: 'shirt',
  stock: 100,
  image_url: 'https://example.com/tshirt.jpg',
  category_image: 'https://example.com/shirt-category.jpg',
  banner_image: 'https://example.com/tshirt-banner.jpg'
});
```

### Get Product with Images

```tsx
const product = await productService.getProduct(1);

console.log(product.image_url);        // Product image
console.log(product.category_image);   // Category image
console.log(product.banner_image);     // Banner image
```

### Update Images

```tsx
await productService.updateProduct(1, {
  image_url: 'https://example.com/new-image.jpg',
  banner_image: 'https://example.com/new-banner.jpg'
});
```

---

## 💾 TypeScript Interface Updated

```tsx
interface Product {
  id?: number;
  name: string;
  description: string;
  price: number | string;
  category: 'shirt' | 'pants' | 'jacket' | 'shoes' | 'accessories';
  image_url?: string;              // ✅ Product image
  category_image?: string;         // ✅ Category image
  banner_image?: string;           // ✅ Banner image
  stock?: number;
  created_at?: string;
  updated_at?: string;
}
```

---

## 🎨 React Component Examples

### Display Product with All Images

```tsx
import React, { useState, useEffect } from 'react';
import { productService } from '@/services/productService';

const ProductCard = ({ productId }) => {
  const [product, setProduct] = useState(null);

  useEffect(() => {
    productService.getProduct(productId).then(setProduct);
  }, [productId]);

  if (!product) return <div>Loading...</div>;

  return (
    <div className="product-card">
      {/* Banner Image */}
      {product.banner_image && (
        <div className="banner">
          <img src={product.banner_image} alt="Banner" />
        </div>
      )}

      {/* Product Image */}
      <div className="product-image">
        <img src={product.image_url} alt={product.name} />
      </div>

      {/* Category Image */}
      {product.category_image && (
        <div className="category-badge">
          <img src={product.category_image} alt="Category" />
        </div>
      )}

      <h3>{product.name}</h3>
      <p>${product.price}</p>
    </div>
  );
};

export default ProductCard;
```

### Product Form with Images

```tsx
import React, { useState } from 'react';
import { productService } from '@/services/productService';

const ProductForm = () => {
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'shirt',
    stock: '',
    image_url: '',
    category_image: '',
    banner_image: ''
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const newProduct = await productService.createProduct({
        ...form,
        price: parseFloat(form.price),
        stock: parseInt(form.stock)
      });
      
      console.log('Product created:', newProduct);
      console.log('Images saved to database:');
      console.log('- Product image:', newProduct.image_url);
      console.log('- Category image:', newProduct.category_image);
      console.log('- Banner image:', newProduct.banner_image);
      
      // Reset form
      setForm({
        name: '',
        description: '',
        price: '',
        category: 'shirt',
        stock: '',
        image_url: '',
        category_image: '',
        banner_image: ''
      });
      
    } catch (error) {
      console.error('Error creating product:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        name="name"
        placeholder="Product Name"
        value={form.name}
        onChange={handleChange}
        required
      />

      <textarea
        name="description"
        placeholder="Description"
        value={form.description}
        onChange={handleChange}
      />

      <input
        type="number"
        name="price"
        placeholder="Price"
        value={form.price}
        onChange={handleChange}
        step="0.01"
        required
      />

      <select
        name="category"
        value={form.category}
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
        value={form.stock}
        onChange={handleChange}
        required
      />

      <h4>Images (URLs)</h4>
      
      <input
        type="url"
        name="image_url"
        placeholder="Product Image URL"
        value={form.image_url}
        onChange={handleChange}
      />

      <input
        type="url"
        name="category_image"
        placeholder="Category Image URL"
        value={form.category_image}
        onChange={handleChange}
      />

      <input
        type="url"
        name="banner_image"
        placeholder="Banner Image URL"
        value={form.banner_image}
        onChange={handleChange}
      />

      <button type="submit">
        Add Product to Database (with Images)
      </button>
    </form>
  );
};

export default ProductForm;
```

---

## 📱 Gallery Component Example

```tsx
import React, { useState, useEffect } from 'react';
import { productService } from '@/services/productService';

const ProductGallery = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    productService.getAllProducts().then(setProducts);
  }, []);

  return (
    <div className="gallery">
      <div className="banners">
        {products.map(product => (
          product.banner_image && (
            <div key={product.id} className="banner-item">
              <img src={product.banner_image} alt={product.name} />
              <h3>{product.name}</h3>
            </div>
          )
        ))}
      </div>

      <div className="products">
        {products.map(product => (
          <div key={product.id} className="product-item">
            {product.image_url && (
              <img 
                src={product.image_url} 
                alt={product.name}
                className="product-image"
              />
            )}
            {product.category_image && (
              <img 
                src={product.category_image} 
                alt="Category"
                className="category-badge"
              />
            )}
            <h4>{product.name}</h4>
            <p>${product.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductGallery;
```

---

## 🛠️ Django Admin Usage

### View Products with Images in Admin Panel

1. Go to: `http://localhost:8000/admin`
2. Click on "Products"
3. Click "Add Product" or edit existing
4. Fill in the image URLs:
   - **Product Image** - Main product photo
   - **Category Image** - Category thumbnail
   - **Banner Image** - Hero/banner image
5. Click "Save" → Images saved to database! ✅

---

## 🔄 API Endpoints

### Get All Products (with images)
```
GET /api/products/
```

Response includes all images:
```json
{
  "id": 1,
  "name": "T-Shirt",
  "price": "29.99",
  "image_url": "https://...",
  "category_image": "https://...",
  "banner_image": "https://...",
  ...
}
```

### Create Product (with images)
```
POST /api/products/

{
  "name": "T-Shirt",
  "price": "29.99",
  "image_url": "https://example.com/shirt.jpg",
  "category_image": "https://example.com/shirt-category.jpg",
  "banner_image": "https://example.com/banner.jpg",
  ...
}
```

### Update Images Only
```
PUT /api/products/1/

{
  "banner_image": "https://example.com/new-banner.jpg"
}
```

---

## 💾 Data Persistence

All images are **permanently stored in MySQL database**:

```
Before: Product + Images → Refresh → Lost ❌
After: Product + Images → Saved in DB → Refresh → Still there ✅
```

---

## 📸 Image URL Sources

You can use image URLs from:
- ✅ External URLs (Cloudinary, Imgur, etc.)
- ✅ Your own server
- ✅ CDN services
- ✅ Public image databases

Example sources:
```
https://images.unsplash.com/...
https://via.placeholder.com/...
https://your-domain.com/images/...
https://cdn.example.com/...
```

---

## 🎯 Best Practices

### 1. Always Use HTTPS URLs
```tsx
// ✅ Good
image_url: 'https://example.com/image.jpg'

// ❌ Bad
image_url: 'http://example.com/image.jpg'
```

### 2. Add Fallback Images
```tsx
<img 
  src={product.image_url || 'https://via.placeholder.com/300'} 
  alt={product.name}
/>
```

### 3. Validate URLs Before Saving
```tsx
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

if (isValidUrl(form.image_url)) {
  await productService.createProduct(form);
}
```

### 4. Handle Missing Images
```tsx
const ProductImage = ({ src, alt }) => {
  const [error, setError] = useState(false);

  if (error) {
    return <div className="no-image">No image available</div>;
  }

  return (
    <img 
      src={src} 
      alt={alt}
      onError={() => setError(true)}
    />
  );
};
```

---

## ✅ Migration Complete

Your Product model now has:
- ✅ Product image field
- ✅ Category image field
- ✅ Banner image field
- ✅ All persisted in MySQL
- ✅ Ready to use in components
- ✅ Admin panel configured

---

## 🚀 Quick Start

### 1. Create Product with Images
```tsx
const product = await productService.createProduct({
  name: 'Blue T-Shirt',
  price: 29.99,
  category: 'shirt',
  description: 'Premium cotton',
  stock: 100,
  image_url: 'https://example.com/shirt.jpg',
  category_image: 'https://example.com/category.jpg',
  banner_image: 'https://example.com/banner.jpg'
});
```

### 2. Display in Component
```tsx
<img src={product.image_url} alt={product.name} />
<img src={product.banner_image} alt="Banner" />
<img src={product.category_image} alt="Category" />
```

### 3. Refresh Page → Images Still There! ✅

---

## 📞 API Response Example

```json
{
  "id": 1,
  "name": "Premium T-Shirt",
  "description": "High quality cotton T-shirt",
  "price": "29.99",
  "category": "shirt",
  "image_url": "https://example.com/shirt.jpg",
  "category_image": "https://example.com/shirt-category.jpg",
  "banner_image": "https://example.com/shirt-banner.jpg",
  "stock": 100,
  "created_at": "2026-05-06T10:30:00Z",
  "updated_at": "2026-05-06T10:30:00Z"
}
```

---

**All image data saved permanently to MySQL database!** ✅
**Use in any React component!** 🚀
**No data loss on refresh!** 💾
