"""
WebSocket URL routing configuration for Django Channels.

Maps WebSocket URL patterns to consumer handlers.
"""

try:
    from django.urls import re_path
    from api.consumers import AdminOrderNotificationConsumer  # type: ignore[import-not-found]
    
    # WebSocket URL patterns list (will be wrapped by URLRouter in asgi.py)
    websocket_urlpatterns = [
        re_path(r'ws/orders/notifications/$', AdminOrderNotificationConsumer.as_asgi()),  # type: ignore[arg-type]
    ]
except (ImportError, ModuleNotFoundError):
    # Fallback if channels is not installed
    websocket_urlpatterns = []
