
# Additional views for AdminContact and Support
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from api.models import AdminContact, Order
from api.serializers import AdminContactSerializer

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
