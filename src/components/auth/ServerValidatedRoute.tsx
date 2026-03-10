
import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import AuthErrorBoundary from './AuthErrorBoundary';
import { validateTokenWithRecovery } from '@/utils/tokenManagement';

interface ServerValidatedRouteProps {
  children: React.ReactNode;
}

// Use this component for highly sensitive routes that require
// server-side validation of the authentication token
const ServerValidatedRoute = ({ children }: ServerValidatedRouteProps) => {
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const location = useLocation();
  
  useEffect(() => {
    const validateSession = async () => {
      try {
        setIsValidating(true);
        
        // First check if the token has been revoked
        const isTokenValid = await validateTokenWithRecovery();
        
        if (!isTokenValid) {
          console.error('Token validation failed, token has been revoked');
          setIsValid(false);
          setIsValidating(false);
          return;
        }
        
        // If token is valid, proceed with server validation
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (!sessionData.session) {
          setIsValid(false);
          setIsValidating(false);
          return;
        }
        
        // Make a request to a secure endpoint that requires authentication
        // This verifies the JWT is valid on the server side
        const { error } = await supabase.from('profiles')
          .select('id')
          .eq('id', sessionData.session.user.id)
          .single();
        
        // If we get back a 401/403 error, the token is invalid
        if (error && (error.code === '401' || error.code === '403')) {
          console.error('Server validation failed:', error);
          setIsValid(false);
          
          // Force sign out on server-side validation failure
          await supabase.auth.signOut();
          
          toast.error("Authentication Error", {
            description: "Your session is invalid. Please sign in again."
          });
        } else {
          // Session is valid
          setIsValid(true);
        }
      } catch (error) {
        console.error('Error during server validation:', error);
        setIsValid(false);
      } finally {
        setIsValidating(false);
      }
    };
    
    validateSession();
  }, []);
  
  if (isValidating) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-toronto-blue" />
        <span className="ml-2 text-gray-600">Verifying authentication...</span>
      </div>
    );
  }
  
  if (isValid === false) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }
  
  return (
    <AuthErrorBoundary onError={(error) => {
      console.error('Auth error in server validated route:', error);
      // Log to telemetry service
      logAuthError('server_validated_route_error', error.message);
      toast.error("Authentication Error", {
        description: "There was a problem with your session. Please try signing in again."
      });
    }}>
      {children}
    </AuthErrorBoundary>
  );
};

// Telemetry function for auth errors
const logAuthError = (errorType: string, errorMessage: string) => {
  // In a real implementation, this would send data to your analytics/logging service
  console.error(`Auth Telemetry: [${errorType}] ${errorMessage}`);
  
  // Example implementation with navigator.sendBeacon for non-blocking telemetry
  if (navigator.sendBeacon) {
    try {
      const telemetryData = new FormData();
      telemetryData.append('errorType', errorType);
      telemetryData.append('errorMessage', errorMessage);
      telemetryData.append('timestamp', new Date().toISOString());
      telemetryData.append('url', window.location.href);
      
      // This is where you would actually send the data to your telemetry endpoint
      // navigator.sendBeacon('/api/telemetry/auth-errors', telemetryData);
    } catch (e) {
      console.error('Failed to send telemetry:', e);
    }
  }
};

export default ServerValidatedRoute;
export { logAuthError };
