import { useState } from 'react';
import { GoogleLogin as GoogleLoginComponent } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

interface GoogleLoginProps {
  onSuccess?: (userData: any) => void;
  onError?: (error: any) => void;
  className?: string;
  showDebug?: boolean;
}

interface DecodedToken {
  email: string;
  name: string;
  sub: string;
  picture?: string;
}

// Admin email configuration
const ADMIN_EMAIL = 'menshubadmin01@gmail.com';

export const GoogleLogin: React.FC<GoogleLoginProps> = ({
  onSuccess,
  onError,
  className = '',
  showDebug = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');

  const debug = (message: string, data?: any) => {
    const logMessage = data ? `${message}: ${JSON.stringify(data, null, 2)}` : message;
    if (showDebug) {
      console.log(`🔍 [GoogleLogin] ${logMessage}`);
      setDebugInfo(prev => `${prev}\n✓ ${message}`);
    }
  };

  const handleGoogleLoginSuccess = async (credentialResponse: any) => {
    setIsLoading(true);
    setDebugInfo('');
    
    try {
      debug('Login attempt started');
      debug('Google Client ID from env', import.meta.env.VITE_GOOGLE_CLIENT_ID);
      
      // Decode the token to see the user info
      let decoded: DecodedToken;
      try {
        decoded = jwtDecode(credentialResponse.credential);
        debug('Token decoded successfully', { email: decoded.email, name: decoded.name });
      } catch (decodeError) {
        throw new Error(`Failed to decode token: ${decodeError}`);
      }

      // Get API URL from environment
      const apiUrl = import.meta.env.VITE_API_URL || 'https://dharshan.pythonanywhere.com';
      debug('Using API URL', apiUrl);

      // Send the token to backend
      const endpoint = `${apiUrl}/api/auth/google/`;
      debug('Sending token to backend', endpoint);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: credentialResponse.credential,
        }),
      });

      debug('Backend response status', response.status);

      if (!response.ok) {
        let errorMessage = 'Authentication failed';
        let errorData = null;
        try {
          errorData = await response.json();
          errorMessage = errorData.error || errorData.detail || errorMessage;
          debug('Backend error response', errorData);
        } catch (parseError) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          debug('Could not parse error response', parseError);
        }
        console.error('Backend error details:', { status: response.status, errorData, errorMessage });
        throw new Error(errorMessage);
      }

      const data = await response.json();
      debug('Backend response successful', { token: data.token?.substring(0, 20) + '...' });

      // Check if this is the admin email
      const isAdmin = data.user.email === ADMIN_EMAIL;
      debug('User email', data.user.email);
      debug('Is admin', isAdmin);

      // Add isAdmin flag to user data
      data.user.isAdmin = isAdmin;

      // Store the token in localStorage
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      debug('Auth token stored in localStorage');

      console.log('✅ Login successful:', data.user);

      // Clear debug info after 1 second on success
      setTimeout(() => {
        setDebugInfo('');
      }, 1000);

      // Call the success callback
      if (onSuccess) {
        onSuccess(data.user);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Google login error:', errorMessage, error);
      debug('ERROR', errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLoginError = () => {
    const message = 'Google login button error - may indicate OAuth configuration issue';
    console.error('❌ ' + message);
    debug('ERROR', message);
    setDebugInfo(prev => `${prev}\n❌ ${message}`);
    if (onError) {
      onError(message);
    }
  };



  return (
    <div className={className}>
      <GoogleLoginComponent
        onSuccess={handleGoogleLoginSuccess}
        onError={handleGoogleLoginError}
        text="signin_with"
        shape="rectangular"
        logo_alignment="left"
      />
      
      {/* Debug Info Display */}
      {showDebug && debugInfo && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-900 max-w-md">
          <div className="font-semibold mb-2">📋 Debug Info:</div>
          <pre className="whitespace-pre-wrap break-words text-xs">{debugInfo}</pre>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="mt-2 text-sm text-gray-500">Processing login...</div>
      )}
    </div>
  );
};

