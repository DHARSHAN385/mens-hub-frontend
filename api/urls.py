from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProductViewSet, OrderViewSet, CategoryViewSet, 
    CartViewSet, WishlistViewSet, BannerViewSet, api_root,
    google_oauth_login, OrderNotificationViewSet, create_order_with_notification,
    register_user, login_user, AddressViewSet, ExchangeRequestViewSet, AdminContactViewSet,
    get_support_contact, support_with_order
)
from .admin_views import (
    current_user_profile, user_cart, user_wishlist, user_orders,
    user_order_detail, user_order_track, user_addresses,
    admin_customers_list, admin_customer_detail, admin_customer_orders,
    admin_customer_addresses, admin_all_orders, admin_update_order_status,
    admin_notifications, admin_unread_notifications, admin_mark_notification_read,
    admin_dashboard_stats, admin_order_history, upload_image, admin_banner_setting
)

router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'products', ProductViewSet)
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'cart', CartViewSet, basename='cart')
router.register(r'wishlist', WishlistViewSet, basename='wishlist')
router.register(r'banners', BannerViewSet)
router.register(r'notifications', OrderNotificationViewSet, basename='notification')
router.register(r'addresses', AddressViewSet, basename='address')
router.register(r'exchanges', ExchangeRequestViewSet, basename='exchange')
router.register(r'admin-contacts', AdminContactViewSet, basename='admin-contact')

app_name = 'api'

urlpatterns = [
    # Public endpoints
    path('', api_root, name='api-root'),
    path('auth/register/', register_user, name='register'),
    path('auth/login/', login_user, name='login'),
    path('auth/google/', google_oauth_login, name='google-oauth-login'),
    
    # User-Specific Endpoints (Authenticated Users)
    path('me/profile/', current_user_profile, name='user-profile'),
    path('me/cart/', user_cart, name='user-cart'),
    path('me/wishlist/', user_wishlist, name='user-wishlist'),
    path('me/orders/', user_orders, name='user-orders'),
    path('me/orders/<int:order_id>/', user_order_detail, name='user-order-detail'),
    path('me/orders/<int:order_id>/track/', user_order_track, name='user-order-track'),
    path('me/addresses/', user_addresses, name='user-addresses'),
    
    # Admin Endpoints (Admin Only)
    path('admin/customers/', admin_customers_list, name='admin-customers'),
    path('admin/customers/<int:customer_id>/profile/', admin_customer_detail, name='admin-customer-detail'),
    path('admin/customers/<int:customer_id>/orders/', admin_customer_orders, name='admin-customer-orders'),
    path('admin/customers/<int:customer_id>/addresses/', admin_customer_addresses, name='admin-customer-addresses'),
    path('admin/orders/', admin_all_orders, name='admin-all-orders'),
    path('admin/orders/<int:order_id>/status/', admin_update_order_status, name='admin-update-order-status'),
    path('admin/notifications/', admin_notifications, name='admin-notifications'),
    path('admin/notifications/unread/', admin_unread_notifications, name='admin-unread-notifications'),
    path('admin/notifications/<int:notification_id>/read/', admin_mark_notification_read, name='admin-mark-notification-read'),
    path('admin/dashboard/stats/', admin_dashboard_stats, name='admin-dashboard-stats'),
    path('admin/order-history/', admin_order_history, name='admin-order-history'),
    path('admin/upload-image/', upload_image, name='admin-upload-image'),
    path('settings/banner/', admin_banner_setting, name='admin-banner-setting'),
    
    # Order notifications
    path('orders/create-with-notification/', create_order_with_notification, name='create-order-with-notification'),
    
    # Support endpoints
    path('support/contact/', get_support_contact, name='get-support-contact'),
    path('support/order/', support_with_order, name='support-with-order'),
    
    # Router endpoints
    path('', include(router.urls)),
]
