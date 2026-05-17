# Generated migration for Cart and Wishlist user-based storage

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('api', '0007_order_tracking_number_order_user_address_userprofile'),
    ]

    operations = [
        # Clear unique_together before removing fields
        migrations.AlterUniqueTogether(
            name='cart',
            unique_together=set(),
        ),
        migrations.AlterUniqueTogether(
            name='wishlist',
            unique_together=set(),
        ),
        # Remove old session-based Cart model's relations
        migrations.RemoveField(
            model_name='cart',
            name='product',
        ),
        migrations.RemoveField(
            model_name='cart',
            name='session_id',
        ),
        
        # Remove old session-based Wishlist model's relations
        migrations.RemoveField(
            model_name='wishlist',
            name='product',
        ),
        migrations.RemoveField(
            model_name='wishlist',
            name='session_id',
        ),
        
        # Add user field to Cart
        migrations.AddField(
            model_name='cart',
            name='user',
            field=models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='cart', to=settings.AUTH_USER_MODEL),
        ),
        
        # Add items_data field to Cart
        migrations.AddField(
            model_name='cart',
            name='items_data',
            field=models.JSONField(default=list, help_text='Cart items stored as JSON array'),
        ),
        
        # Add user field to Wishlist
        migrations.AddField(
            model_name='wishlist',
            name='user',
            field=models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='wishlist', to=settings.AUTH_USER_MODEL),
        ),
        
        # Add product_ids field to Wishlist
        migrations.AddField(
            model_name='wishlist',
            name='product_ids',
            field=models.JSONField(default=list, help_text='Product IDs in wishlist as JSON array'),
        ),
        
        # Alter model options for Cart
        migrations.AlterModelOptions(
            name='cart',
            options={'ordering': ['-updated_at']},
        ),
        
        # Alter model options for Wishlist
        migrations.AlterModelOptions(
            name='wishlist',
            options={'ordering': ['-updated_at'], 'verbose_name_plural': 'Wishlists'},
        ),
    ]

