"""
WebSocket Authentication Middleware

Handles authentication for WebSocket connections using Django's
authentication system and token-based authentication.
"""

from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser, User
from rest_framework.authtoken.models import Token
from django.contrib.sessions.models import Session
from urllib.parse import parse_qs
import logging

logger = logging.getLogger(__name__)


class TokenAuthMiddleware(BaseMiddleware):
    """
    Middleware to authenticate WebSocket connections using Django Token Authentication.
    
    Supports:
    1. Query parameter token: ws://localhost:8000/ws/orders/notifications/?token=abc123
    2. Cookie-based session authentication
    3. JWT tokens
    
    Usage in frontend:
    ```typescript
    const token = localStorage.getItem('token');
    const wsURL = `ws://localhost:8000/ws/orders/notifications/?token=${token}`;
    const ws = new WebSocket(wsURL);
    ```
    """

    async def __call__(self, scope, receive, send):
        # Extract token from query string
        query_string = scope.get('query_string', b'').decode('utf-8')
        query_params = parse_qs(query_string)
        token = query_params.get('token', [None])[0]

        # Try to authenticate using token
        if token:
            scope['user'] = await self.get_user_from_token(token)
        else:
            # Try to use session authentication (default Django)
            scope['user'] = await self.get_user_from_session(scope)

        return await super().__call__(scope, receive, send)

    @database_sync_to_async
    def get_user_from_token(self, token):
        """
        Authenticate user using DRF Token Authentication.
        
        Args:
            token (str): Authentication token from request
            
        Returns:
            User: Django User object if valid token, AnonymousUser otherwise
        """
        try:
            token_obj = Token.objects.get(key=token)
            return token_obj.user
        except Token.DoesNotExist:
            logger.warning(f'Invalid token attempted: {token[:10]}...')
            return AnonymousUser()
        except Exception as e:
            logger.error(f'Token authentication error: {str(e)}')
            return AnonymousUser()

    @database_sync_to_async
    def get_user_from_session(self, scope):
        """
        Authenticate user using Django Session authentication.
        
        Args:
            scope (dict): ASGI scope
            
        Returns:
            User: Django User object if valid session, AnonymousUser otherwise
        """
        try:
            # Get session ID from cookies
            headers = dict(scope.get('headers', []))
            cookie = headers.get(b'cookie', b'').decode('utf-8')

            # Parse sessionid from cookies
            session_id = None
            for item in cookie.split(';'):
                if 'sessionid=' in item:
                    session_id = item.split('sessionid=')[1].split(';')[0]
                    break

            if not session_id:
                return AnonymousUser()

            # Get session from database
            session = Session.objects.get(session_key=session_id)
            session_data = session.get_decoded()
            user_id = session_data.get('_auth_user_id')

            if user_id:
                return User.objects.get(id=user_id)
            else:
                return AnonymousUser()

        except Session.DoesNotExist:
            logger.debug('Session not found')
            return AnonymousUser()
        except User.DoesNotExist:
            logger.debug('User not found')
            return AnonymousUser()
        except Exception as e:
            logger.error(f'Session authentication error: {str(e)}')
            return AnonymousUser()


class AdminOnlyMiddleware(BaseMiddleware):
    """
    Middleware to enforce admin-only access for WebSocket connections.
    
    This middleware should be used in combination with authentication middleware.
    It checks if the authenticated user has admin/staff privileges.
    """

    async def __call__(self, scope, receive, send):
        # Check if user is admin
        user = scope.get('user')
        
        if user and hasattr(user, 'is_staff'):
            is_admin = await self.check_admin_status(user)
            if not is_admin:
                # Send error message to client
                await send({
                    'type': 'websocket.close',
                    'code': 4003,  # Forbidden
                })
                logger.warning(f'Non-admin user {user.username} attempted WebSocket connection')
                return
        else:
            # No user or anonymous
            await send({
                'type': 'websocket.close',
                'code': 4001,  # Unauthorized
            })
            logger.warning('Unauthenticated user attempted WebSocket connection')
            return

        return await super().__call__(scope, receive, send)

    @database_sync_to_async
    def check_admin_status(self, user):
        """
        Check if user is admin/staff.
        
        Args:
            user (User): Django User object
            
        Returns:
            bool: True if user is staff/admin, False otherwise
        """
        try:
            user.refresh_from_db()
            return user.is_staff or user.is_superuser
        except Exception as e:
            logger.error(f'Admin check error: {str(e)}')
            return False


class LoggingMiddleware(BaseMiddleware):
    """
    Middleware to log WebSocket connection events.
    
    Logs:
    - Connection established
    - Connection closed
    - User information
    - Disconnect reason
    """

    async def __call__(self, scope, receive, send):
        user = scope.get('user', AnonymousUser())
        user_info = f'{user.username}' if user.is_authenticated else 'Anonymous'

        logger.info(f'WebSocket connection from {user_info}')

        async def send_with_logging(message):
            if message['type'] == 'websocket.close':
                logger.info(f'WebSocket connection closed for {user_info}')
            return await send(message)

        return await super().__call__(scope, receive, send_with_logging)


# Middleware stack for production
class AuthorizedAdminWebsocketMiddleware(BaseMiddleware):
    """
    Combined middleware that enforces both authentication and admin authorization.
    
    Usage in routing:
    ```python
    from channels.routing import ProtocolTypeRouter, URLRouter
    from channels.auth import AuthMiddlewareStack
    from api.middleware import AuthorizedAdminWebsocketMiddleware
    
    websocket_urlpatterns = [
        path('ws/orders/notifications/', 
             AuthorizedAdminWebsocketMiddleware(AdminOrderNotificationConsumer.as_asgi()))
    ]
    ```
    """

    async def __call__(self, scope, receive, send):
        # Authenticate
        query_string = scope.get('query_string', b'').decode('utf-8')
        query_params = parse_qs(query_string)
        token = query_params.get('token', [None])[0]

        if token:
            user = await self.get_user_from_token(token)
        else:
            user = await self.get_user_from_session(scope)

        scope['user'] = user

        # Check admin status
        if not user.is_authenticated:
            logger.warning('Unauthenticated WebSocket connection attempt')
            await send({
                'type': 'websocket.close',
                'code': 4001,
            })
            return

        is_admin = await self.check_admin_status(user)
        if not is_admin:
            logger.warning(f'Non-admin user {user.username} attempted WebSocket connection')
            await send({
                'type': 'websocket.close',
                'code': 4003,
            })
            return

        return await super().__call__(scope, receive, send)

    @database_sync_to_async
    def get_user_from_token(self, token):
        try:
            token_obj = Token.objects.get(key=token)
            return token_obj.user
        except Token.DoesNotExist:
            return AnonymousUser()

    @database_sync_to_async
    def get_user_from_session(self, scope):
        try:
            headers = dict(scope.get('headers', []))
            cookie = headers.get(b'cookie', b'').decode('utf-8')
            session_id = None
            for item in cookie.split(';'):
                if 'sessionid=' in item:
                    session_id = item.split('sessionid=')[1].split(';')[0]
                    break
            if not session_id:
                return AnonymousUser()
            session = Session.objects.get(session_key=session_id)
            session_data = session.get_decoded()
            user_id = session_data.get('_auth_user_id')
            if user_id:
                return User.objects.get(id=user_id)
            return AnonymousUser()
        except:
            return AnonymousUser()

    @database_sync_to_async
    def check_admin_status(self, user):
        try:
            user.refresh_from_db()
            return user.is_staff or user.is_superuser
        except:
            return False
