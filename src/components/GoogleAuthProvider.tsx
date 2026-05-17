import React from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

interface GoogleAuthProviderProps {
  children: React.ReactNode;
}

export const GoogleAuthProvider: React.FC<GoogleAuthProviderProps> = ({ children }) => {
  // Validate configuration
  if (!GOOGLE_CLIENT_ID) {
    console.error('❌ VITE_GOOGLE_CLIENT_ID is not configured in environment variables');
    console.error('   Please check .env.local file and ensure it contains VITE_GOOGLE_CLIENT_ID');
    console.error('   Value received:', import.meta.env.VITE_GOOGLE_CLIENT_ID);
    return <>{children}</>;
  } else {
    console.log('✅ GoogleAuthProvider initialized with Client ID:', GOOGLE_CLIENT_ID.substring(0, 20) + '...');
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {children}
    </GoogleOAuthProvider>
  );
};
