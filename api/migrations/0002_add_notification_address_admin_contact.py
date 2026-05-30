# Generated migration for OrderNotification and AdminContact models

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),  # Update this to match your last migration
    ]

    operations = [
        # Add new fields to OrderNotification
        migrations.AddField(
            model_name='ordernotification',
            name='address',
            field=models.TextField(blank=True, help_text='Customer delivery address', null=True),
        ),
        migrations.AddField(
            model_name='ordernotification',
            name='pincode',
            field=models.CharField(blank=True, max_length=10, null=True),
        ),
        
        # Create AdminContact model
        migrations.CreateModel(
            name='AdminContact',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('admin_name', models.CharField(help_text='Name of the admin', max_length=200)),
                ('whatsapp_number', models.CharField(help_text='WhatsApp number with country code, e.g., +919876543210', max_length=15)),
                ('email', models.EmailField(blank=True, max_length=254, null=True)),
                ('phone', models.CharField(blank=True, max_length=15, null=True)),
                ('is_active', models.BooleanField(default=True, help_text='Is this contact currently active for support')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ['-is_active', '-created_at'],
            },
        ),
    ]
