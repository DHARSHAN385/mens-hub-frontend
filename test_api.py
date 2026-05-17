#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_project.settings')
django.setup()

from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from api.models import UserProfile
import requests

# Get or create admin user
admin_email = 'mubarak.ali@menshub.com'
try:
    admin_user = User.objects.get(email=admin_email)
    print(f"✓ Admin user found: {admin_user.username}")
except User.DoesNotExist:
    print("✗ Creating admin user...")
    admin_user = User.objects.create_user(
        username='admin',
        email=admin_email,
        password='S@kMf$34',
        is_staff=True
    )
    print(f"✓ Admin user created")

# Get or create token
token, created = Token.objects.get_or_create(user=admin_user)
print(f"✓ Token: {token.key}")

# Create or update profile
try:
    profile = UserProfile.objects.get(user=admin_user)
except UserProfile.DoesNotExist:
    profile = UserProfile.objects.create(user=admin_user, is_admin=True)

profile.is_admin = True
profile.save()
print(f"✓ Profile: is_admin=True")

# Test API with token
print("\n--- Testing Category Creation ---")
category_data = {
    'name': 'Test Category ' + str(int(1000 * __import__('random').random())),
    'img': ''
}

response = requests.post(
    'http://localhost:8000/api/categories/',
    json=category_data,
    headers={
        'Content-Type': 'application/json',
        'Authorization': f'Token {token.key}'
    }
)

print(f"Status Code: {response.status_code}")
print(f"Response: {response.text[:500]}")

if response.status_code == 201:
    print("✅ SUCCESS! Category created without base64 images")
else:
    print(f"❌ FAILED! Status: {response.status_code}")
