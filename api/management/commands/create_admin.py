from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import UserProfile

class Command(BaseCommand):
    help = 'Create admin user for Mens Hub'
    
    def handle(self, *args, **options):
        # Admin credentials
        email = 'mubarak@menshub.com'
        password = 'S@kMf$34'
        name = 'Mubarak'
        
        # Check if user already exists
        if User.objects.filter(email=email).exists():
            self.stdout.write(
                self.style.WARNING(f'Admin user with email {email} already exists')
            )
            return
        
        try:
            # Create superuser
            user = User.objects.create_superuser(
                username=email.split('@')[0],
                email=email,
                password=password,
                first_name='Mubarak',
                last_name='Ali'
            )
            
            # Create user profile
            UserProfile.objects.create(
                user=user,
                is_admin=True,
                country_code='+91'
            )
            
            self.stdout.write(
                self.style.SUCCESS(f'[SUCCESS] Admin user created successfully')
            )
            self.stdout.write(f'  Email: {email}')
            self.stdout.write(f'  Password: {password}')
            self.stdout.write(f'  Username: {user.username}')
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'[ERROR] Failed to create admin user: {str(e)}')
            )
