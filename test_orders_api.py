#!/usr/bin/env python
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_project.settings')
django.setup()

from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from api.models import Order
import requests

try:
    # Get the first admin user
    admin = User.objects.filter(is_staff=True).first()
    if not admin:
        admin = User.objects.first()
    
    if admin:
        print(f"===== User: {admin.username} =====")
        token, created = Token.objects.get_or_create(user=admin)
        print(f"Token: {token.key}")
        print(f"User ID: {admin.id}")
        
        # Check orders in DB
        user_orders = Order.objects.filter(user=admin)
        print(f"Orders in DB for this user: {user_orders.count()}")
        for order in user_orders:
            print(f"  - {order.id}: {order.order_number} - {order.status} - ₹{order.total_amount}")
        
        # Test the API
        print("\n===== Testing API =====")
        headers = {'Authorization': f'Token {token.key}'}
        response = requests.get('http://localhost:8000/api/orders/my_orders/', headers=headers)
        print(f"API Response Status: {response.status_code}")
        if response.ok:
            data = response.json()
            print(f"API returned {len(data)} orders")
            print(f"Response: {data}")
        else:
            print(f"Error response: {response.text}")
    else:
        print('No users found')
except Exception as e:
    import traceback
    print(f'Error: {e}')
    traceback.print_exc()
