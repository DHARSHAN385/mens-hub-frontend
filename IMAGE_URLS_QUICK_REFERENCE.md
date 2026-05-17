# 🎯 Quick Image URLs Reference

## 📍 Image URL Formats

### Development Server (localhost)
```
http://localhost:8000/media/kaanchipuram-silk.jpg
http://localhost:8000/media/shirt-premium.jpg
```

### Relative URLs (Recommended)
```
/media/kaanchipuram-silk.jpg
/media/shirt-premium.jpg
```

### Full Format
```
http://yourserver.com/media/image-filename.jpg
```

---

## 📸 Example Product Updates

### Example 1: Update Saree Product
```python
# Using Django shell
python manage.py shell

from api.models import Product

# Find the saree product
saree = Product.objects.get(id=1)

# Add images
saree.image_url = '/media/kaanchipuram-silk.jpg'
saree.category_image = '/media/sarees-thumbnail.jpg'
saree.banner_image = '/media/sarees-banner.jpg'
saree.save()

print(f"✅ Updated: {saree.name}")
```

### Example 2: Batch Update Multiple Products
```python
from api.models import Product

products_map = {
    1: {
        'image_url': '/media/saree-001.jpg',
        'category_image': '/media/sarees-thumb.jpg',
        'banner_image': '/media/sarees-banner.jpg'
    },
    2: {
        'image_url': '/media/shirt-001.jpg',
        'category_image': '/media/shirts-thumb.jpg',
        'banner_image': '/media/shirts-banner.jpg'
    }
}

for product_id, images in products_map.items():
    product = Product.objects.get(id=product_id)
    for field, url in images.items():
        setattr(product, field, url)
    product.save()
    print(f"✅ Updated product {product_id}")
```

---

## 🧪 Testing Images

### Test 1: Check Image File Exists
```bash
# List files in menshum_productpics/
ls -la menshum_productpics/

# Output should show your image files
# Example:
# kaanchipuram-silk.jpg
# shirt-premium.jpg
```

### Test 2: Check Image URL in Browser
```
http://localhost:8000/media/kaanchipuram-silk.jpg

# If image shows - ✅ Backend is serving images correctly
# If 404 - ❌ Check file path and Django settings
```

### Test 3: Check Product in Admin
```
1. Go to: http://localhost:8000/admin/api/product/
2. Click a product
3. Verify image_url field has value: /media/image.jpg
4. Click the URL - should show the image
```

### Test 4: Check API Response
```bash
# Get products via API
curl http://localhost:8000/api/products/1/

# Response should include:
# {
#   "id": 1,
#   "name": "Kaanchipuram Silk",
#   "image_url": "/media/kaanchipuram-silk.jpg",
#   "category_image": "/media/sarees-thumb.jpg",
#   "banner_image": "/media/sarees-banner.jpg",
#   ...
# }
```

### Test 5: Check Frontend Display
```tsx
// In React component
import { useEffect, useState } from 'react';
import { productService } from '@/services/productService';

export function TestProductImages() {
  const [product, setProduct] = useState(null);

  useEffect(() => {
    productService.getProduct(1).then(p => {
      console.log('Product:', p);
      console.log('Image URL:', p.image_url);
      setProduct(p);
    });
  }, []);

  return (
    <div>
      {product && (
        <>
          <img src={product.image_url} alt="test" />
          <p>URL: {product.image_url}</p>
        </>
      )}
    </div>
  );
}
```

---

## 🖥️ Frontend Component Example

```tsx
import { Product } from '@/services/productService';

interface ProductImageProps {
  product: Product;
}

export function ProductImage({ product }: ProductImageProps) {
  const getImageUrl = (url?: string) => {
    if (!url) return null;
    
    // Handle different URL formats
    if (url.startsWith('data:')) return url;          // Base64
    if (url.startsWith('http')) return url;           // Full URL
    if (url.startsWith('/')) return url;              // Relative path
    return `/media/${url}`;                            // Just filename
  };

  return (
    <div className="product-image-container">
      {/* Main Image */}
      {product.image_url && (
        <img
          src={getImageUrl(product.image_url)}
          alt={product.name}
          className="main-image"
          onError={(e) => {
            console.error('Image load failed:', product.image_url);
            e.currentTarget.src = '/fallback-image.jpg';
          }}
        />
      )}
      
      {/* Category Image (Thumbnail) */}
      {product.category_image && (
        <img
          src={getImageUrl(product.category_image)}
          alt={`${product.category} category`}
          className="category-thumbnail"
        />
      )}
      
      {/* Banner Image */}
      {product.banner_image && (
        <div className="banner">
          <img
            src={getImageUrl(product.banner_image)}
            alt={`${product.name} banner`}
            className="banner-image"
          />
        </div>
      )}
    </div>
  );
}
```

---

## 🔍 Troubleshooting Checklist

### Image Returns 404
```
❌ PROBLEM: http://localhost:8000/media/image.jpg returns 404

SOLUTION:
1. Check file exists: ls menshum_productpics/image.jpg
2. Check MEDIA_URL: grep MEDIA_URL backend_project/settings.py
3. Check MEDIA_ROOT: grep MEDIA_ROOT backend_project/settings.py
4. Restart Django: python manage.py runserver
```

### Image Shows as Broken in Admin
```
❌ PROBLEM: Image URL in admin doesn't load

SOLUTION:
1. Verify image file: ls -la menshum_productpics/
2. Check URL format: Should be /media/filename.jpg
3. Test in browser: http://localhost:8000/media/filename.jpg
4. Check DEBUG=True in settings
```

### Frontend Component Doesn't Show Image
```
❌ PROBLEM: Image doesn't display in React component

SOLUTION:
1. Check API response: curl http://localhost:8000/api/products/1/
2. Verify image_url exists in response
3. Check component img src attribute
4. Check browser console for errors
5. Test image URL directly in browser
```

---

## 📋 File Placement Guide

```
PROJECT_ROOT/
├── menshum_productpics/          ← Store images here
│   ├── kaanchipuram-silk.jpg
│   ├── shirt-premium.jpg
│   ├── jeans-001.jpg
│   └── ...
├── backend_project/
├── src/
├── api/
└── ...
```

---

## ✨ Image URL Examples in Database

After you update products, the database will store:

```sql
-- Product 1: Saree
UPDATE api_product SET 
  image_url = '/media/kaanchipuram-silk.jpg',
  category_image = '/media/sarees-thumb.jpg',
  banner_image = '/media/sarees-banner.jpg'
WHERE id = 1;

-- Product 2: Shirt
UPDATE api_product SET 
  image_url = '/media/shirt-premium.jpg',
  category_image = '/media/shirts-thumb.jpg'
WHERE id = 2;
```

---

## 🎬 Complete Test Flow

```
1. Add image to menshum_productpics/
   └─ menshum_productpics/test.jpg

2. Update product via admin or script
   └─ product.image_url = '/media/test.jpg'

3. Test image in browser
   └─ http://localhost:8000/media/test.jpg
   └─ Should display the image

4. Check API response
   └─ GET http://localhost:8000/api/products/1/
   └─ Should include image_url field

5. Display in component
   └─ <img src={product.image_url} />
   └─ Should show image in app
```

---

**All set! Start adding images now! 📸✨**
