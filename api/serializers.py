# pyright: reportMissingImports=false
from rest_framework import serializers
from .models import Product, Order, Category, Cart, Wishlist, Banner, GoogleUser, OrderNotification, Address, UserProfile, ExchangeRequest, AdminContact
from django.contrib.auth.models import User


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for User Profile."""
    class Meta:
        model = UserProfile
        fields = ['id', 'phone', 'country_code', 'is_admin', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class GoogleUserSerializer(serializers.ModelSerializer):
    """Serializer for Google OAuth users."""
    class Meta:
        model = GoogleUser
        fields = ['id', 'google_id', 'email', 'name', 'picture', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class UserSerializer(serializers.ModelSerializer):
    """Serializer for Django User model."""
    google_user = GoogleUserSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'username', 'google_user', 'date_joined']
        read_only_fields = ['id', 'date_joined']


class OrderNotificationSerializer(serializers.ModelSerializer):
    """Serializer for Order Notifications."""
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    order_status = serializers.CharField(source='order.status', read_only=True)
    
    class Meta:
        model = OrderNotification
        fields = ['id', 'order_number', 'customer_name', 'customer_email', 'phone', 'city', 'address', 'pincode', 'total_amount', 'items_count', 'items_summary', 'is_read', 'created_at', 'read_at', 'order_status']
        read_only_fields = ['created_at', 'read_at']


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'img', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def _ensure_media_path(self, value):
        if value and not value.startswith(('http://', 'https://', '/media/', 'data:image/')):
            return f"/media/{value}"
        return value

    def create(self, validated_data):
        if 'img' in validated_data:
            validated_data['img'] = self._ensure_media_path(validated_data['img'])
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if 'img' in validated_data:
            validated_data['img'] = self._ensure_media_path(validated_data['img'])
        return super().update(instance, validated_data)

    def validate_img(self, value):
        if not value:
            return value
        if value.startswith('data:image/'):
            return value
        if value.startswith('http://') or value.startswith('https://') or value.startswith('/'):
            return value
        return value

    def get_placeholder_image_url(self, name: str) -> str:
        name_lower = name.lower()
        category_colors = {
            'shirt': '#ff6b6b',
            'pants': '#4ecdc4',
            'jacket': '#95a5a6',
            'shoes': '#f9ca24',
            'accessories': '#6c5ce7',
            'tshirt': '#00b894',
            'jeans': '#2c3e50',
            'slides': '#e17055',
            'sunglass': '#74b9ff',
            'sarees': '#fd79a8',
        }
        color = category_colors.get(name_lower, '#95a5a6')
        placeholder_svg = f'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="{color.replace("#", "%23")}" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" font-size="32" fill="white" text-anchor="middle" dominant-baseline="middle" font-family="Arial"%3E{name}%3C/text%3E%3C/svg%3E'
        return placeholder_svg


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'price', 'category', 'category_name', 'image_url', 'images', 'stock', 'sizes', 'popularity', 'featured', 'custom_designs', 'color_patterns', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def _ensure_media_path(self, value):
        if value and not value.startswith(('http://', 'https://', '/media/', 'data:image/')):
            return f"/media/{value}"
        return value

    def create(self, validated_data):
        if 'image_url' in validated_data:
            validated_data['image_url'] = self._ensure_media_path(validated_data['image_url'])
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if 'image_url' in validated_data:
            validated_data['image_url'] = self._ensure_media_path(validated_data['image_url'])
        return super().update(instance, validated_data)

    def validate_image_url(self, value):
        if not value:
            return value
        if value.startswith('data:image/') or value.startswith('http') or value.startswith('/'):
            return value
        return value

    def get_placeholder_image_url(self, category: str) -> str:
        category_colors = {
            'shirt': '#ff6b6b',
            'pants': '#4ecdc4',
            'jacket': '#95a5a6',
            'shoes': '#f9ca24',
            'accessories': '#6c5ce7',
            'tshirt': '#00b894',
            'jeans': '#2c3e50',
            'slides': '#e17055',
            'sunglass': '#74b9ff',
            'sarees': '#fd79a8',
        }
        color = category_colors.get(category, '#95a5a6')
        placeholder_svg = f'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="800"%3E%3Crect fill="{color.replace("#", "%23")}" width="600" height="800"/%3E%3Ctext x="50%25" y="50%25" font-size="48" fill="white" text-anchor="middle" dominant-baseline="middle" font-family="Arial"%3EProduct%3C/text%3E%3C/svg%3E'
        return placeholder_svg


class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ['id', 'user', 'order_number', 'customer_name', 'customer_email', 'phone', 'city', 'total_amount', 'address', 'pincode', 'status', 'items', 'tracking_number', 'payment_id', 'payment_method', 'payment_status', 'is_delivered', 'shipped_at', 'delivered_at', 'exchange_eligible_until', 'exchange_status', 'created_at', 'updated_at']
        read_only_fields = ['user', 'created_at', 'updated_at', 'order_number']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # If customer_name or email are blank in the DB (for old orders), fall back to user info
        user = instance.user
        if not data.get('customer_name'):
            if user:
                data['customer_name'] = user.get_full_name() or user.username
            else:
                data['customer_name'] = 'Guest Customer'
                
        if not data.get('customer_email'):
            if user:
                data['customer_email'] = user.email
            else:
                data['customer_email'] = 'customer@menshub.com'
                
        if not data.get('phone') and user:
            try:
                profile = UserProfile.objects.get(user=user)
                data['phone'] = profile.phone
            except: 
                data['phone'] = 'N/A'
        
        # Ensure items is always a list
        if isinstance(data.get('items'), str):
            import json
            try:
                data['items'] = json.loads(data['items'])
            except:
                data['items'] = []
                
        return data


class CartSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cart
        fields = ['id', 'user', 'items_data', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class WishlistSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wishlist
        fields = ['id', 'product_ids', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class BannerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Banner
        fields = ['id', 'image_url', 'title', 'description', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def _ensure_media_path(self, value):
        if value and not value.startswith(('http://', 'https://', '/media/', 'data:image/')):
            return f"/media/{value}"
        return value

    def create(self, validated_data):
        if 'image_url' in validated_data:
            validated_data['image_url'] = self._ensure_media_path(validated_data['image_url'])
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if 'image_url' in validated_data:
            validated_data['image_url'] = self._ensure_media_path(validated_data['image_url'])
        return super().update(instance, validated_data)

    def get_placeholder_banner_url(self, title: str = "Banner") -> str:
        placeholder_svg = f'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1200" height="400"%3E%3Crect fill="%236c5ce7" width="1200" height="400"/%3E%3Ctext x="50%25" y="50%25" font-size="56" fill="white" text-anchor="middle" dominant-baseline="middle" font-family="Arial" font-weight="bold"%3E{title}%3C/text%3E%3C/svg%3E'
        return placeholder_svg


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ['id', 'full_name', 'phone', 'street_address', 'city', 'state', 'postal_code', 'country', 'address_type', 'is_default', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class ExchangeRequestSerializer(serializers.ModelSerializer):
    """Serializer for Exchange Requests."""
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    customer_name = serializers.CharField(source='order.customer_name', read_only=True)
    customer_email = serializers.CharField(source='order.customer_email', read_only=True)
    
    class Meta:
        model = ExchangeRequest
        fields = ['id', 'order', 'order_number', 'customer_name', 'customer_email', 'product_id', 'product_name', 'size_old', 'size_new', 'reason', 'reason_description', 'status', 'admin_comment', 'return_label_url', 'replacement_tracking', 'requested_at', 'approved_at', 'return_received_at', 'replacement_shipped_at', 'completed_at', 'updated_at']
        read_only_fields = ['requested_at', 'approved_at', 'return_received_at', 'replacement_shipped_at', 'completed_at', 'updated_at']


class AdminContactSerializer(serializers.ModelSerializer):
    """Serializer for Admin Contact Information."""
    class Meta:
        model = AdminContact
        fields = ['id', 'admin_name', 'whatsapp_number', 'email', 'phone', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
