import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import AuthErrorBoundary from './auth/AuthErrorBoundary';
import StorageInitializer from './StorageInitializer';
import { supabase } from '@/integrations/supabase/client';
import { ensureSafariCompatibility } from '@/utils/cacheUtils';
import { validateTokenWithRecovery } from '@/utils/tokenManagement';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireServerValidation?: boolean;
}

// Telemetry function for auth errors
export const logAuthError = (errorType: string, errorMessage: string) => {
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

const ProtectedRoute = ({ children, requireServerValidation = false }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, refreshSession, sessionExpiryTime, user } = useAuth();
  const location = useLocation();
  const [showLoading, setShowLoading] = useState(true);
  const [hasAttemptedRefresh, setHasAttemptedRefresh] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryTimeout, setRecoveryTimeout] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
  const [isCheckingToken, setIsCheckingToken] = useState(false);
  
  useEffect(() => {
    setIsSafari(window.isSafari || false);
    
    if (window.isSafari) {
      console.log('ProtectedRoute detected Safari browser');
      ensureSafariCompatibility();
    }
  }, []);
  
  useEffect(() => {
    console.log("ProtectedRoute - Auth status:", { 
      isAuthenticated, 
      isLoading, 
      user: user?.id || 'none',
      path: location.pathname,
      recovering: isRecovering,
      browser: isSafari ? 'Safari' : 'Other',
      state: location.state,
      tokenValid: isTokenValid
    });
    
    if (location.state && location.state.preserveAuth) {
      console.log("Preserving authentication state due to preserveAuth flag");
      setShowLoading(false);
      return;
    }
    
    const loadingTimeoutId = setTimeout(() => {
      setShowLoading(false);
    }, 2000); 
    
    if (!isLoading) {
      clearTimeout(loadingTimeoutId);
      setShowLoading(false);
    }
    
    return () => {
      clearTimeout(loadingTimeoutId);
    };
  }, [isLoading, user, location.pathname, isAuthenticated, isRecovering, isSafari, location.state, isTokenValid]);
  
  useEffect(() => {
    if (isRecovering) {
      const timeoutId = setTimeout(() => {
        console.log('Session recovery taking too long, showing redirect');
        setRecoveryTimeout(true);
      }, 5000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isRecovering]);
  
  useEffect(() => {
    const recoverSession = async () => {
      if (!isLoading && !isAuthenticated && !hasAttemptedRefresh && !isRecovering) {
        try {
          setIsRecovering(true);
          console.log('Attempting to recover session...');
          
          if (isSafari) {
            console.log("Safari: Cleaning up before session recovery attempt");
            try {
              Object.keys(localStorage)
                .filter(key => key.startsWith('supabase.auth.') && !key.includes('callback-url'))
                .forEach(key => localStorage.removeItem(key));
            } catch (err) {
              console.warn("Error clearing data in Safari:", err);
            }
          }
          
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Error checking session:', error);
            setIsRecovering(false);
            setHasAttemptedRefresh(true);
            return;
          }
          
          if (data.session) {
            console.log('Found valid session, attempting to refresh');
            
            try {
              const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
              
              if (refreshError) {
                console.error('Error refreshing session:', refreshError);
                
                const retryDelay = isSafari ? 500 : 1000;
                
                setTimeout(async () => {
                  const { data: retryData, error: retryError } = await supabase.auth.refreshSession();
                  if (retryError) {
                    console.error('Error on retry refresh:', retryError);
                    setIsRecovering(false);
                    setHasAttemptedRefresh(true);
                    return;
                  }
                  
                  if (retryData.session) {
                    console.log('Session successfully recovered on retry');
                    toast.success("Session Restored", { 
                      description: "Your session has been restored." 
                    });
                    setTimeout(() => {
                      window.location.reload();
                    }, 500);
                    return;
                  }
                  
                  setIsRecovering(false);
                  setHasAttemptedRefresh(true);
                }, retryDelay);
                
                return;
              }
              
              if (refreshData.session) {
                console.log('Session successfully recovered');
                toast.success("Session Restored", { 
                  description: "Your session has been restored." 
                });
                
                setTimeout(() => {
                  setIsRecovering(false);
                  window.location.reload();
                }, 500);
                
                return;
              }
            } catch (refreshError) {
              console.error('Exception during session refresh:', refreshError);
            }
          } else {
            try {
              const storedAuthJson = localStorage.getItem('supabase-auth');
              if (storedAuthJson) {
                const storedAuth = JSON.parse(storedAuthJson);
                if (storedAuth?.access_token) {
                  console.log('Found access token in storage, attempting to restore session');
                  
                  const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                    access_token: storedAuth.access_token,
                    refresh_token: storedAuth.refresh_token
                  });
                  
                  if (sessionError) {
                    console.error('Error restoring session from storage:', sessionError);
                  } else if (sessionData.session) {
                    console.log('Session successfully restored from storage');
                    toast.success("Session Restored", { 
                      description: "Your session has been restored from storage." 
                    });
                    
                    setTimeout(() => {
                      setIsRecovering(false);
                      window.location.reload();
                    }, 500);
                    return;
                  }
                }
              }
            } catch (e) {
              console.error('Error while trying to restore from storage:', e);
            }
          }
          
          console.log('No valid session found for recovery');
          setIsRecovering(false);
          setHasAttemptedRefresh(true);
        } catch (error) {
          console.error('Error in session recovery:', error);
          setIsRecovering(false);
          setHasAttemptedRefresh(true);
        }
      }
    };
    
    recoverSession();
    
    const checkInterval = setInterval(() => {
      if (!isAuthenticated && !isRecovering) {
        setHasAttemptedRefresh(false);
        recoverSession();
      }
    }, isSafari ? 3000 : 5000);
    
    return () => clearInterval(checkInterval);
  }, [isLoading, isAuthenticated, hasAttemptedRefresh, refreshSession, isRecovering, isSafari]);
  
  useEffect(() => {
    if (sessionExpiryTime && isAuthenticated) {
      const now = new Date();
      const timeUntilExpiry = sessionExpiryTime.getTime() - now.getTime();
      const tenMinutesInMs = 10 * 60 * 1000;
      
      if (timeUntilExpiry < tenMinutesInMs && timeUntilExpiry > 0) {
        refreshSession().catch(error => {
          console.error('Error refreshing session:', error);
        });
      }
    }
  }, [sessionExpiryTime, isAuthenticated, refreshSession]);
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !localStorage.getItem('authRedirectToast') && 
        !isRecovering && (recoveryTimeout || hasAttemptedRefresh)) {
      toast.error("Authentication required", {
        description: "Please sign in to access this page"
      });
      localStorage.setItem('authRedirectToast', 'true');
      
      setTimeout(() => {
        localStorage.removeItem('authRedirectToast');
      }, 3000);
    }
  }, [isAuthenticated, isLoading, isRecovering, recoveryTimeout, hasAttemptedRefresh]);
  
  useEffect(() => {
    const checkTokenValidity = async () => {
      setIsCheckingToken(true);
      try {
        const valid = await validateTokenWithRecovery();
        setIsTokenValid(valid);
        
        if (!valid && isAuthenticated) {
          console.log('Token was revoked, forcing logout');
          toast.error("Session Expired", {
            description: "Your session has been invalidated. Please sign in again."
          });
          
          // Force navigation to auth page
          setTimeout(() => {
            window.location.href = '/auth';
          }, 1500);
        }
      } catch (error) {
        console.error('Error checking token validity:', error);
        setIsTokenValid(false);
      } finally {
        setIsCheckingToken(false);
      }
    };
    
    checkTokenValidity();
  }, [user, isAuthenticated]);
  
  if ((isLoading && showLoading) || (isRecovering && !recoveryTimeout)) {
    return (
      <div className="fixed inset-0 bg-background/95 z-50 flex flex-col items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <Loader2 className="h-12 w-12 animate-spin text-toronto-blue mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">
            {isRecovering ? "Recovering Your Session" : "Verifying Authentication"}
          </h2>
          <p className="text-gray-600 mb-4">
            {isRecovering 
              ? "We're attempting to restore your previous session..." 
              : "Please wait while we verify your authentication status..."}
          </p>
          {isRecovering && (
            <div className="text-sm text-gray-500">
              This should only take a moment...
            </div>
          )}
          
          {isSafari && (
            <div className="mt-4 text-xs text-amber-600">
              Safari detected: Using enhanced compatibility mode
            </div>
          )}
        </div>
      </div>
    );
  }
  
  if (isTokenValid === false && isAuthenticated && !isLoading && !isCheckingToken) {
    return <Navigate to="/auth" replace state={{ from: location.pathname, tokenRevoked: true }} />;
  }
  
  if (!isAuthenticated && !isLoading && (!isRecovering || recoveryTimeout)) {
    if (location.state && location.state.preserveAuth) {
      console.log('Found preserveAuth flag, not redirecting');
      return <AuthErrorBoundary>{children}</AuthErrorBoundary>;
    }
    
    console.log('Not authenticated, redirecting to /auth from', location.pathname);
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }
  
  return (
    <AuthErrorBoundary onError={(error) => {
      console.error('Authentication error in protected route:', error);
      logAuthError('protected_route_error', error.message);
      toast.error("Authentication Error", {
        description: "There was a problem with your session. Please try signing in again."
      });
    }}>
      <StorageInitializer>
        {children}
      </StorageInitializer>
    </AuthErrorBoundary>
  );
};

export default ProtectedRoute;
