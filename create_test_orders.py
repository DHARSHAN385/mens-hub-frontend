#!/usr/bin/env python
import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_project.settings')
django.setup()

from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from api.models import Order
import requests

try:
    # Create a test user
    test_user, created = User.objects.get_or_create(username='testcustomer', defaults={'email': 'testcustomer@test.com'})
    token, created = Token.objects.get_or_create(user=test_user)
    
    print(f"===== Test User: {test_user.username} (ID: {test_user.id}) =====")
    print(f"Token: {token.key}")
    print(f"Is Staff: {test_user.is_staff}")
    
    # Check existing orders for this user
    existing_orders = Order.objects.filter(user=test_user)
    print(f"Existing orders for test user: {existing_orders.count()}")
    
    # Create some test orders for this user
    print("\nCreating test orders...")
    for i in range(3):
        order_num = f'{100000 + i}'  # 6-digit numbers
        order, created = Order.objects.get_or_create(
            order_number=order_num,
            defaults={
                'user': test_user,
                'customer_name': f'Test Customer {i+1}',
                'customer_email': f'customer{i+1}@test.com',
                'total_amount': 1000 + (i * 500),
                'address': f'{i+1}00 Main St, Chennai',
                'pincode': f'60000{i}',
                'status': ['pending', 'shipped', 'delivered'][i],
            }
        )
        print(f"  Created: {order.order_number} ({'NEW' if created else 'EXISTS'})")
    
    # Test the API
    print("\n===== Testing API with test user =====")
    headers = {'Authorization': f'Token {token.key}'}
    response = requests.get('http://localhost:8000/api/orders/my_orders/', headers=headers)
    print(f"API Response Status: {response.status_code}")
    if response.ok:
        data = response.json()
        print(f"API returned {len(data)} orders")
        for order in data:
            print(f"  - {order['order_number']}: {order['status']} - ₹{order['total_amount']}")
    else:
        print(f"Error: {response.text}")
    
except Exception as e:
    import traceback
    traceback.print_exc()
