# Generated migration for Cashfree payment and exchange system

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0009_alter_cart_unique_together_and_more'),
    ]

    operations = [
        # Add Cashfree payment fields to Order
        migrations.AddField(
            model_name='order',
            name='payment_id',
            field=models.CharField(blank=True, help_text='Cashfree payment ID', max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='order',
            name='payment_method',
            field=models.CharField(default='upi', help_text='upi, card, netbanking, etc', max_length=50),
        ),
        migrations.AlterField(
            model_name='order',
            name='status',
            field=models.CharField(
                choices=[('pending', 'Pending'), ('processing', 'Processing'), ('shipped', 'Shipped'), ('delivered', 'Delivered'), ('cancelled', 'Cancelled')],
                default='pending',
                max_length=20
            ),
        ),
        migrations.AddField(
            model_name='order',
            name='payment_status',
            field=models.CharField(
                choices=[('pending', 'Pending'), ('success', 'Success'), ('failed', 'Failed')],
                default='pending',
                max_length=20
            ),
        ),
        
        # Add exchange fields to Order
        migrations.AddField(
            model_name='order',
            name='is_delivered',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='order',
            name='delivered_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='order',
            name='exchange_eligible_until',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='order',
            name='exchange_status',
            field=models.CharField(
                choices=[('none', 'No exchange'), ('pending', 'Pending review'), ('approved', 'Approved'), ('rejected', 'Rejected'), ('completed', 'Completed')],
                default='none',
                max_length=20
            ),
        ),
        
        # Create ExchangeRequest model
        migrations.CreateModel(
            name='ExchangeRequest',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('product_id', models.IntegerField(help_text='Product ID from order items')),
                ('product_name', models.CharField(max_length=255)),
                ('size_old', models.CharField(help_text='Current size', max_length=50)),
                ('size_new', models.CharField(help_text='Requested size', max_length=50)),
                ('reason', models.CharField(
                    choices=[('too_small', 'Too Small'), ('too_large', 'Too Large'), ('size_mismatch', 'Size Mismatch')],
                    max_length=50
                )),
                ('reason_description', models.TextField(blank=True, help_text='Additional details')),
                ('status', models.CharField(
                    choices=[('pending', 'Pending Admin Review'), ('approved', 'Approved'), ('rejected', 'Rejected'), ('awaiting_return', 'Awaiting Return Shipment'), ('return_received', 'Return Received'), ('replacement_shipped', 'Replacement Shipped'), ('completed', 'Completed')],
                    default='pending',
                    max_length=50
                )),
                ('admin_comment', models.TextField(blank=True, help_text='Admin notes on approval/rejection')),
                ('return_label_url', models.URLField(blank=True, help_text='Shipping label for return')),
                ('replacement_tracking', models.CharField(blank=True, help_text='Tracking for replacement shipment', max_length=100)),
                ('requested_at', models.DateTimeField(auto_now_add=True)),
                ('approved_at', models.DateTimeField(blank=True, null=True)),
                ('return_received_at', models.DateTimeField(blank=True, null=True)),
                ('replacement_shipped_at', models.DateTimeField(blank=True, null=True)),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('order', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='exchange_requests', to='api.order')),
            ],
            options={
                'verbose_name_plural': 'Exchange Requests',
                'ordering': ['-requested_at'],
            },
        ),
    ]
