import os
import django
from pathlib import Path

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_project.settings')
django.setup()

from api.models import Product

# Sample images from Unsplash (free public images)
SAMPLE_IMAGES = {
    'kaanchipuram silk': {
        'image_url': 'https://images.unsplash.com/photo-1618689944806-142f964d5ec1?w=600&h=800',
        'category_image': 'https://images.unsplash.com/photo-1618689944806-142f964d5ec1?w=200&h=200',
        'banner_image': 'https://images.unsplash.com/photo-1618689944806-142f964d5ec1?w=1200&h=400'
    },
    'saree': {
        'image_url': 'https://images.unsplash.com/photo-1604653894610-df63bc536371?w=600&h=800',
        'category_image': 'https://images.unsplash.com/photo-1604653894610-df63bc536371?w=200&h=200',
        'banner_image': 'https://images.unsplash.com/photo-1604653894610-df63bc536371?w=1200&h=400'
    }
}

print("🖼️  Updating products with image URLs...\n")

for name, images in SAMPLE_IMAGES.items():
    try:
        product = Product.objects.get(name=name)
        product.image_url = images['image_url']
        product.category_image = images['category_image']
        product.banner_image = images['banner_image']
        product.save()
        print(f"✅ Updated: {product.name}")
        print(f"   Image: {product.image_url[:50]}...")
        print()
    except Product.DoesNotExist:
        print(f"❌ Product '{name}' not found")

# Check all products
print("\n📦 All products after update:\n")
products = Product.objects.all()
for p in products:
    has_image = "✅" if p.image_url else "❌"
    print(f"{has_image} {p.id}: {p.name}")
    if p.image_url:
        print(f"    Image: {p.image_url[:50]}...")
