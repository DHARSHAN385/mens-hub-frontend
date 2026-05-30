#!/usr/bin/env python
"""Fix admin user permissions"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_project.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import UserProfile
from rest_framework.authtoken.models import Token

# Create superuser if doesn't exist
admin_user, created = User.objects.get_or_create(
    username='admin',
    defaults={
        'email': 'admin@menshub.com',
        'is_staff': True,
        'is_superuser': True,
        'first_name': 'Admin',
    }
)
if created:
    admin_user.set_password('admin123')
    admin_user.save()
    print("✅ Admin user created: username=admin, password=admin123")
else:
    print("✅ Admin user already exists")

# Ensure admin has a token
token, created = Token.objects.get_or_create(user=admin_user)
print(f"✅ Admin token: {token.key}")

# Make sure menshubadmin01 is staff if it exists
try:
    user = User.objects.get(username='menshubadmin01')
    if not user.is_staff:
        user.is_staff = True
        user.save()
        print(f"✅ Made menshubadmin01 a staff member")
    
    # Ensure token exists
    token, created = Token.objects.get_or_create(user=user)
    print(f"✅ Token for menshubadmin01: {token.key}")
except User.DoesNotExist:
    print("ℹ️  menshubadmin01 doesn't exist yet (will be created on login)")

# Make sure admin has UserProfile with is_admin=True
profile, _ = UserProfile.objects.get_or_create(user=admin_user)
if not profile.is_admin:
    profile.is_admin = True
    profile.save()
    print("✅ Admin marked as is_admin in UserProfile")

print("\n✅ All fixes applied successfully!")
