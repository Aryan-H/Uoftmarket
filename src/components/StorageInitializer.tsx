
import { useState, useEffect, useRef } from 'react';
import { useStorageInit } from '@/hooks/use-storage-init';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useCoreAuth } from '@/contexts/CoreAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StorageInitializerProps {
  children: React.ReactNode;
}

const StorageInitializer = ({ children }: StorageInitializerProps) => {
  const { isInitialized, isInitializing, error, initializeStorage } = useStorageInit();
  const [showError, setShowError] = useState(false);
  const { isAuthenticated, user } = useCoreAuth();
  const [sessionChecked, setSessionChecked] = useState(false);
  const [sessionValid, setSessionValid] = useState(false);
  const [initAttempted, setInitAttempted] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const sessionCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // First verify the session is valid - but only once
  useEffect(() => {
    // Skip if we've already checked or if user is not authenticated
    if (sessionChecked || !isAuthenticated || !user?.id) {
      if (!isAuthenticated) {
        setSessionValid(false);
      }
      return;
    }

    const verifySession = async () => {
      try {
        console.log('Attempting to verify session for user:', user.id);
        
        // Get current session to verify it's still valid
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session verification failed with error:', sessionError);
          setSessionValid(false);
          
          // Try one more time after a short delay before showing an error
          if (sessionCheckTimeoutRef.current) {
            clearTimeout(sessionCheckTimeoutRef.current);
          }
          
          sessionCheckTimeoutRef.current = setTimeout(async () => {
            try {
              const { data: retryData } = await supabase.auth.getSession();
              if (retryData?.session) {
                console.log('Session verified on retry');
                setSessionValid(true);
              } else {
                console.log('Session still invalid after retry');
                toast.error('Authentication error', {
                  description: 'Your session appears to be invalid. Please sign in again.'
                });
              }
            } catch (e) {
              console.error('Error in session retry:', e);
            } finally {
              setSessionChecked(true);
            }
          }, 2000);
          
          return;
        }
        
        if (!data || !data.session) {
          console.log('No active session found during verification');
          setSessionValid(false);
          
          // Try one more time after a short delay
          if (sessionCheckTimeoutRef.current) {
            clearTimeout(sessionCheckTimeoutRef.current);
          }
          
          sessionCheckTimeoutRef.current = setTimeout(async () => {
            try {
              const { data: retryData } = await supabase.auth.getSession();
              if (retryData?.session) {
                console.log('Session found on retry');
                setSessionValid(true);
              } else {
                console.log('Still no session found on retry');
              }
            } catch (e) {
              console.error('Error in session retry:', e);
            } finally {
              setSessionChecked(true);
            }
          }, 2000);
          
          return;
        }
        
        // Session is valid
        console.log('Valid session verified');
        setSessionValid(true);
        setSessionChecked(true);
      } catch (err) {
        console.error('Error verifying auth session:', err);
        setSessionValid(false);
        setSessionChecked(true);
      }
    };

    verifySession();
    
    return () => {
      if (sessionCheckTimeoutRef.current) {
        clearTimeout(sessionCheckTimeoutRef.current);
      }
    };
  }, [isAuthenticated, user?.id, sessionChecked]);

  // Initialize storage only when we've confirmed the session is valid
  // and we haven't already initialized
  useEffect(() => {
    if (sessionValid && !isInitialized && !isInitializing && !initAttempted) {
      console.log('Session verified, initializing storage...');
      setInitAttempted(true);
      initializeStorage();
    }
  }, [sessionValid, isInitialized, isInitializing, initializeStorage, initAttempted]);

  // Add a retry mechanism if initialization fails
  useEffect(() => {
    if (error && retryCount < 2 && !isInitialized) {
      const timer = setTimeout(() => {
        console.log(`Retrying storage initialization (attempt ${retryCount + 1})...`);
        setInitAttempted(false);
        setRetryCount(prev => prev + 1);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, retryCount, isInitialized]);

  // Show error after a delay if initialization fails after retries
  useEffect(() => {
    if (error && retryCount >= 2) {
      const timer = setTimeout(() => {
        setShowError(true);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setShowError(false);
    }
  }, [error, retryCount]);

  // Always render children if not authenticated (don't block rendering)
  if (!isAuthenticated) {
    return <>{children}</>;
  }

  // Show a loading state only if auth is done but storage is still initializing
  // and this is our first attempt
  if (isInitializing && initAttempted && retryCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100px] p-4">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500 mb-2" />
        <p className="text-sm text-gray-600">Initializing storage...</p>
      </div>
    );
  }

  // If there's an error and we choose to display it
  if (error && showError) {
    return (
      <div className="flex flex-col p-4">
        <div className="bg-red-50 border border-red-200 p-4 rounded-md mb-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Storage Initialization Failed</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <p className="text-xs text-red-600 mt-2">
                The application will continue to load, but storage features may not work correctly.
              </p>
              <button 
                onClick={() => {
                  setShowError(false);
                  setInitAttempted(false);
                  setRetryCount(0);
                }}
                className="text-xs text-blue-600 mt-2 underline"
              >
                Retry Initialization
              </button>
            </div>
          </div>
        </div>
        {children}
      </div>
    );
  }

  // All good, render the children
  return <>{children}</>;
};

export default StorageInitializer;
