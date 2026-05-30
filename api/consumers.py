"""
Django Channels WebSocket consumers for real-time order notifications.

Handles WebSocket connections for admin order notifications with 
authentication, message broadcasting, and connection management.
"""

import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from django.conf import settings
from api.models import Order, OrderNotification
from asgiref.sync import sync_to_async


class AdminOrderNotificationConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time admin order notifications.
    
    Features:
    - Authenticates admin users
    - Broadcasts order creation events to all connected admins
    - Handles connection lifecycle (connect, disconnect)
    - Sends notification events with order details
    """
    
    # Class variable to store all connected admin consumers
    admin_group_name = 'admin-orders'
    
    async def connect(self):
        """
        Handle WebSocket connection.
        
        Validates admin authentication and adds consumer to admin group.
        """
        self.user = self.scope.get('user')
        
        # Authenticate admin user
        if not await self._is_admin():
            await self.close(code=4001)  # Unauthorized
            return
        
        # Add this consumer to the admin group
        await self.channel_layer.group_add(
            self.admin_group_name,
            self.channel_name
        )
        
        # Accept the WebSocket connection
        await self.accept()
        
        # Send connection confirmation
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to order notifications',
            'timestamp': self._get_timestamp(),
        }))
    
    async def disconnect(self, close_code):
        """
        Handle WebSocket disconnection.
        
        Removes consumer from admin group.
        """
        if hasattr(self, 'admin_group_name'):
            await self.channel_layer.group_discard(
                self.admin_group_name,
                self.channel_name
            )
    
    async def receive(self, text_data):
        """
        Handle incoming WebSocket messages from client.
        
        Currently handles:
        - Ping/pong for connection keep-alive
        - Mark notification as read
        - Fetch unread notification count
        """
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'ping':
                # Respond to ping for connection keep-alive
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': self._get_timestamp(),
                }))
            
            elif message_type == 'mark_read':
                # Mark notification as read
                notification_id = data.get('notification_id')
                if notification_id:
                    await self._mark_notification_read(notification_id)
                    await self.send(text_data=json.dumps({
                        'type': 'notification_read',
                        'notification_id': notification_id,
                        'timestamp': self._get_timestamp(),
                    }))
            
            elif message_type == 'get_unread_count':
                # Send unread notification count
                count = await self._get_unread_count()
                await self.send(text_data=json.dumps({
                    'type': 'unread_count',
                    'count': count,
                    'timestamp': self._get_timestamp(),
                }))
                
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON',
                'timestamp': self._get_timestamp(),
            }))
        except Exception as e:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': str(e),
                'timestamp': self._get_timestamp(),
            }))
    
    async def order_notification(self, event):
        """
        Handle order notification event from group_send.
        
        Receives event from admin_order_notification and sends to WebSocket.
        """
        await self.send(text_data=json.dumps({
            'type': 'order_notification',
            'order_id': event['order_id'],
            'order_number': event['order_number'],
            'customer_name': event['customer_name'],
            'customer_email': event['customer_email'],
            'phone': event.get('phone', 'N/A'),
            'city': event.get('city', 'N/A'),
            'address': event.get('address', 'N/A'),
            'pincode': event.get('pincode', 'N/A'),
            'total_amount': str(event['total_amount']),
            'items_count': event['items_count'],
            'items_summary': event['items_summary'],
            'notification_id': event['notification_id'],
            'timestamp': event['timestamp'],
            'status': 'unread',
        }))
    
    # =====================================================================
    # PRIVATE HELPER METHODS
    # =====================================================================
    
    async def _is_admin(self):
        """
        Check if user is authenticated and is an admin/staff member.
        Returns:
            bool: True if user is authenticated admin, False otherwise
        """
        if not self.user or not hasattr(self.user, 'is_authenticated') or not self.user.is_authenticated:
            return False
        # Check if user is staff or has admin profile
        try:
            is_staff = await sync_to_async(lambda u: getattr(u, 'is_staff', False))(self.user)
            if is_staff:
                return True
            
            # Also check UserProfile.is_admin
            from api.models import UserProfile
            profile = await database_sync_to_async(UserProfile.objects.filter(user=self.user).first)()
            if profile and profile.is_admin:
                return True
                
            return False
        except Exception as e:
            print(f"Auth error: {e}")
            return False
    
    @database_sync_to_async
    def _mark_notification_read(self, notification_id):
        """
        Mark a notification as read.
        
        Args:
            notification_id (int): ID of notification to mark as read
        """
        from django.utils import timezone
        try:
            notification = OrderNotification.objects.get(id=notification_id)
            notification.is_read = True
            notification.read_at = timezone.now()
            notification.save()
        except OrderNotification.DoesNotExist:
            pass
    
    @database_sync_to_async
    def _get_unread_count(self):
        """
        Get count of unread notifications.
        
        Returns:
            int: Count of unread notifications
        """
        return OrderNotification.objects.filter(is_read=False).count()
    
    @staticmethod
    def _get_timestamp():
        """
        Get current timestamp in ISO format.
        
        Returns:
            str: ISO formatted timestamp
        """
        from django.utils import timezone
        return timezone.now().isoformat()


# Group sending function to broadcast order notifications
async def send_order_notification(order_id, order_number, customer_name, 
                                   customer_email, phone, city, address, pincode,
                                   total_amount, items_count, 
                                   items_summary, notification_id):
    """
    Send order notification to all connected admin users.
    
    This function is called from views when a new order is created.
    It broadcasts the notification to all admins via WebSocket.
    
    Args:
        order_id (int): ID of the order
        order_number (str): Order number
        customer_name (str): Customer name
        customer_email (str): Customer email
        phone (str): Customer phone number
        city (str): Customer city
        address (str): Customer delivery address
        pincode (str): Customer pincode
        total_amount (Decimal): Total order amount
        items_count (int): Number of items in order
        items_summary (list): Summary of order items
        notification_id (int): ID of the notification
    """
    from channels.layers import get_channel_layer
    from django.utils import timezone
    
    channel_layer = get_channel_layer()
    if channel_layer is not None:
        await channel_layer.group_send(
            AdminOrderNotificationConsumer.admin_group_name,
            {
                'type': 'order_notification',  # Method name to call
                'order_id': order_id,
                'order_number': order_number,
                'customer_name': customer_name,
                'customer_email': customer_email,
                'phone': phone,
                'city': city,
                'address': address,
                'pincode': pincode,
                'total_amount': total_amount,
                'items_count': items_count,
                'items_summary': items_summary,
                'notification_id': notification_id,
                'timestamp': timezone.now().isoformat(),
            }
        )
    else:
        # Optionally log or handle the error if channel_layer is None
        pass
