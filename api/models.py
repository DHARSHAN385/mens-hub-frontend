from django.db import models
from django.contrib.auth.models import User
import uuid
import random

# Create your models here.

class GoogleUser(models.Model):
    """CustomUser model for Google OAuth authentication."""
    id = models.AutoField(primary_key=True)
    google_id = models.CharField(max_length=255, unique=True)
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=200)
    picture = models.URLField(blank=True, null=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='google_user', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} ({self.email})"


class UserProfile(models.Model):
    """Extended user profile to store additional user information."""
    id = models.AutoField(primary_key=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone = models.CharField(max_length=15, blank=True, null=True)
    country_code = models.CharField(max_length=5, default='+91')
    is_admin = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Profile for {self.user.email}"


class Category(models.Model):
    """Category model for product categories."""
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100, unique=True)
    img = models.TextField(blank=True, null=True, help_text="Image URL or base64 data URL")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        verbose_name_plural = "Categories"
        
    def __str__(self):
        return self.name


class Product(models.Model):
    """Product model for mens wear items."""
    CATEGORY_CHOICES = [
        ('shirt', 'Shirt'),
        ('tshirt', 'T-Shirt'),
        ('jeans', 'Jeans'),
        ('slides', 'Slides'),
        ('shoes', 'Shoes'),
        ('sunglass', 'Sunglasses'),
        ('pants', 'Pants'),
        ('jacket', 'Jacket'),
        ('accessories', 'Accessories'),
        ('sarees', 'Sarees'),
    ]
    
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=200)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    category_temp = models.CharField(max_length=50, db_index=True, null=True, blank=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products', db_index=True, null=True, blank=True)
    image_url = models.TextField(blank=True, null=True, help_text="Image URL or base64 data URL")
    images = models.JSONField(default=list, blank=True)
    stock = models.IntegerField(default=0)
    sizes = models.JSONField(default=list, blank=True)
    custom_designs = models.JSONField(default=list, blank=True, help_text="List of design image URLs for Stone Shirts")
    color_patterns = models.JSONField(default=list, blank=True, help_text="List of available color patterns for Stone Shirts")
    popularity = models.IntegerField(default=0, db_index=True)
    featured = models.BooleanField(default=False, db_index=True)
    in_stock = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        
    def __str__(self):
        return self.name


class Order(models.Model):
    """Order model for customer orders."""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('packed', 'Packed'),
        ('shipped', 'Shipped'),
        ('out_for_delivery', 'Out for Delivery'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]
    
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('success', 'Success'),
        ('failed', 'Failed'),
    ]
    
    EXCHANGE_STATUS_CHOICES = [
        ('none', 'No exchange'),
        ('pending', 'Pending review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed'),
    ]
    
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    order_number = models.CharField(max_length=6, unique=True, blank=True, null=True, help_text="Auto-generated 6-digit order number")
    customer_name = models.CharField(max_length=200)
    customer_email = models.EmailField()
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    address = models.TextField(blank=True, null=True)
    pincode = models.CharField(max_length=6, blank=True, null=True, help_text="6-digit pincode - user enters")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    items = models.JSONField(default=list, help_text="Order items as JSON array")
    tracking_number = models.CharField(max_length=100, blank=True, null=True)
    phone = models.CharField(max_length=15, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    
    # Payment fields
    payment_id = models.CharField(max_length=100, blank=True, null=True, help_text="Cashfree payment ID")
    payment_method = models.CharField(max_length=50, default='upi', help_text="upi, card, netbanking, etc")
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    
    # Exchange fields
    is_delivered = models.BooleanField(default=False)
    shipped_at = models.DateTimeField(blank=True, null=True)
    delivered_at = models.DateTimeField(blank=True, null=True)
    exchange_eligible_until = models.DateTimeField(blank=True, null=True)
    exchange_status = models.CharField(max_length=20, choices=EXCHANGE_STATUS_CHOICES, default='none')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        # Auto-generate unique 6-digit order_number if not set
        if not self.order_number:
            while True:
                order_num = str(random.randint(100000, 999999))
                if not Order.objects.filter(order_number=order_num).exists():
                    self.order_number = order_num
                    break
        
        # Set shipped_at when status becomes shipped or out_for_delivery
        from django.utils import timezone
        if self.status in ['shipped', 'out_for_delivery'] and not self.shipped_at:
            self.shipped_at = timezone.now()
        
        # Calculate exchange eligibility (3-4 days from delivery)
        from datetime import timedelta
        if self.is_delivered and self.delivered_at and not self.exchange_eligible_until:
            self.exchange_eligible_until = self.delivered_at + timedelta(days=3)
        
        super().save(*args, **kwargs)
        
    def __str__(self):
        return f"Order {self.order_number} - {self.customer_name}"


class Cart(models.Model):
    """Cart model for shopping cart items per user (permanent storage)."""
    id = models.AutoField(primary_key=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='cart')
    items_data = models.JSONField(default=list, help_text="Cart items stored as JSON array")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-updated_at']
        
    def __str__(self):
        return f"Cart for {self.user.email}"


class Wishlist(models.Model):
    """Wishlist/Favorites model for user wishlist items (permanent storage)."""
    id = models.AutoField(primary_key=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='wishlist')
    product_ids = models.JSONField(default=list, help_text="Product IDs in wishlist as JSON array")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-updated_at']
        verbose_name_plural = "Wishlists"
        
    def __str__(self):
        return f"Wishlist for {self.user.email}"


class Banner(models.Model):
    """Banner model for homepage banner image."""
    id = models.AutoField(primary_key=True)
    image_url = models.TextField(help_text="Image URL or base64 data URL")
    title = models.CharField(max_length=200, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        
    def __str__(self):
        return f"Banner {self.id} - {self.title or 'No title'}"


class OrderNotification(models.Model):
    """Model to store order notifications for admin."""
    id = models.AutoField(primary_key=True)
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='notification')
    customer_name = models.CharField(max_length=200)
    customer_email = models.EmailField()
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    items_count = models.IntegerField(default=0)
    items_summary = models.JSONField(default=list, help_text="Summary of order items")
    phone = models.CharField(max_length=15, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    address = models.TextField(blank=True, null=True, help_text="Customer delivery address")
    pincode = models.CharField(max_length=10, blank=True, null=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Order Notification - {self.order.order_number} - {self.customer_name}"


class AdminContact(models.Model):
    """Model to store admin contact information for support."""
    id = models.AutoField(primary_key=True)
    admin_name = models.CharField(max_length=200, help_text="Name of the admin")
    whatsapp_number = models.CharField(max_length=15, help_text="WhatsApp number with country code, e.g., +919876543210")
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=15, blank=True, null=True)
    is_active = models.BooleanField(default=True, help_text="Is this contact currently active for support")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-is_active', '-created_at']
    
    def __str__(self):
        return f"{self.admin_name} - {self.whatsapp_number}"


class Address(models.Model):
    """Model for user addresses."""
    ADDRESS_TYPES = [
        ('home', 'Home'),
        ('work', 'Work'),
        ('other', 'Other'),
    ]
    
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='addresses')
    full_name = models.CharField(max_length=200)
    phone = models.CharField(max_length=20)
    street_address = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    country = models.CharField(max_length=100, default='India')
    address_type = models.CharField(max_length=10, choices=ADDRESS_TYPES, default='home')
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-is_default', '-created_at']
        verbose_name_plural = "Addresses"
    
    def __str__(self):
        return f"{self.full_name} - {self.street_address}, {self.city}"


class ExchangeRequest(models.Model):
    """Model for product exchange requests (size mismatch - 3-4 days window)."""
    STATUS_CHOICES = [
        ('pending', 'Pending Admin Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('awaiting_return', 'Awaiting Return Shipment'),
        ('return_received', 'Return Received'),
        ('replacement_shipped', 'Replacement Shipped'),
        ('completed', 'Completed'),
    ]
    
    REASON_CHOICES = [
        ('too_small', 'Too Small'),
        ('too_large', 'Too Large'),
        ('size_mismatch', 'Size Mismatch'),
    ]
    
    id = models.AutoField(primary_key=True)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='exchange_requests')
    product_id = models.IntegerField(help_text="Product ID from order items")
    product_name = models.CharField(max_length=255)
    size_old = models.CharField(max_length=50, help_text="Current size")
    size_new = models.CharField(max_length=50, help_text="Requested size")
    reason = models.CharField(max_length=50, choices=REASON_CHOICES)
    reason_description = models.TextField(blank=True, help_text="Additional details")
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='pending')
    
    # Admin fields
    admin_comment = models.TextField(blank=True, help_text="Admin notes on approval/rejection")
    return_label_url = models.URLField(blank=True, help_text="Shipping label for return")
    replacement_tracking = models.CharField(max_length=100, blank=True, help_text="Tracking for replacement shipment")
    
    # Timestamps
    requested_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(blank=True, null=True)
    return_received_at = models.DateTimeField(blank=True, null=True)
    replacement_shipped_at = models.DateTimeField(blank=True, null=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-requested_at']
        verbose_name_plural = "Exchange Requests"
    
    def __str__(self):
        return f"Exchange - {self.order.order_number} - {self.product_name} ({self.size_old} → {self.size_new})"


