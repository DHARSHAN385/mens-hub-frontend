#!/usr/bin/env python
"""Update product image URLs to use local /media/ paths"""

import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_project.settings')
django.setup()

from api.models import Product

# Update product URLs to use local media paths
updates = {
    'kaanchipuram silk': {
        'image_url': '/media/kaanchipuram-silk.jpg',
        'category_image': '/media/kaanchipuram-silk.jpg',
        'banner_image': '/media/kaanchipuram-silk.jpg',
    },
    'saree': {
        'image_url': '/media/saree.jpg',
        'category_image': '/media/saree.jpg',
        'banner_image': '/media/sarees-banner.jpg',
    },
}

print("🔄 Updating product URLs...")

for product_name, urls in updates.items():
    try:
        product = Product.objects.get(name=product_name)
        
        # Update fields
        for field, value in urls.items():
            setattr(product, field, value)
        
        product.save()
        print(f"✅ Updated: {product_name}")
        print(f"   - image_url: {product.image_url}")
        print(f"   - category_image: {product.category_image}")
        print(f"   - banner_image: {product.banner_image}")
        
    except Product.DoesNotExist:
        print(f"❌ Product not found: {product_name}")
    except Exception as e:
        print(f"❌ Error updating {product_name}: {e}")

print("\n✅ Database update complete!")
print("\n📋 Verify URLs in browser:")
print("   - http://localhost:8000/media/kaanchipuram-silk.jpg")
print("   - http://localhost:8000/media/saree.jpg")
