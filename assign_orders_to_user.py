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
    # Get the logged-in user (admin/staff)
    admin = User.objects.filter(username='mubarak.ali').first()
    if not admin:
        admin = User.objects.filter(is_staff=True).first()
    
    print(f"===== Assigning orders to: {admin.username} (ID: {admin.id}) =====")
    
    # Get all orders without a user
    orphan_orders = Order.objects.filter(user__isnull=True)
    print(f"Found {orphan_orders.count()} orders without a user")
    
    # Assign them to the admin user
    updated_count = orphan_orders.update(user=admin)
    print(f"Updated {updated_count} orders")
    
    # Also create some additional test orders with different statuses
    print("\nCreating additional test orders...")
    statuses = ['pending', 'processing', 'shipped', 'delivered']
    for i, status in enumerate(statuses):
        order_num = str(300000 + i)
        order, created = Order.objects.get_or_create(
            order_number=order_num,
            defaults={
                'user': admin,
                'customer_name': admin.first_name or admin.username,
                'customer_email': admin.email,
                'total_amount': 1500 + (i * 1000),
                'address': '123 Main St, Chennai',
                'pincode': '600002',
                'status': status,
            }
        )
        print(f"  {order.order_number}: {status} - ₹{order.total_amount} ({'NEW' if created else 'EXISTS'})")
    
    # Verify
    print(f"\n===== Verification =====")
    user_orders = Order.objects.filter(user=admin)
    print(f"Total orders for {admin.username}: {user_orders.count()}")
    for order in user_orders:
        print(f"  - {order.order_number}: {order.status}")
    
except Exception as e:
    import traceback
    traceback.print_exc()
