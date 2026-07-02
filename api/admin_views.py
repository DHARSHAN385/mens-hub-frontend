"""
Admin and User-Specific API Endpoints
Amazon/Flipkart style user-based data fetching
"""

from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.models import User
from django.db.models import Count, Sum, Q
from django.utils import timezone
from datetime import timedelta
from django.core.cache import cache

from .models import (
    Order, Cart, Wishlist, Address, UserProfile, 
    OrderNotification, Banner
)
from .serializers import (
    UserSerializer, OrderSerializer, CartSerializer, 
    WishlistSerializer, AddressSerializer, OrderNotificationSerializer
)


# ═══════════════════════════════════════════════════════════════
# USER-SPECIFIC ENDPOINTS (Regular Users)
# ═══════════════════════════════════════════════════════════════

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user_profile(request):
    """
    GET /api/me/profile/
    Get current user's complete profile with all data
    """
    user = request.user
    profile = UserProfile.objects.filter(user=user).first()
    
    # Get user's cart
    cart = Cart.objects.filter(user=user).first()
    cart_data = CartSerializer(cart).data if cart else None
    
    # Get user's wishlist
    wishlist = Wishlist.objects.filter(user=user).first()
    wishlist_data = WishlistSerializer(wishlist).data if wishlist else None
    
    # Get user's addresses
    addresses = Address.objects.filter(user=user)
    addresses_data = AddressSerializer(addresses, many=True).data
    
    # Get user's orders
    orders = Order.objects.filter(user=user).order_by('-created_at')
    orders_data = OrderSerializer(orders, many=True).data
    
    return Response({
        'user': {
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'username': user.username,
            'date_joined': user.date_joined,
        },
        'profile': {
            'phone': profile.phone if profile else None,
            'country_code': profile.country_code if profile else '+91',
            'is_admin': profile.is_admin if profile else False,
        },
        'cart': cart_data,
        'wishlist': wishlist_data,
        'addresses': addresses_data,
        'orders': orders_data,
        'stats': {
            'total_orders': orders.count(),
            'total_spent': sum(o.total_amount for o in orders),
            'addresses_count': addresses.count(),
            'wishlist_items': len(wishlist.product_ids) if wishlist else 0,
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_cart(request):
    """
    GET /api/me/cart/
    Get current user's cart
    """
    cart, created = Cart.objects.get_or_create(user=request.user)
    serializer = CartSerializer(cart)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_wishlist(request):
    """
    GET /api/me/wishlist/
    Get current user's wishlist
    """
    wishlist, created = Wishlist.objects.get_or_create(user=request.user)
    serializer = WishlistSerializer(wishlist)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_orders(request):
    """
    GET /api/me/orders/
    Get all orders for current user
    """
    orders = Order.objects.filter(user=request.user).order_by('-created_at')
    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_order_detail(request, order_id):
    """
    GET /api/me/orders/<order_id>/
    Get specific order details for current user
    """
    try:
        order = Order.objects.get(id=order_id, user=request.user)
        serializer = OrderSerializer(order)
        return Response(serializer.data)
    except Order.DoesNotExist:
        return Response(
            {'error': 'Order not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_order_track(request, order_id):
    """
    GET /api/me/orders/<order_id>/track/
    Track specific order for current user
    """
    try:
        order = Order.objects.get(id=order_id, user=request.user)
        serializer = OrderSerializer(order)
        return Response(serializer.data)
    except Order.DoesNotExist:
        return Response(
            {'error': 'Order not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_addresses(request):
    """
    GET /api/me/addresses/
    Get all addresses for current user
    """
    addresses = Address.objects.filter(user=request.user).order_by('-is_default', '-created_at')
    serializer = AddressSerializer(addresses, many=True)
    return Response(serializer.data)


# ═══════════════════════════════════════════════════════════════
# ADMIN-SPECIFIC ENDPOINTS (Admin Only)
# ═══════════════════════════════════════════════════════════════

def is_admin(user):
    """Check if user is admin"""
    return user.is_staff or (hasattr(user, 'profile') and user.profile.is_admin)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_customers_list(request):
    """
    GET /api/admin/customers/
    Get list of all customers (Admin only) - Optimized query to avoid N+1 issues
    """
    if not is_admin(request.user):
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Fetch customers with user profile in a single query
    customers = User.objects.filter(is_staff=False).select_related('profile')
    
    # Fetch all orders for these customers in a single query
    orders = Order.objects.filter(user__in=customers)
    
    # Group orders by user_id
    from collections import defaultdict
    orders_by_user = defaultdict(list)
    for order in orders:
        orders_by_user[order.user_id].append(order)
        
    customers_data = []
    for customer in customers:
        user_orders = orders_by_user[customer.id]
        total_spent = sum(o.total_amount for o in user_orders)
        
        # Sort in memory to find the last order
        user_orders.sort(key=lambda o: o.created_at, reverse=True)
        last_order = user_orders[0] if user_orders else None
        
        # Safe access to profile
        phone = None
        if hasattr(customer, 'profile') and customer.profile:
            phone = customer.profile.phone
            
        customers_data.append({
            'id': customer.id,
            'email': customer.email,
            'name': customer.get_full_name() or customer.username,
            'phone': phone,
            'orders_count': len(user_orders),
            'total_spent': float(total_spent),
            'last_order_date': last_order.created_at if last_order else None,
            'date_joined': customer.date_joined,
        })
    
    return Response(customers_data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_customer_detail(request, customer_id):
    """
    GET /api/admin/customers/<customer_id>/profile/
    Get complete customer profile (Admin only)
    """
    if not is_admin(request.user):
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        customer = User.objects.get(id=customer_id, is_staff=False)
    except User.DoesNotExist:
        return Response(
            {'error': 'Customer not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Get customer's data
    cart = Cart.objects.filter(user=customer).first()
    wishlist = Wishlist.objects.filter(user=customer).first()
    addresses = Address.objects.filter(user=customer)
    orders = Order.objects.filter(user=customer)
    profile = UserProfile.objects.filter(user=customer).first()
    
    return Response({
        'customer': {
            'id': customer.id,
            'email': customer.email,
            'first_name': customer.first_name,
            'last_name': customer.last_name,
            'username': customer.username,
            'date_joined': customer.date_joined,
        },
        'profile': {
            'phone': profile.phone if profile else None,
            'country_code': profile.country_code if profile else '+91',
        },
        'cart': CartSerializer(cart).data if cart else None,
        'wishlist': WishlistSerializer(wishlist).data if wishlist else None,
        'addresses': AddressSerializer(addresses, many=True).data,
        'orders': OrderSerializer(orders, many=True).data,
        'stats': {
            'total_orders': orders.count(),
            'total_spent': float(sum(o.total_amount for o in orders)),
            'addresses_count': addresses.count(),
            'wishlist_items': len(wishlist.product_ids) if wishlist else 0,
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_customer_orders(request, customer_id):
    """
    GET /api/admin/customers/<customer_id>/orders/
    Get all orders for a specific customer (Admin only)
    """
    if not is_admin(request.user):
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        customer = User.objects.get(id=customer_id, is_staff=False)
    except User.DoesNotExist:
        return Response(
            {'error': 'Customer not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    orders = Order.objects.filter(user=customer).order_by('-created_at')
    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_customer_addresses(request, customer_id):
    """
    GET /api/admin/customers/<customer_id>/addresses/
    Get all addresses for a specific customer (Admin only)
    """
    if not is_admin(request.user):
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        customer = User.objects.get(id=customer_id, is_staff=False)
    except User.DoesNotExist:
        return Response(
            {'error': 'Customer not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    addresses = Address.objects.filter(user=customer).order_by('-is_default')
    serializer = AddressSerializer(addresses, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_all_orders(request):
    """
    GET /api/admin/orders/
    Get all orders with customer information (Admin only)
    """
    if not is_admin(request.user):
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    orders = Order.objects.select_related('user').all().order_by('-created_at')
    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def admin_update_order_status(request, order_id):
    """
    PATCH /api/admin/orders/<order_id>/status/
    Update order status (Admin only)
    """
    if not is_admin(request.user):
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        order = Order.objects.get(id=order_id)
    except Order.DoesNotExist:
        return Response(
            {'error': 'Order not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    status_value = request.data.get('status')
    tracking_number = request.data.get('tracking_number')
    
    # Validate status
    valid_statuses = dict(Order.STATUS_CHOICES)
    if status_value not in valid_statuses:
        return Response(
            {
                'error': f'Invalid status: {status_value}. Valid options are: {list(valid_statuses.keys())}',
                'valid_statuses': list(valid_statuses.keys())
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        order.status = status_value
        if tracking_number:
            order.tracking_number = tracking_number
        order.save()
        
        print(f"✅ Order {order.order_number} updated to {status_value}")
        if tracking_number:
            print(f"   Tracking: {tracking_number}")
        
        return Response({
            'success': True,
            'message': f'Order {order.order_number} status updated to {status_value}',
            'order': OrderSerializer(order).data
        })
    except Exception as e:
        print(f"❌ Error updating order: {e}")
        return Response(
            {'error': f'Failed to update order: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_notifications(request):
    """
    GET /api/admin/notifications/
    Get all order notifications (Admin only)
    """
    if not is_admin(request.user):
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    notifications = OrderNotification.objects.all().order_by('-created_at')
    serializer = OrderNotificationSerializer(notifications, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_unread_notifications(request):
    """
    GET /api/admin/notifications/unread/
    Get unread notifications count (Admin only)
    """
    if not is_admin(request.user):
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    unread_count = OrderNotification.objects.filter(is_read=False).count()
    unread_notifications = OrderNotification.objects.filter(is_read=False).order_by('-created_at')
    
    return Response({
        'unread_count': unread_count,
        'notifications': OrderNotificationSerializer(unread_notifications, many=True).data
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_mark_notification_read(request, notification_id):
    """
    POST /api/admin/notifications/<notification_id>/read/
    Mark notification as read (Admin only)
    """
    if not is_admin(request.user):
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        notification = OrderNotification.objects.get(id=notification_id)
    except OrderNotification.DoesNotExist:
        return Response(
            {'error': 'Notification not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    notification.is_read = True
    notification.read_at = timezone.now()
    notification.save()
    
    return Response(OrderNotificationSerializer(notification).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_dashboard_stats(request):
    """
    GET /api/admin/dashboard/stats/
    Get dashboard statistics (Admin only)
    """
    if not is_admin(request.user):
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get statistics
    total_customers = User.objects.filter(is_staff=False).count()
    total_orders = Order.objects.count()
    total_revenue = Order.objects.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
    
    # Today's orders
    today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
    today_orders = Order.objects.filter(created_at__gte=today_start).count()
    today_revenue = Order.objects.filter(created_at__gte=today_start).aggregate(Sum('total_amount'))['total_amount__sum'] or 0
    
    # This week
    week_start = timezone.now() - timedelta(days=7)
    week_orders = Order.objects.filter(created_at__gte=week_start).count()
    
    # Unread notifications
    unread_notifications = OrderNotification.objects.filter(is_read=False).count()
    
    # Order status breakdown
    status_breakdown = Order.objects.values('status').annotate(count=Count('id'))
    
    return Response({
        'overview': {
            'total_customers': total_customers,
            'total_orders': total_orders,
            'total_revenue': float(total_revenue),
            'unread_notifications': unread_notifications,
        },
        'today': {
            'orders_count': today_orders,
            'revenue': float(today_revenue),
        },
        'week': {
            'orders_count': week_orders,
        },
        'order_status_breakdown': list(status_breakdown),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_order_history(request):
    """
    GET /api/admin/order-history/
    Get complete order history with filters (Admin only)
    """
    if not is_admin(request.user):
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get filter parameters
    days = request.query_params.get('days', 0)  # 0 = all, 7 = week, 30 = month
    status_filter = request.query_params.get('status')  # pending, processing, shipped, delivered, cancelled
    
    orders = Order.objects.select_related('user').all().order_by('-created_at')
    
    # Apply date filter
    if days:
        start_date = timezone.now() - timedelta(days=int(days))
        orders = orders.filter(created_at__gte=start_date)
    
    # Apply status filter
    if status_filter:
        orders = orders.filter(status=status_filter)
    
    serializer = OrderSerializer(orders, many=True)
    return Response({
        'count': orders.count(),
        'orders': serializer.data,
    })


# ═══════════════════════════════════════════════════════════════
# IMAGE UPLOAD ENDPOINT (Admin Only)
# ═══════════════════════════════════════════════════════════════

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_image(request):
    """
    POST /api/admin/upload-image/
    Upload product/category/banner image and return the image URL
    Admin only
    """
    if not is_admin(request.user):
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    if 'image' not in request.FILES:
        return Response(
            {'error': 'No image file provided'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        image_file = request.FILES['image']
        
        # Validate file type
        allowed_extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']
        file_ext = image_file.name.split('.')[-1].lower()
        
        if file_ext not in allowed_extensions:
            return Response(
                {'error': f'Invalid file type. Allowed: {", ".join(allowed_extensions)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate unique filename to avoid conflicts
        import time
        import os
        timestamp = int(time.time() * 1000)
        filename = f"{timestamp}_{image_file.name}"
        
        # Save to media folder
        from django.core.files.storage import default_storage
        file_path = f"uploads/{filename}"
        path = default_storage.save(file_path, image_file)
        
        # Construct full URL
        image_url = f"/media/{path}"
        
        return Response({
            'success': True,
            'image_url': image_url,
            'message': 'Image uploaded successfully'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"❌ Error uploading image: {str(e)}")
        return Response(
            {'error': f'Failed to upload image: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET', 'POST'])
def admin_banner_setting(request):
    """
    GET /api/settings/banner/ - Get active banner URL (Cached)
    POST /api/settings/banner/ - Update active banner URL (Invalidates Cache)
    """
    if request.method == 'GET':
        cache_key = 'active_banner'
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return Response(cached_data)

        # Get the latest active banner
        banner = Banner.objects.filter(is_active=True).first()
        data = {'banner_url': banner.image_url if banner else ''}
        cache.set(cache_key, data, timeout=3600)  # cache for 1 hour
        return Response(data)
    
    elif request.method == 'POST':
        # Admin access check
        if not is_admin(request.user):
            return Response(
                {'error': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN
            )
            
        banner_url = request.data.get('banner_url')
        if not banner_url:
            return Response(
                {'error': 'banner_url is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Update or create the active banner
        banner = Banner.objects.filter(is_active=True).first()
        if banner:
            banner.image_url = banner_url
            banner.save()
        else:
            Banner.objects.create(
                image_url=banner_url,
                title='Primary Banner',
                is_active=True
            )
            
        # Invalidate banner cache
        cache.delete('active_banner')
            
        return Response({'success': True, 'banner_url': banner_url})
