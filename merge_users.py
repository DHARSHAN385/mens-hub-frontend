import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_project.settings')
django.setup()

from api.models import User, Order, Address, Cart, Wishlist, UserProfile
from django.db.models import Count

duplicates = User.objects.values('email').annotate(count=Count('id')).filter(count__gt=1)
print('Duplicates:', list(duplicates))

for d in duplicates:
    users = list(User.objects.filter(email=d['email']).order_by('id'))
    primary_user = users[0]
    
    for dup_user in users[1:]:
        print(f"Merging user {dup_user.id} into {primary_user.id} ({d['email']})")
        
        # Merge Orders
        Order.objects.filter(user=dup_user).update(user=primary_user)
        
        # Merge Addresses
        Address.objects.filter(user=dup_user).update(user=primary_user)
        
        # Delete related singletons if they exist for duplicate user
        Cart.objects.filter(user=dup_user).delete()
        Wishlist.objects.filter(user=dup_user).delete()
        UserProfile.objects.filter(user=dup_user).delete()
        
        # Delete duplicate user
        dup_user.delete()

print("Merge complete.")
