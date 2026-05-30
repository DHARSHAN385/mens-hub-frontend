"""
Order notification service for handling real-time notifications.

This service creates OrderNotification records and triggers WebSocket
events to broadcast notifications to all connected admin clients.
"""

import asyncio
from django.utils import timezone
from api.models import Order, OrderNotification
from api.consumers import send_order_notification


def create_order_notification(order):
    """
    Create an OrderNotification record for a new order.
    
    This function:
    1. Creates an OrderNotification database record with customer details
    2. Triggers WebSocket event to notify admins
    
    Args:
        order (Order): The Order object that was just created
        
    Returns:
        OrderNotification: The created notification object
    """
    try:
        # Prepare order items summary
        items_summary = []
        items_list = []
        if order.items:
            if isinstance(order.items, list):
                items_list = order.items
            elif isinstance(order.items, str):
                try:
                    import json
                    items_list = json.loads(order.items)
                except:
                    items_list = []

            for item in items_list:
                items_summary.append({
                    'product_name': item.get('product_name') or item.get('name') or 'Unknown',
                    'quantity': item.get('quantity') or item.get('qty') or 1,
                    'price': str(item.get('price', 0)),
                    'size': item.get('size', ''),
                })
        
        # Create notification record with phone, city, address, and pincode
        # Use get_or_create to prevent duplicate notifications for same order
        notification, created = OrderNotification.objects.get_or_create(
            order=order,
            defaults={
                'customer_name': order.customer_name,
                'customer_email': order.customer_email,
                'phone': order.phone or 'N/A',
                'city': order.city or 'N/A',
                'address': order.address or 'N/A',
                'pincode': order.pincode or 'N/A',
                'total_amount': order.total_amount,
                'items_count': len(items_list) if items_list else 0,
                'items_summary': items_summary,
                'is_read': False,
            }
        )
        
        # Trigger WebSocket notification asynchronously
        try:
            from asgiref.sync import async_to_sync
            async_to_sync(send_order_notification)(
                order_id=order.id,
                order_number=order.order_number,
                customer_name=order.customer_name,
                customer_email=order.customer_email,
                phone=order.phone or 'N/A',
                city=order.city or 'N/A',
                address=order.address or 'N/A',
                pincode=order.pincode or 'N/A',
                total_amount=order.total_amount,
                items_count=len(items_list) if items_list else 0,
                items_summary=items_summary,
                notification_id=notification.id,
            )
            print(f"WebSocket notification broadcasted successfully for order {order.order_number}")
        except Exception as ws_err:
            print(f"WebSocket async_to_sync failed, trying fallback create_task: {str(ws_err)}")
            try:
                asyncio.create_task(
                    send_order_notification(
                        order_id=order.id,
                        order_number=order.order_number,
                        customer_name=order.customer_name,
                        customer_email=order.customer_email,
                        phone=order.phone or 'N/A',
                        city=order.city or 'N/A',
                        address=order.address or 'N/A',
                        pincode=order.pincode or 'N/A',
                        total_amount=order.total_amount,
                        items_count=len(items_list) if items_list else 0,
                        items_summary=items_summary,
                        notification_id=notification.id,
                    )
                )
            except Exception as task_err:
                print(f"Fallback create_task also failed: {str(task_err)}")
        
        return notification
        
    except Exception as e:
        # Log the error but don't fail order creation
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to create order notification for order {order.id}: {str(e)}")
        return None


def mark_notification_as_read(notification_id):
    """
    Mark a notification as read.
    
    Args:
        notification_id (int): ID of the notification to mark as read
        
    Returns:
        OrderNotification: Updated notification object or None if not found
    """
    try:
        notification = OrderNotification.objects.get(id=notification_id)
        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save()
        return notification
    except OrderNotification.DoesNotExist:
        return None


def get_unread_notification_count():
    """
    Get count of unread notifications for admin dashboard.
    
    Returns:
        int: Count of unread notifications
    """
    return OrderNotification.objects.filter(is_read=False).count()


def get_recent_notifications(limit=10):
    """
    Get recent notifications for admin dashboard.
    
    Args:
        limit (int): Maximum number of notifications to retrieve
        
    Returns:
        QuerySet: Recent notifications ordered by created_at
    """
    return OrderNotification.objects.all().order_by('-created_at')[:limit]


def get_unread_notifications(limit=20):
    """
    Get unread notifications for admin dashboard.
    
    Args:
        limit (int): Maximum number of notifications to retrieve
        
    Returns:
        QuerySet: Unread notifications ordered by created_at
    """
    return OrderNotification.objects.filter(is_read=False).order_by('-created_at')[:limit]


def mark_all_as_read():
    """
    Mark all notifications as read.
    
    Returns:
        int: Number of notifications updated
    """
    notifications = OrderNotification.objects.filter(is_read=False)
    count = notifications.update(
        is_read=True,
        read_at=timezone.now()
    )
    return count
