#!/usr/bin/env python
import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_project.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Order

try:
    # Find chandra user
    chandra = User.objects.filter(username='chandra').first()
    
    if chandra:
        print(f"===== Found user: {chandra.username} (ID: {chandra.id}) =====")
        print(f"Email: {chandra.email}")
        print(f"Is Staff: {chandra.is_staff}")
        
        # Create test orders for chandra
        print("\nCreating test orders for chandra...")
        statuses = ['pending', 'processing', 'shipped', 'delivered']
        for i, status in enumerate(statuses):
            order_num = str(400000 + i)
            order, created = Order.objects.get_or_create(
                order_number=order_num,
                defaults={
                    'user': chandra,
                    'customer_name': chandra.first_name or chandra.username,
                    'customer_email': chandra.email,
                    'total_amount': 2000 + (i * 1500),
                    'address': '456 Oak St, Chennai',
                    'pincode': '600003',
                    'status': status,
                }
            )
            print(f"  {order.order_number}: {status} - ₹{order.total_amount} ({'NEW' if created else 'EXISTS'})")
        
        # Verify
        print(f"\n===== Verification =====")
        user_orders = Order.objects.filter(user=chandra)
        print(f"Total orders for {chandra.username}: {user_orders.count()}")
        for order in user_orders:
            print(f"  - {order.order_number}: {order.status}")
    else:
        # List all users
        print("chandra not found. Available users:")
        for user in User.objects.all():
            print(f"  - {user.username} (ID: {user.id}, Is Staff: {user.is_staff})")
        
except Exception as e:
    import traceback
    traceback.print_exc()
