from django.core.management.base import BaseCommand
from api.models import Category, Product, Banner


class Command(BaseCommand):
    help = 'Seed initial data for Mens Hub application'

    def handle(self, *args, **options):
        """Insert initial seed data into database."""
        
        # Do not seed if database already has categories or products to prevent recreating deleted items
        if Category.objects.exists() or Product.objects.exists():
            self.stdout.write(self.style.WARNING("Database already has categories or products. Skipping seeding."))
            return
            
        self.stdout.write("Starting seed data insertion...")
        
        # Create Categories
        categories_data = [
            {'name': 'Shirt', 'img': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500'},
            {'name': 'T-Shirt', 'img': 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=500'},
            {'name': 'Jeans', 'img': 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=500'},
            {'name': 'Slides', 'img': 'https://images.unsplash.com/photo-1519864600265-abb23847ef2c?w=500'},
            {'name': 'Shoes', 'img': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500'},
            {'name': 'Sunglasses', 'img': 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500'},
            {'name': 'Pants', 'img': 'https://images.unsplash.com/photo-1542272604-787c62d465d1?w=500'},
            {'name': 'Jacket', 'img': 'https://images.unsplash.com/photo-1551028719-00167b16ebc5?w=500'},
            {'name': 'Accessories', 'img': 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500'},
            {'name': 'Sarees', 'img': 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=500'},
        ]
            # Seed permanent notifications (example)
            # from api.models import Notification
            # notifications_data = [
            #     {'title': 'Order Placed', 'message': 'Your order has been placed successfully!', 'is_permanent': True},
            #     ...
            # ]
            # for notif in notifications_data:
            #     Notification.objects.get_or_create(title=notif['title'], defaults=notif)
            # self.stdout.write("✅ Permanent notifications created")
        
        for cat_data in categories_data:
            cat, created = Category.objects.get_or_create(
                name=cat_data['name'],
                defaults={'img': cat_data['img']}
            )
            if created:
                self.stdout.write(f"  [OK] Created category: {cat.name}")
        
        self.stdout.write("[OK] Categories created")
        
        # Create Products
        products_data = [
            # Shirts
            {
                'name': 'Classic Cotton T-Shirt',
                'description': 'Premium quality 100% cotton t-shirt, perfect for everyday wear',
                'price': '29.99',
                'category': 'shirt',
                'image_url': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
                'stock': 100,
                'sizes': ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
                'popularity': 95,
                'featured': True,
            },
            {
                'name': 'Premium Formal Shirt',
                'description': 'Elegant formal shirt for professional occasions',
                'price': '59.99',
                'category': 'shirt',
                'image_url': 'https://images.unsplash.com/photo-1596399268928-a3e34fafcf76?w=400',
                'stock': 50,
                'sizes': ['S', 'M', 'L', 'XL'],
                'popularity': 80,
                'featured': True,
            },
            {
                'name': 'Casual Striped Shirt',
                'description': 'Comfortable striped shirt for casual outings',
                'price': '39.99',
                'category': 'shirt',
                'image_url': 'https://images.unsplash.com/photo-1589932870064-ca96c2b34bbe?w=400',
                'stock': 75,
                'sizes': ['M', 'L', 'XL', 'XXL'],
                'popularity': 70,
                'featured': False,
            },
            # Pants
            {
                'name': 'Blue Denim Jeans',
                'description': 'Classic blue denim jeans, timeless style',
                'price': '69.99',
                'category': 'pants',
                'image_url': 'https://images.unsplash.com/photo-1542272604-787c62d465d1?w=400',
                'stock': 80,
                'sizes': ['28', '30', '32', '34', '36', '38'],
                'popularity': 92,
                'featured': True,
            },
            {
                'name': 'Chino Pants',
                'description': 'Versatile chino pants for business casual',
                'price': '54.99',
                'category': 'pants',
                'image_url': 'https://images.unsplash.com/photo-1473966895367-ab63b27d8b16?w=400',
                'stock': 60,
                'sizes': ['30', '32', '34', '36'],
                'popularity': 75,
                'featured': False,
            },
            # Jackets
            {
                'name': 'Leather Jacket',
                'description': 'Premium leather jacket for a bold statement',
                'price': '199.99',
                'category': 'jacket',
                'image_url': 'https://images.unsplash.com/photo-1551028719-00167b16ebc5?w=400',
                'stock': 30,
                'sizes': ['S', 'M', 'L', 'XL'],
                'popularity': 88,
                'featured': True,
            },
            {
                'name': 'Casual Bomber Jacket',
                'description': 'Lightweight bomber jacket for everyday style',
                'price': '89.99',
                'category': 'jacket',
                'image_url': 'https://images.unsplash.com/photo-1611312732133-d2c4a52b8ab5?w=400',
                'stock': 45,
                'sizes': ['XS', 'S', 'M', 'L', 'XL'],
                'popularity': 72,
                'featured': False,
            },
            # Shoes
            {
                'name': 'Running Sneakers',
                'description': 'Comfortable running shoes with excellent cushioning',
                'price': '119.99',
                'category': 'shoes',
                'image_url': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
                'stock': 100,
                'sizes': ['6', '7', '8', '9', '10', '11', '12', '13'],
                'popularity': 98,
                'featured': True,
            },
            {
                'name': 'Formal Dress Shoes',
                'description': 'Elegant formal shoes for special occasions',
                'price': '149.99',
                'category': 'shoes',
                'image_url': 'https://images.unsplash.com/photo-1543163521-9efcc062b169?w=400',
                'stock': 40,
                'sizes': ['7', '8', '9', '10', '11', '12'],
                'popularity': 65,
                'featured': False,
            },
            {
                'name': 'Casual Slip-ons',
                'description': 'Comfortable slip-on shoes for casual wear',
                'price': '79.99',
                'category': 'shoes',
                'image_url': 'https://images.unsplash.com/photo-1604505209341-4ab8532fcc4d?w=400',
                'stock': 70,
                'sizes': ['7', '8', '9', '10', '11'],
                'popularity': 78,
                'featured': False,
            },
            # Accessories
            {
                'name': 'Leather Belt',
                'description': 'Premium leather belt for everyday use',
                'price': '39.99',
                'category': 'accessories',
                'image_url': 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400',
                'stock': 150,
                'sizes': ['S', 'M', 'L'],
                'popularity': 85,
                'featured': True,
            },
            {
                'name': 'Wool Scarf',
                'description': 'Warm wool scarf for winter',
                'price': '29.99',
                'category': 'accessories',
                'image_url': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
                'stock': 120,
                'sizes': ['One Size'],
                'popularity': 60,
                'featured': False,
            },
        ]
        
        for prod_data in products_data:
            cat_name = prod_data.get('category')
            cat_map = {
                'shirt': 'Shirt',
                'tshirt': 'T-Shirt',
                'jeans': 'Jeans',
                'slides': 'Slides',
                'shoes': 'Shoes',
                'sunglass': 'Sunglasses',
                'pants': 'Pants',
                'jacket': 'Jacket',
                'accessories': 'Accessories',
                'sarees': 'Sarees',
            }
            mapped_cat_name = cat_map.get(cat_name, cat_name.capitalize() if cat_name else 'Shirt')
            category_obj, _ = Category.objects.get_or_create(name=mapped_cat_name)
            
            defaults_data = prod_data.copy()
            defaults_data['category'] = category_obj
            defaults_data['category_temp'] = cat_name

            prod, created = Product.objects.get_or_create(
                name=prod_data['name'],
                defaults=defaults_data
            )
            if created:
                self.stdout.write(f"  [OK] Created product: {prod.name}")
        
        self.stdout.write("[OK] Products created")
        
        # Create Banners
        banners_data = [
            {
                'image_url': 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200',
                'title': 'Summer Collection',
                'description': 'Check out our latest summer collection',
                'is_active': True,
            },
            {
                'image_url': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200',
                'title': 'New Arrivals',
                'description': 'Fresh styles just arrived',
                'is_active': True,
            },
            {
                'image_url': 'https://images.unsplash.com/photo-1604653894610-df63bc536371?w=1200',
                'title': 'Sale Now Live',
                'description': 'Up to 50% off on selected items',
                'is_active': True,
            },
        ]
        
        for banner_data in banners_data:
            banner, created = Banner.objects.get_or_create(
                title=banner_data['title'],
                defaults=banner_data
            )
            if created:
                self.stdout.write(f"  [OK] Created banner: {banner.title}")
        
        self.stdout.write("[OK] Banners created")
        self.stdout.write(self.style.SUCCESS("\n[SUCCESS] Seed data completed successfully!"))
