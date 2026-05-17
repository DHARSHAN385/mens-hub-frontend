import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_project.settings')
django.setup()

from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
import requests

# Get admin token
admin_user = User.objects.get(email='mubarak.ali@menshub.com')
token = Token.objects.get(user=admin_user)

# Create a small base64 image for testing
small_base64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

print("--- Testing with base64 image ---")
category_data = {
    'name': 'Base64 Test Category',
    'img': small_base64  # Send base64 image
}

response = requests.post(
    'http://localhost:8000/api/categories/',
    json=category_data,
    headers={
        'Content-Type': 'application/json',
        'Authorization': f'Token {token.key}'
    }
)

print(f"Status: {response.status_code}")
if response.status_code in [200, 201]:
    print("✅ Base64 images ARE ACCEPTED by the backend!")
    data = response.json()
    print(f"Created category with ID: {data['id']}")
else:
    print(f"Response: {response.text[:300]}")
