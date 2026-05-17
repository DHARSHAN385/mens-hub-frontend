"""
Product Image Management Script
================================
This script helps you:
1. Add image URLs to existing products
2. Find products without images
3. Batch update product images

Usage:
    python manage_product_images.py
"""

import os
import django
from pathlib import Path

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_project.settings')
django.setup()

from api.models import Product

def list_products_without_images():
    """Show all products that don't have images."""
    print("\n📸 Products Without Images:\n")
    products = Product.objects.filter(image_url__isnull=True) | Product.objects.filter(image_url='')
    
    if not products.exists():
        print("✅ All products have images!")
        return
    
    for product in products:
        print(f"  ID: {product.id} | Name: {product.name} | Category: {product.category}")
    
    print(f"\nTotal products without images: {products.count()}")

def update_product_image(product_id, image_url, category_image=None, banner_image=None):
    """Update a single product with image URLs."""
    try:
        product = Product.objects.get(id=product_id)
        product.image_url = image_url
        if category_image:
            product.category_image = category_image
        if banner_image:
            product.banner_image = banner_image
        product.save()
        print(f"✅ Updated product '{product.name}' (ID: {product.id})")
        return True
    except Product.DoesNotExist:
        print(f"❌ Product with ID {product_id} not found")
        return False

def list_all_products():
    """Show all products with their current image status."""
    print("\n📦 All Products:\n")
    products = Product.objects.all()
    
    for product in products:
        image_status = "✅ Has Image" if product.image_url else "❌ No Image"
        print(f"  [{product.id}] {product.name}")
        print(f"      Category: {product.category} | Price: ₹{product.price}")
        print(f"      {image_status}")
        print()

def interactive_update():
    """Interactive mode to update product images."""
    print("\n🎯 Interactive Product Image Update\n")
    
    try:
        product_id = int(input("Enter Product ID: "))
    except ValueError:
        print("❌ Invalid product ID")
        return
    
    try:
        product = Product.objects.get(id=product_id)
        print(f"\n📦 Product: {product.name}")
        print(f"   Current Image: {product.image_url or 'None'}")
        print(f"   Current Category Image: {product.category_image or 'None'}")
        print(f"   Current Banner Image: {product.banner_image or 'None'}")
    except Product.DoesNotExist:
        print(f"❌ Product with ID {product_id} not found")
        return
    
    image_url = input("\nEnter new image URL (or leave blank to skip): ").strip()
    category_image = input("Enter category image URL (or leave blank to skip): ").strip()
    banner_image = input("Enter banner image URL (or leave blank to skip): ").strip()
    
    if not image_url and not category_image and not banner_image:
        print("❌ No images to update")
        return
    
    if image_url:
        product.image_url = image_url
    if category_image:
        product.category_image = category_image
    if banner_image:
        product.banner_image = banner_image
    
    product.save()
    print(f"\n✅ Product '{product.name}' updated successfully!")

def batch_update_from_folder():
    """Update products with images from menshum_productpics folder."""
    print("\n📁 Batch Update from menshum_productpics Folder\n")
    
    folder_path = Path(__file__).parent / 'menshum_productpics'
    
    if not folder_path.exists():
        print(f"❌ Folder not found: {folder_path}")
        return
    
    image_files = list(folder_path.glob('*.*'))
    if not image_files:
        print("❌ No image files found in menshum_productpics/")
        return
    
    print(f"📸 Found {len(image_files)} image files:\n")
    
    for i, image_file in enumerate(image_files, 1):
        filename = image_file.name
        image_url = f'/media/{filename}'
        print(f"  {i}. {filename}")
        print(f"     URL: {image_url}")
    
    print("\n⚠️  Note: You need to manually assign these images to products")
    print("    Or provide a mapping file (product_id -> image_filename)")

def example_updates():
    """Show example usage."""
    print("\n📚 Example Usage:\n")
    
    examples = [
        {
            "description": "Update single product",
            "code": "update_product_image(1, '/media/saree-001.jpg', '/media/saree-thumb.jpg')"
        },
        {
            "description": "Update product with just main image",
            "code": "update_product_image(2, '/media/shirt-001.jpg')"
        },
        {
            "description": "Find products without images",
            "code": "list_products_without_images()"
        },
        {
            "description": "Show all products",
            "code": "list_all_products()"
        },
    ]
    
    for example in examples:
        print(f"  • {example['description']}:")
        print(f"    >>> {example['code']}")
        print()

def main():
    """Main menu."""
    while True:
        print("\n" + "="*50)
        print("🖼️  Product Image Management")
        print("="*50)
        print("\nOptions:")
        print("  1. List all products")
        print("  2. List products without images")
        print("  3. Update product image (interactive)")
        print("  4. Check menshum_productpics folder")
        print("  5. Show examples")
        print("  0. Exit")
        
        choice = input("\nEnter your choice (0-5): ").strip()
        
        if choice == '0':
            print("\n👋 Goodbye!")
            break
        elif choice == '1':
            list_all_products()
        elif choice == '2':
            list_products_without_images()
        elif choice == '3':
            interactive_update()
        elif choice == '4':
            batch_update_from_folder()
        elif choice == '5':
            example_updates()
        else:
            print("❌ Invalid choice. Please try again.")

if __name__ == '__main__':
    print("\n" + "="*50)
    print("Product Image Management Tool")
    print("="*50)
    main()
