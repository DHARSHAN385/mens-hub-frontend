from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, BasePermission
from .models import Product, Order, Category, Cart, Wishlist, Banner, GoogleUser, OrderNotification, Address, UserProfile, ExchangeRequest, AdminContact
from .serializers import (
    ProductSerializer, OrderSerializer, CategorySerializer, 
    CartSerializer, WishlistSerializer, BannerSerializer,
    OrderNotificationSerializer, AddressSerializer, AdminContactSerializer
)
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from google.auth.transport import requests
from google.oauth2 import id_token
from django.conf import settings
from typing import Any
from django.utils import timezone
from api.services import create_order_notification  # Import notification service
from datetime import datetime, timedelta


# Permission Classes
class IsAdminUser(BasePermission):
    """Permission class to check if user is an admin."""
    def has_permission(self, request, view):  # type: ignore[override]
        """Return True if the authenticated user has admin flag in profile."""
        if not request.user or not request.user.is_authenticated:
            return False
        try:
            profile = UserProfile.objects.get(user=request.user)
            return bool(profile.is_admin)
        except UserProfile.DoesNotExist:
            return False


class IsAdminOrReadOnly(BasePermission):
    """Permission class to allow read-only access to all users, write access to admins only."""
    def has_permission(self, request, view):  # type: ignore[override]
        """Allow read-only for everyone, write for admins or staff.

        Returns True for safe methods, otherwise checks authentication and admin status.
        """
        # Allow read-only access to everyone
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True

        # For write operations, check if user is authenticated
        if not request.user or not request.user.is_authenticated:
            return False

        # Check if user is staff/superuser
        if request.user.is_staff or request.user.is_superuser:
            return True

        # Check UserProfile.is_admin flag
        try:
            profile = UserProfile.objects.get(user=request.user)
            return bool(profile.is_admin)
        except UserProfile.DoesNotExist:
            # If no profile exists, check if user email matches admin emails
            admin_emails = ['menshubadmin01@gmail.com', 'mubarak.ali@menshub.com', 'mubarakstr003@gmail.com']
            return request.user.email in admin_emails


class CategoryViewSet(viewsets.ModelViewSet):
    """ViewSet for Category model."""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]
    
    def perform_create(self, serializer):
        """Save category to database."""
        serializer.save()
    
    def perform_update(self, serializer):
        """Update category in database - PERMANENT."""
        instance = serializer.save()
        print(f"✓ Category updated: {instance.id} - {instance.name}")
    
    def perform_destroy(self, instance):
        """Delete category from database - PERMANENT."""
        print(f"✓ Category deleted: {instance.id} - {instance.name}")
        instance.delete()


class ProductViewSet(viewsets.ModelViewSet):
    """ViewSet for Product model."""
    queryset = Product.objects.select_related('category').all()
    serializer_class = ProductSerializer
    permission_classes = [IsAdminOrReadOnly]
    
    def get_queryset(self) -> Any:
        queryset = Product.objects.select_related('category').all()
        category = self.request.query_params.get('category')  # type: ignore
        featured = self.request.query_params.get('featured')  # type: ignore
        
        if category:
            if category.isdigit():
                queryset = queryset.filter(category_id=int(category))
            else:
                from django.db.models import Q
                queryset = queryset.filter(Q(category__name__iexact=category) | Q(category_temp__iexact=category))
        if featured == 'true':
            queryset = queryset.filter(featured=True)
            
        return queryset
    
    def perform_create(self, serializer):
        """Save product to database."""
        serializer.save()
    
    def perform_update(self, serializer):
        """Update product in database - PERMANENT."""
        instance = serializer.save()
        print(f"✓ Product updated: {instance.id} - {instance.name}")
    
    def perform_destroy(self, instance):
        """Delete product from database - PERMANENT."""
        print(f"✓ Product deleted: {instance.id} - {instance.name}")
        instance.delete()
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        """Get all featured products."""
        featured_products = Product.objects.select_related('category').filter(featured=True)
        serializer = self.get_serializer(featured_products, many=True)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        """Create product and return full object."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        """Update product and return full object."""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)


class OrderViewSet(viewsets.ModelViewSet):
    """ViewSet for Order model."""
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self) -> Any:
        """Return orders for the current user or all if admin."""
        user = self.request.user
        if not user or not user.is_authenticated:
            return Order.objects.none()
            
        # Check if user is staff or has is_admin profile
        is_admin = user.is_staff or user.is_superuser
        if not is_admin:
            try:
                profile = UserProfile.objects.get(user=user)
                is_admin = profile.is_admin
            except UserProfile.DoesNotExist:
                is_admin = False
                
        if is_admin:
            return Order.objects.select_related('user').all()
        return Order.objects.select_related('user').filter(user=user)
    
    def perform_create(self, serializer: Any) -> None:
        """Create order for current user and generate notification for admin."""
        user = self.request.user
        data = self.request.data
        
        # Strict check for authenticated user
        if not user or not user.is_authenticated:
            print(f"ERROR: Anonymous user tried to create order!")
            # The serializer validation will handle this too since user field is now mandatory
            return

        print(f"DEBUG: Creating order for user {user.username}")
        print(f"DEBUG: Request Data: {data}")

        # Explicitly save ALL fields from the request data with strict validation
        c_name = data.get('customer_name') or user.get_full_name() or user.username or 'Guest'
        c_email = data.get('customer_email') or user.email or 'customer@menshub.com'
        
        order = serializer.save(
            user=user,
            customer_name=c_name,
            customer_email=c_email,
            phone=data.get('phone') or 'N/A',
            city=data.get('city') or 'N/A',
            address=data.get('address') or 'N/A',
            pincode=data.get('pincode') or 'N/A',
            status=data.get('status', 'pending'),
            payment_status=data.get('payment_status', 'success')
        )
        
        print(f"DEBUG: Order saved with ID {order.id}, Name: {order.customer_name}")
        
        # Create notification for admin and trigger WebSocket event only if order is already paid/success
        if order.payment_status == 'success':
            try:
                create_order_notification(order)
                print(f"DEBUG: Notification triggered successfully for paid order {order.order_number}")
            except Exception as e:
                print(f"DEBUG: Notification error: {str(e)}")
                import traceback
                traceback.print_exc()
    
    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """Update order status - admin only."""
        # Check admin permission
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        try:
            profile = UserProfile.objects.get(user=request.user)
            if not profile.is_admin:
                return Response(
                    {'error': 'Admin access required'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except UserProfile.DoesNotExist:
            admin_emails = ['menshubadmin01@gmail.com', 'mubarak.ali@menshub.com', 'mubarakstr003@gmail.com']
            if request.user.email not in admin_emails:
                return Response(
                    {'error': 'Admin access required'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        order = self.get_object()
        status_value = request.data.get('status')
        tracking_number = request.data.get('tracking_number')
        
        if status_value and status_value in dict(Order.STATUS_CHOICES):
            order.status = status_value
            if tracking_number:
                order.tracking_number = tracking_number
            order.save()
            serializer = self.get_serializer(order)
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        return Response(
            {'error': 'Invalid status'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=False, methods=['get'])
    def my_orders(self, request):
        """Get all orders for the current user."""
        orders = self.get_queryset()
        serializer = self.get_serializer(orders, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def track(self, request, pk=None):
        """Get tracking information for an order."""
        order = self.get_object()
        return Response({
            'order_number': order.order_number,
            'status': order.status,
            'tracking_number': order.tracking_number,
            'created_at': order.created_at,
            'updated_at': order.updated_at,
            'total_amount': order.total_amount,
            'items': order.items
        })
    
    @action(detail=False, methods=['post'])
    def initiate_payment(self, request):
        """Initiate Cashfree payment session."""
        try:
            import requests as py_requests
            
            # Get Cashfree credentials from settings
            cashfree_app_id = getattr(settings, 'CASHFREE_APP_ID', None)
            cashfree_secret = getattr(settings, 'CASHFREE_SECRET_KEY', None)
            cashfree_mode = getattr(settings, 'CASHFREE_MODE', 'TEST')
            
            if not cashfree_app_id or not cashfree_secret:
                return Response(
                    {'error': 'Cashfree credentials not configured'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            order_id = request.data.get('order_id')
            amount = float(request.data.get('amount', 0))
            customer_name = request.data.get('customer_name', 'Customer')
            customer_email = request.data.get('customer_email', '')
            customer_phone = request.data.get('customer_phone', '')
            
            if not order_id or amount <= 0:
                return Response(
                    {'error': 'Invalid order_id or amount'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create random customer_id if not authenticated or missing
            cust_id = f"cust_{request.user.id}" if request.user and request.user.is_authenticated else f"cust_guest_{order_id}"
            
            # Use real Cashfree PG API endpoint
            cashfree_url = "https://sandbox.cashfree.com/pg/orders" if cashfree_mode == 'TEST' else "https://api.cashfree.com/pg/orders"
            
            headers = {
                "x-client-id": cashfree_app_id,
                "x-client-secret": cashfree_secret,
                "x-api-version": "2023-08-01",
                "Content-Type": "application/json"
            }
            
            # Check phone and email are not empty or invalid (Cashfree requirements)
            valid_phone = customer_phone if customer_phone and len(customer_phone) >= 10 else "9999999999"
            valid_email = customer_email if customer_email else "customer@menshub.com"
            
            session_data = {
                'order_id': str(order_id),
                'order_amount': amount,
                'order_currency': 'INR',
                'customer_details': {
                    'customer_id': cust_id,
                    'customer_name': customer_name,
                    'customer_email': valid_email,
                    'customer_phone': valid_phone
                },
                'order_meta': {
                    'return_url': f"{settings.FRONTEND_URL}/orders?payment=success&order_id={order_id}"
                }
            }
            
            # Make the API call to Cashfree to generate a real session
            response = py_requests.post(cashfree_url, json=session_data, headers=headers, timeout=10)
            
            if response.status_code not in [200, 201]:
                print(f"❌ Cashfree response error ({response.status_code}): {response.text}")
                return Response(
                    {'error': f"Cashfree API Error: {response.text}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            res_json = response.json()
            payment_session_id = res_json.get('payment_session_id')
            cf_order_id = res_json.get('order_id')
            
            if not payment_session_id:
                print(f"❌ Cashfree did not return payment_session_id: {res_json}")
                return Response(
                    {'error': 'Cashfree payment session creation failed'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            print(f"✅ Real Cashfree Payment Session Created: Order {cf_order_id} - ₹{amount}")
            
            return Response({
                'status': 'success',
                'payment_session_id': payment_session_id,
                'order_id': cf_order_id,
                'amount': amount,
                'mode': cashfree_mode,
                'message': 'Payment session created. Launching Cashfree checkout...'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"❌ Payment initiation error: {str(e)}")
            return Response(
                {'error': f'Payment initiation failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def verify_payment(self, request):
        """Verify Cashfree payment callback."""
        try:
            import requests as py_requests
            
            order_id = request.data.get('order_id')
            payment_id = request.data.get('payment_id') # Might be empty on check init
            
            if not order_id:
                return Response({'error': 'order_id required'}, status=status.HTTP_400_BAD_REQUEST)
                
            # Get Cashfree credentials from settings
            cashfree_app_id = getattr(settings, 'CASHFREE_APP_ID', None)
            cashfree_secret = getattr(settings, 'CASHFREE_SECRET_KEY', None)
            cashfree_mode = getattr(settings, 'CASHFREE_MODE', 'TEST')
            
            if not cashfree_app_id or not cashfree_secret:
                return Response(
                    {'error': 'Cashfree credentials not configured'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
            # Query Cashfree API directly for security check
            base_url = "https://sandbox.cashfree.com/pg/orders" if cashfree_mode == 'TEST' else "https://api.cashfree.com/pg/orders"
            verify_url = f"{base_url}/{order_id}"
            
            headers = {
                "x-client-id": cashfree_app_id,
                "x-client-secret": cashfree_secret,
                "x-api-version": "2023-08-01"
            }
            
            response = py_requests.get(verify_url, headers=headers, timeout=10)
            
            if response.status_code != 200:
                print(f"❌ Cashfree verification API failed ({response.status_code}): {response.text}")
                return Response(
                    {'error': f"Cashfree Verification Error: {response.text}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            res_json = response.json()
            cashfree_status = res_json.get('order_status', '').upper()
            
            # Fetch payments details to find the transaction ID
            payments_url = f"{base_url}/{order_id}/payments"
            payments_response = py_requests.get(payments_url, headers=headers, timeout=10)
            txn_id = payment_id
            pay_method = 'upi'
            if payments_response.status_code == 200:
                payments_list = payments_response.json()
                if isinstance(payments_list, list) and len(payments_list) > 0:
                    latest_payment = payments_list[0]
                    txn_id = latest_payment.get('cf_payment_id', payment_id)
                    pay_method = latest_payment.get('payment_group', 'upi')
            
            # Update order with payment info
            try:
                order = Order.objects.get(order_number=order_id)
                order.payment_id = txn_id
                
                if cashfree_status == 'PAID':
                    order.payment_status = 'success'
                    order.payment_method = pay_method
                    order.status = 'processing'
                    order.save()
                    
                    # Create notification for admin now that order is paid
                    try:
                        create_order_notification(order)
                        print(f"DEBUG: Notification triggered successfully for verified paid order {order_id}")
                    except Exception as e:
                        print(f"DEBUG: Notification error: {str(e)}")
                elif cashfree_status in ['FAILED', 'CANCELLED']:
                    order.payment_status = 'failed'
                    order.status = 'cancelled'
                    order.save()
                else:
                    order.payment_status = 'pending'
                    order.status = 'pending'
                    order.save()
                
                print(f"✅ Real Payment verified: Order {order_id} - Cashfree Status: {cashfree_status} -> DB Status: {order.payment_status}")
                
                serializer = self.get_serializer(order)
                return Response({
                    'status': 'success',
                    'cashfree_status': cashfree_status,
                    'payment_status': order.payment_status,
                    'message': f'Payment is {order.payment_status}',
                    'order': serializer.data
                }, status=status.HTTP_200_OK)
            
            except Order.DoesNotExist:
                return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
        
        except Exception as e:
            print(f"❌ Payment verification error: {str(e)}")
            return Response(
                {'error': f'Verification failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def request_exchange(self, request, pk=None):
        """Create an exchange request for a product in the order."""
        try:
            order = self.get_object()
            
            # Check if order is eligible for exchange (3-4 days from delivery)
            if not order.is_delivered:
                return Response(
                    {'error': 'Order must be delivered first'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if order.exchange_eligible_until and timezone.now() > order.exchange_eligible_until:
                return Response(
                    {'error': f'Exchange window expired. Eligible until {order.exchange_eligible_until}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create exchange request
            product_id = request.data.get('product_id')
            product_name = request.data.get('product_name', '')
            size_old = request.data.get('size_old')
            size_new = request.data.get('size_new')
            reason = request.data.get('reason')  # 'too_small', 'too_large', etc
            reason_desc = request.data.get('reason_description', '')
            
            if not all([product_id, size_old, size_new, reason]):
                return Response(
                    {'error': 'product_id, size_old, size_new, and reason are required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            exchange_req = ExchangeRequest.objects.create(
                order=order,
                product_id=product_id,
                product_name=product_name,
                size_old=size_old,
                size_new=size_new,
                reason=reason,
                reason_description=reason_desc,
                status='pending'
            )
            
            # Update order exchange status
            order.exchange_status = 'pending'
            order.save()
            
            print(f"✅ Exchange request created: Order {order.order_number} - {product_name} ({size_old}→{size_new})")
            
            return Response({
                'status': 'success',
                'message': 'Exchange request submitted. Admin will review shortly.',
                'exchange_id': exchange_req.id,
                'exchange_request': {
                    'id': exchange_req.id,
                    'product_name': exchange_req.product_name,
                    'size_old': exchange_req.size_old,
                    'size_new': exchange_req.size_new,
                    'reason': exchange_req.reason,
                    'status': exchange_req.status,
                    'requested_at': exchange_req.requested_at
                }
            }, status=status.HTTP_201_CREATED)
        
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"❌ Exchange request error: {str(e)}")
            return Response(
                {'error': f'Failed to create exchange request: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def exchange_status(self, request, pk=None):
        """Get exchange request status for an order."""
        try:
            order = self.get_object()
            exchanges = order.exchange_requests.all()
            
            exchange_data = []
            for ex in exchanges:
                exchange_data.append({
                    'id': ex.id,
                    'product_name': ex.product_name,
                    'size_old': ex.size_old,
                    'size_new': ex.size_new,
                    'reason': ex.reason,
                    'status': ex.status,
                    'admin_comment': ex.admin_comment,
                    'requested_at': ex.requested_at,
                    'approved_at': ex.approved_at,
                    'return_label_url': ex.return_label_url,
                    'replacement_tracking': ex.replacement_tracking
                })
            
            return Response({
                'order_id': order.order_number,
                'order_exchange_status': order.exchange_status,
                'exchanges': exchange_data,
                'eligible_until': order.exchange_eligible_until
            }, status=status.HTTP_200_OK)
        
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)


class ExchangeRequestViewSet(viewsets.ModelViewSet):
    """ViewSet for managing exchange requests - admin only."""
    queryset = ExchangeRequest.objects.all()
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        # We'll need to create an ExchangeRequestSerializer
        # For now, return a generic response
        return OrderSerializer
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get all pending exchange requests."""
        exchanges = ExchangeRequest.objects.filter(status='pending').order_by('-requested_at')
        
        data = []
        for ex in exchanges:
            data.append({
                'id': ex.id,
                'order_id': ex.order.order_number,
                'customer_name': ex.order.customer_name,
                'customer_email': ex.order.customer_email,
                'product_name': ex.product_name,
                'size_old': ex.size_old,
                'size_new': ex.size_new,
                'reason': ex.reason,
                'reason_description': ex.reason_description,
                'status': ex.status,
                'requested_at': ex.requested_at
            })
        
        return Response({
            'count': len(data),
            'pending_exchanges': data
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['patch'])
    def approve(self, request, pk=None):
        """Admin approve an exchange request."""
        try:
            exchange = ExchangeRequest.objects.get(id=pk)
            
            exchange.status = 'approved'
            exchange.approved_at = timezone.now()
            exchange.admin_comment = request.data.get('admin_comment', '')
            exchange.return_label_url = request.data.get('return_label_url', '')
            exchange.save()
            
            # Update order
            order = exchange.order
            order.exchange_status = 'approved'
            order.save()
            
            print(f"✅ Exchange approved: Order {order.order_number} - {exchange.product_name}")
            
            return Response({
                'status': 'success',
                'message': f'Exchange approved. Waiting for customer to return item.',
                'exchange_id': exchange.id,
                'exchange_status': exchange.status
            }, status=status.HTTP_200_OK)
        
        except ExchangeRequest.DoesNotExist:
            return Response({'error': 'Exchange request not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['patch'])
    def reject(self, request, pk=None):
        """Admin reject an exchange request."""
        try:
            exchange = ExchangeRequest.objects.get(id=pk)
            
            exchange.status = 'rejected'
            exchange.admin_comment = request.data.get('admin_comment', 'Request rejected')
            exchange.save()
            
            # Update order
            order = exchange.order
            order.exchange_status = 'rejected'
            order.save()
            
            print(f"❌ Exchange rejected: Order {order.order_number} - {exchange.product_name}")
            
            return Response({
                'status': 'success',
                'message': 'Exchange request rejected.',
                'exchange_id': exchange.id,
                'exchange_status': exchange.status,
                'admin_comment': exchange.admin_comment
            }, status=status.HTTP_200_OK)
        
        except ExchangeRequest.DoesNotExist:
            return Response({'error': 'Exchange request not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['patch'])
    def mark_return_received(self, request, pk=None):
        """Admin mark return shipment as received."""
        try:
            exchange = ExchangeRequest.objects.get(id=pk)
            
            exchange.status = 'return_received'
            exchange.return_received_at = timezone.now()
            exchange.save()
            
            print(f"📦 Return received: Order {exchange.order.order_number} - {exchange.product_name}")
            
            return Response({
                'status': 'success',
                'message': 'Return marked as received. Preparing replacement...',
                'exchange_status': exchange.status
            }, status=status.HTTP_200_OK)
        
        except ExchangeRequest.DoesNotExist:
            return Response({'error': 'Exchange request not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['patch'])
    def ship_replacement(self, request, pk=None):
        """Admin ship replacement product."""
        try:
            exchange = ExchangeRequest.objects.get(id=pk)
            
            exchange.status = 'replacement_shipped'
            exchange.replacement_tracking = request.data.get('tracking_number', '')
            exchange.replacement_shipped_at = timezone.now()
            exchange.save()
            
            print(f"🚚 Replacement shipped: Order {exchange.order.order_number} - Tracking: {exchange.replacement_tracking}")
            
            return Response({
                'status': 'success',
                'message': f'Replacement shipped with tracking {exchange.replacement_tracking}',
                'exchange_status': exchange.status,
                'replacement_tracking': exchange.replacement_tracking
            }, status=status.HTTP_200_OK)
        
        except ExchangeRequest.DoesNotExist:
            return Response({'error': 'Exchange request not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['patch'])
    def complete(self, request, pk=None):
        """Admin mark exchange as complete."""
        try:
            exchange = ExchangeRequest.objects.get(id=pk)
            
            exchange.status = 'completed'
            exchange.completed_at = timezone.now()
            exchange.save()
            
            # Update order
            order = exchange.order
            order.exchange_status = 'completed'
            order.save()
            
            print(f"✅ Exchange completed: Order {order.order_number} - {exchange.product_name}")
            
            return Response({
                'status': 'success',
                'message': 'Exchange process completed.',
                'exchange_status': exchange.status
            }, status=status.HTTP_200_OK)
        
        except ExchangeRequest.DoesNotExist:
            return Response({'error': 'Exchange request not found'}, status=status.HTTP_404_NOT_FOUND)


class CartViewSet(viewsets.ModelViewSet):
    """ViewSet for Cart model - permanent user-based storage."""
    serializer_class = CartSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self) -> Any:
        return Cart.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get', 'post'])
    def current(self, request):
        """Get or create current user's cart."""
        cart, created = Cart.objects.get_or_create(user=request.user)
        if request.method == 'POST':
            cart.items_data = request.data.get('items_data', [])
            cart.save()
        serializer = self.get_serializer(cart)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def update_items(self, request):
        """Update cart items for current user."""
        cart, created = Cart.objects.get_or_create(user=request.user)
        cart.items_data = request.data.get('items_data', [])
        cart.save()
        serializer = self.get_serializer(cart)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def clear(self, request):
        """Clear cart for current user."""
        Cart.objects.filter(user=request.user).update(items_data=[])
        cart, _ = Cart.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(cart)
        return Response(serializer.data)


class WishlistViewSet(viewsets.ModelViewSet):
    """ViewSet for Wishlist model - permanent user-based storage."""
    serializer_class = WishlistSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self) -> Any:
        return Wishlist.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get', 'post'])
    def current(self, request):
        """Get or create current user's wishlist."""
        wishlist, created = Wishlist.objects.get_or_create(user=request.user)
        if request.method == 'POST':
            wishlist.product_ids = request.data.get('product_ids', [])
            wishlist.save()
        serializer = self.get_serializer(wishlist)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def update_items(self, request):
        """Update wishlist items for current user."""
        wishlist, created = Wishlist.objects.get_or_create(user=request.user)
        wishlist.product_ids = request.data.get('product_ids', [])
        wishlist.save()
        serializer = self.get_serializer(wishlist)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def add_product(self, request):
        """Add a product to wishlist."""
        wishlist, _ = Wishlist.objects.get_or_create(user=request.user)
        product_id = request.data.get('product_id')
        if product_id:
            if product_id not in wishlist.product_ids:
                wishlist.product_ids.append(product_id)
                wishlist.save()
        serializer = self.get_serializer(wishlist)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def remove_product(self, request):
        """Remove a product from wishlist."""
        wishlist, _ = Wishlist.objects.get_or_create(user=request.user)
        product_id = request.data.get('product_id')
        if product_id and product_id in wishlist.product_ids:
            wishlist.product_ids.remove(product_id)
            wishlist.save()
        serializer = self.get_serializer(wishlist)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def clear(self, request):
        """Clear wishlist for current user."""
        Wishlist.objects.filter(user=request.user).update(product_ids=[])
        wishlist, _ = Wishlist.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(wishlist)
        return Response(serializer.data)


class BannerViewSet(viewsets.ModelViewSet):
    """ViewSet for Banner model."""
    queryset = Banner.objects.all()
    serializer_class = BannerSerializer
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get active banners."""
        banners = Banner.objects.filter(is_active=True)
        serializer = self.get_serializer(banners, many=True)
        return Response(serializer.data)


class OrderNotificationViewSet(viewsets.ModelViewSet):
    """ViewSet for Order Notifications - Admin only."""
    queryset = OrderNotification.objects.all().distinct()
    serializer_class = OrderNotificationSerializer
    
    def get_queryset(self) -> Any:
        """Return all notifications ordered by creation date."""
        return OrderNotification.objects.all().distinct().order_by('-created_at')
    
    @action(detail=False, methods=['get'])
    def unread(self, request):
        """Get all unread notifications."""
        unread_notifications = OrderNotification.objects.filter(is_read=False).distinct().order_by('-created_at')
        serializer = self.get_serializer(unread_notifications, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def count(self, request):
        """Get count of unread notifications."""
        count = OrderNotification.objects.filter(is_read=False).distinct().count()
        return Response({'unread_count': count})
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Mark a notification as read."""
        notification = self.get_object()
        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save()
        serializer = self.get_serializer(notification)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def dismiss(self, request, pk=None):
        """Dismiss/delete a notification."""
        notification = self.get_object()
        notification.delete()
        return Response({'status': 'notification dismissed', 'id': pk}, status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        """Mark all notifications as read."""
        unread_count = OrderNotification.objects.filter(is_read=False).update(
            is_read=True,
            read_at=timezone.now()
        )
        return Response({'marked_as_read': unread_count})
    
    @action(detail=False, methods=['post'])
    def cleanup(self, request):
        """Clean up old duplicate notifications (keep only the latest for each order)."""
        from django.db.models import Max
        
        # Get latest notification ID for each order
        latest_notifications = OrderNotification.objects.values('order_id').annotate(
            latest_id=Max('id')
        )
        latest_ids = [item['latest_id'] for item in latest_notifications]
        
        # Delete all notifications except the latest ones
        deleted_count, _ = OrderNotification.objects.exclude(id__in=latest_ids).delete()
        
        return Response({
            'status': 'cleanup completed',
            'deleted_count': deleted_count,
            'remaining_notifications': OrderNotification.objects.count()
        })


class AddressViewSet(viewsets.ModelViewSet):
    """ViewSet for User Addresses."""
    serializer_class = AddressSerializer
    
    def get_queryset(self) -> Any:
        """Return addresses for the current user."""
        return Address.objects.filter(user=self.request.user).order_by('-is_default', '-created_at')
    
    def perform_create(self, serializer: Any) -> None:
        """Create address for current user."""
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def default(self, request):
        """Get the default address for the user."""
        address = Address.objects.filter(user=request.user, is_default=True).first()
        if address:
            serializer = self.get_serializer(address)
            return Response(serializer.data)
        return Response({'detail': 'No default address set'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def set_default(self, request, pk=None):
        """Set this address as default."""
        address = self.get_object()
        # Remove default from other addresses
        Address.objects.filter(user=request.user).update(is_default=False)
        # Set this as default
        address.is_default = True
        address.save()
        serializer = self.get_serializer(address)
        return Response(serializer.data)


@api_view(['GET'])
def api_root(request):
    """Root API endpoint."""
    return Response({
        'message': 'Welcome to Mens Hub API',
        'version': '1.0',
        'endpoints': {
            'categories': '/api/categories/',
            'products': '/api/products/',
            'orders': '/api/orders/',
            'cart': '/api/cart/',
            'wishlist': '/api/wishlist/',
            'banners': '/api/banners/',
            'notifications': '/api/notifications/',
            'auth/google/': '/api/auth/google/',
        }
    })


@api_view(['POST'])
def google_oauth_login(request):
    """
    Google OAuth login endpoint.
    Expects a POST request with 'token' field containing the Google ID token.
    Verifies the token, creates/updates user in database, and returns auth token.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        google_token = request.data.get('token')
        
        if not google_token:
            logger.warning('Google OAuth: No token provided')
            return Response(
                {'error': 'Token is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if GOOGLE_CLIENT_ID is configured
        if not settings.GOOGLE_CLIENT_ID:
            logger.error('Google OAuth: GOOGLE_CLIENT_ID not configured in settings')
            return Response(
                {'error': 'Server configuration error: GOOGLE_CLIENT_ID not set'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        logger.debug(f'Google OAuth: Verifying token with client ID: {settings.GOOGLE_CLIENT_ID[:20]}...')
        
        # Verify the Google ID token
        try:
            idinfo = id_token.verify_oauth2_token(
                google_token,
                requests.Request(),
                settings.GOOGLE_CLIENT_ID
            )
            logger.debug('Google OAuth: Token verified successfully')
        except ValueError as e:
            logger.error(f'Google OAuth: Token verification failed: {str(e)}')
            raise ValueError(f'Token verification failed: {str(e)}')
        
        # Extract user information from token
        email = idinfo.get('email')
        name = idinfo.get('name')
        google_id = idinfo.get('sub')  # Unique Google ID
        picture = idinfo.get('picture')
        
        logger.debug(f'Google OAuth: Extracted user info - email: {email}, google_id: {google_id}')
        
        if not email or not google_id:
            logger.warning(f'Google OAuth: Invalid token - missing email or google_id')
            return Response(
                {'error': 'Invalid token: missing email or google_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create or update GoogleUser
        google_user, created = GoogleUser.objects.update_or_create(
            google_id=google_id,
            defaults={
                'email': email,
                'name': name or email,
                'picture': picture,
            }
        )
        logger.debug(f'Google OAuth: GoogleUser {"created" if created else "updated"}')
        
        # Generate username from email (remove special characters)
        base_username = email.split('@')[0].replace('.', '_').replace('+', '_')
        username = base_username
        
        # Check if user with this email already exists
        user = User.objects.filter(email=email).first()
        user_created = False
        
        if user:
            logger.debug(f'Google OAuth: Found existing user by email: {email}')
        else:
            # Ensure username is unique for new user
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}_{counter}"
                counter += 1
            
            # Create new user
            user = User.objects.create(
                username=username,
                email=email,
                first_name=name.split()[0] if name else '',
                last_name=name.split()[1] if len(name.split()) > 1 else '',
            )
            user_created = True
            logger.debug(f'Google OAuth: Created new user: {username}')
        
        logger.debug(f'Google OAuth: User {"created" if user_created else "retrieved"}')
        
        # If user exists, update email and name if changed
        if not user_created:
            user.email = email
            if name and not user.first_name:
                user.first_name = name.split()[0] if name else ''
            if name and len(name.split()) > 1 and not user.last_name:
                user.last_name = name.split()[1]
            user.save()
        
        # Link GoogleUser to User if not already linked
        if not google_user.user:
            google_user.user = user
            google_user.save()
        
        # Create or update user profile for Google users
        from .models import UserProfile
        # Admin emails - add all authorized admin emails here
        admin_emails = ['menshubadmin01@gmail.com', 'mubarak.ali@menshub.com', 'mubarakstr003@gmail.com']
        is_admin = email in admin_emails
        
        try:
            profile = UserProfile.objects.get(user=user)  # type: ignore
            profile.is_admin = is_admin
            profile.save()
        except UserProfile.DoesNotExist:
            UserProfile.objects.create(
                user=user,
                is_admin=is_admin,
                country_code='+91'
            )
        
        # Get or create authentication token for user
        auth_token, _ = Token.objects.get_or_create(user=user)
        logger.info(f'Google OAuth: Login successful for {email}, Admin: {is_admin}')
        
        return Response({
            'success': True,
            'token': auth_token.key,
            'user': {
                'id': int(user.pk),
                'email': user.email,
                'name': user.get_full_name() or user.username,
                'username': user.username,
                'google_id': google_id,
                'picture': picture,
                'isAdmin': is_admin
            }
        }, status=status.HTTP_200_OK)
    
    except ValueError as e:
        logger.error(f'Google OAuth: ValueError - {str(e)}')
        return Response(
            {'error': f'Invalid token: {str(e)}'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    except Exception as e:
        logger.error(f'Google OAuth: Unexpected error - {str(e)}', exc_info=True)
        return Response(
            {'error': f'Authentication failed: {str(e)}', 'type': type(e).__name__},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
def register_user(request):
    """
    User registration with email and password.
    Expects: email, password, name, phone
    Returns: user data and auth token
    
    Phone validation:
    - Must be 10 digits
    - Must start with 6, 7, 8, or 9
    - Default country code is +91 (India)
    """
    try:
        email = request.data.get('email', '').strip()
        password = request.data.get('password', '').strip()
        name = request.data.get('name', '').strip()
        phone = request.data.get('phone', '').strip()
        
        # Validation checks
        if not all([email, password, name]):
            return Response(
                {'error': 'Email, password, and name are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(password) < 6:
            return Response(
                {'error': 'Password must be at least 6 characters'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate phone number if provided
        phone_clean = None
        if phone:
            # Remove any spaces or hyphens
            phone_clean = phone.replace(' ', '').replace('-', '').replace('+91', '')
            
            # Check if it's exactly 10 digits
            if not phone_clean.isdigit() or len(phone_clean) != 10:
                return Response(
                    {'error': 'Phone number must be exactly 10 digits'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if it starts with 6, 7, 8, or 9
            if phone_clean[0] not in ['6', '7', '8', '9']:
                return Response(
                    {'error': 'Phone number must start with 6, 7, 8, or 9'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Check if email already exists
        if User.objects.filter(email=email).exists():
            return Response(
                {'error': 'Email already registered'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create user
        username = email.split('@')[0].replace('.', '_')
        counter = 1
        original_username = username
        while User.objects.filter(username=username).exists():
            username = f"{original_username}_{counter}"
            counter += 1
        
        try:
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=name.split()[0] if name else '',
                last_name=' '.join(name.split()[1:]) if len(name.split()) > 1 else ''
            )
            
            # Create user profile with phone number
            from .models import UserProfile
            UserProfile.objects.create(
                user=user,
                phone=phone_clean if phone else None,
                country_code='+91',
                is_admin=False
            )
            
            # Create auth token
            token, _ = Token.objects.get_or_create(user=user)
            
            return Response({
                'success': True,
                'token': token.key,
                'user': {
                    'id': user.pk,
                    'email': user.email,
                    'name': user.get_full_name() or user.username,
                    'username': user.username,
                    'phone': f"+91{phone_clean}" if phone else None,
                    'isAdmin': user.is_staff
                }
            }, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            return Response(
                {'error': f'Failed to create user: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response(
            {'error': f'Registration failed: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )



@api_view(['POST'])
def login_user(request):
    """
    User login with email and password.
    Expects: email, password
    Returns: user data and auth token
    
    Admin credentials:
    - Email: mubarak.ali@menshub.com or admin email
    - Password: S@kMf$34
    """
    try:
        email = request.data.get('email', '').strip()
        password = request.data.get('password', '').strip()
        
        if not email or not password:
            return Response(
                {'error': 'Email and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get user by email - handle multiple users with same email
        try:
            # Use filter().first() to get the first user instead of raising MultipleObjectsReturned
            user = User.objects.filter(email=email).first()
            if not user:
                return Response(
                    {'error': 'Invalid email or password'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
        except Exception as e:
            return Response(
                {'error': 'Invalid email or password'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Check password
        if not user.check_password(password):
            return Response(
                {'error': 'Invalid email or password'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Get or create token
        token, _ = Token.objects.get_or_create(user=user)
        
        # Get or create user profile
        from .models import UserProfile
        admin_emails = ['menshubadmin01@gmail.com', 'mubarak.ali@menshub.com', 'mubarakstr003@gmail.com']
        is_admin = user.is_staff or email in admin_emails
        
        profile, created = UserProfile.objects.get_or_create(user=user)
        if not created or profile.is_admin != is_admin:
            profile.is_admin = is_admin
            profile.save()
        
        phone = profile.phone if profile else None
        
        return Response({
            'success': True,
            'token': token.key,
            'user': {
                'id': user.pk,
                'email': user.email,
                'name': user.get_full_name() or user.username,
                'username': user.username,
                'phone': f"+91{phone}" if phone else None,
                'isAdmin': is_admin
            }
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response(
            {'error': f'Login failed: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
def create_order_with_notification(request):
    """
    Create an order and automatically generate a real-time notification for admin.
    
    This endpoint:
    1. Creates a new Order
    2. Creates OrderNotification record
    3. Triggers WebSocket event to notify connected admins in real-time
    
    Request body:
    {
        "customer_name": "John Doe",
        "customer_email": "john@example.com",
        "total_amount": 5999.99,
        "address": "123 Main St",
        "pincode": "123456",
        "items": [
            {
                "product_name": "T-Shirt",
                "quantity": 2,
                "price": 500,
                "size": "M"
            }
        ]
    }
    """
    try:
        # Extract order data from request
        customer_name = request.data.get('customer_name')
        customer_email = request.data.get('customer_email')
        total_amount = request.data.get('total_amount')
        address = request.data.get('address')
        pincode = request.data.get('pincode')
        items = request.data.get('items', [])
        
        # Validation
        if not all([customer_name, customer_email, total_amount]):
            return Response(
                {'error': 'Missing required fields: customer_name, customer_email, total_amount'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create Order
        order = Order.objects.create(
            customer_name=customer_name,
            customer_email=customer_email,
            total_amount=total_amount,
            address=address,
            pincode=pincode,
            items=items,
            status='pending'
        )
        
        # Create OrderNotification and trigger WebSocket event
        notification = create_order_notification(order)
        
        # Return created order with notification info
        serializer = OrderSerializer(order)
        return Response({
            'success': True,
            'order': serializer.data,
            'notification': {
                'id': notification.id if notification else None,
                'order_number': order.order_number,
                'message': f'New order {order.order_number} from {customer_name}',
                'created_at': order.created_at,
                'websocket_status': 'notification_sent_to_admins'
            }
        }, status=status.HTTP_201_CREATED)
    
    except Exception as e:
        return Response(
            {'error': f'Failed to create order: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )


# =====================================================================
# ADMIN CONTACT & SUPPORT ENDPOINTS
# =====================================================================

class AdminContactViewSet(viewsets.ModelViewSet):
    """ViewSet for Admin Contact Information - Admin only."""
    queryset = AdminContact.objects.all()
    serializer_class = AdminContactSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        """Get all admin contacts, filtered by active status."""
        return AdminContact.objects.filter(is_active=True).order_by('-created_at')
    
    @action(detail=False, methods=['get'])
    def get_active_contacts(self, request):
        """Get active admin contact for support."""
        contacts = AdminContact.objects.filter(is_active=True).order_by('-created_at')
        serializer = self.get_serializer(contacts, many=True)
        return Response({
            'success': True,
            'contacts': serializer.data,
            'count': contacts.count()
        }, status=status.HTTP_200_OK)


@api_view(['GET'])
def get_support_contact(request):
    """
    Get admin contact information for customer support.
    
    Returns:
    {
        "success": true,
        "admin_name": "Mubarak",
        "whatsapp_number": "+919876543210",
        "email": "admin@menshub.com",
        "phone": "+919876543210"
    }
    """
    try:
        # Get the active admin contact
        contact = AdminContact.objects.filter(is_active=True).first()
        
        if not contact:
            return Response({
                'success': False,
                'message': 'No active support contact available'
            }, status=status.HTTP_404_NOT_FOUND)
        
        return Response({
            'success': True,
            'admin_name': contact.admin_name,
            'whatsapp_number': contact.whatsapp_number,
            'email': contact.email,
            'phone': contact.phone
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Failed to fetch support contact: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def support_with_order(request):
    """
    Get support contact with order details.
    
    Request body:
    {
        "order_id": 123,
        "order_number": "123456"
    }
    
    Returns:
    {
        "success": true,
        "message": "Support with Order #123456",
        "admin_contact": {
            "admin_name": "Mubarak",
            "whatsapp_number": "+919876543210",
            "email": "admin@menshub.com"
        },
        "order_details": {
            "order_id": 123,
            "order_number": "123456",
            "customer_name": "John Doe",
            "customer_email": "john@example.com",
            "address": "123 Main St, City",
            "pincode": "123456",
            "phone": "9876543210",
            "status": "pending"
        },
        "whatsapp_link": "https://wa.me/919876543210?text=Help%20with%20Order%23123456%20..."
    }
    """
    try:
        order_id = request.data.get('order_id')
        order_number = request.data.get('order_number')
        
        if not order_id and not order_number:
            return Response({
                'success': False,
                'error': 'order_id or order_number is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Fetch order
        try:
            if order_id:
                order = Order.objects.get(id=order_id)
            else:
                order = Order.objects.get(order_number=order_number)
        except Order.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Order not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Fetch admin contact
        contact = AdminContact.objects.filter(is_active=True).first()
        if not contact:
            return Response({
                'success': False,
                'message': 'No active support contact available'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Prepare WhatsApp message
        whatsapp_msg = f"Hello, I need help with Order #{order.order_number}\n"
        whatsapp_msg += f"Customer: {order.customer_name}\n"
        whatsapp_msg += f"Email: {order.customer_email}\n"
        whatsapp_msg += f"Address: {order.address}\n"
        whatsapp_msg += f"Pincode: {order.pincode}\n"
        whatsapp_msg += f"Phone: {order.phone}\n"
        
        # Create WhatsApp link
        import urllib.parse
        whatsapp_link = f"https://wa.me/{contact.whatsapp_number.replace('+', '')}?text={urllib.parse.quote(whatsapp_msg)}"
        
        return Response({
            'success': True,
            'message': f'Support with Order #{order.order_number}',
            'admin_contact': {
                'admin_name': contact.admin_name,
                'whatsapp_number': contact.whatsapp_number,
                'email': contact.email,
                'phone': contact.phone
            },
            'order_details': {
                'order_id': order.id,
                'order_number': order.order_number,
                'customer_name': order.customer_name,
                'customer_email': order.customer_email,
                'address': order.address,
                'pincode': order.pincode,
                'phone': order.phone,
                'status': order.status
            },
            'whatsapp_link': whatsapp_link,
            'support_message': whatsapp_msg
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({
            'success': False,
            'error': f'Failed to get support contact: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)