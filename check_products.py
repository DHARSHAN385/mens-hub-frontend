import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_project.settings')
django.setup()

from api.models import Product

products = Product.objects.all()[:5]
print(f"\n📦 Checking {len(products)} products:\n")
for p in products:
    print(f"ID: {p.id}")
    print(f"  Name: {p.name}")
    print(f"  Image URL: {p.image_url}")
    print(f"  Category Image: {p.category_image}")
    print(f"  Banner Image: {p.banner_image}")
    print()
