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
    admin = User.objects.filter(is_staff=True).first()
    print(f"===== Checking User: {admin.username} (ID: {admin.id}) =====")
    
    # Check all orders
    all_orders = Order.objects.all()
    print(f"Total orders in DB: {all_orders.count()}")
    
    for order in all_orders:
        print(f"\nOrder #{order.id}:")
        print(f"  Order Number: {order.order_number}")
        print(f"  User ID: {order.user_id}")
        print(f"  User: {order.user}")
        print(f"  Customer Name: {order.customer_name}")
        print(f"  Status: {order.status}")
        print(f"  Total: ₹{order.total_amount}")
    
    print(f"\n===== Orders filtered by user ID {admin.id} =====")
    user_orders = Order.objects.filter(user=admin)
    print(f"Found: {user_orders.count()}")
    
except Exception as e:
    import traceback
    traceback.print_exc()
