import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_project.settings')
django.setup()

from api.models import Product
from rest_framework.test import APIRequestFactory
from api.serializers import ProductSerializer

print("✅ Testing Product API Response\n")

products = Product.objects.all()
for p in products:
    serializer = ProductSerializer(p)
    data = serializer.data
    
    print(f"📦 Product ID {data['id']}: {data['name']}")
    print(f"   Price: ₹{data['price']}")
    print(f"   Image URL: {data.get('image_url', 'NONE')}")
    print(f"   Category Image: {data.get('category_image', 'NONE')}")
    print(f"   Banner Image: {data.get('banner_image', 'NONE')}")
    print()

# Test JSON serialization
print("\n✅ JSON API Response Sample:\n")
product = Product.objects.first()
if product:
    serializer = ProductSerializer(product)
    print(json.dumps(serializer.data, indent=2))
