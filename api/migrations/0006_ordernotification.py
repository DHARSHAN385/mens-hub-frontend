# Generated migration for OrderNotification model

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0005_googleuser'),
    ]

    operations = [
        migrations.CreateModel(
            name='OrderNotification',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('customer_name', models.CharField(max_length=200)),
                ('customer_email', models.EmailField(max_length=254)),
                ('total_amount', models.DecimalField(decimal_places=2, max_digits=10)),
                ('items_count', models.IntegerField(default=0)),
                ('items_summary', models.JSONField(default=list, help_text='Summary of order items')),
                ('is_read', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('read_at', models.DateTimeField(blank=True, null=True)),
                ('order', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='notification', to='api.order')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
