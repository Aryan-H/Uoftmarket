
import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useCoreAuth } from './CoreAuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { logAuth } from '@/utils/debugUtils';

export const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useCoreAuth();
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [lastActiveTimestamp, setLastActiveTimestamp] = useState<number>(Date.now());
  const [lastCheckTimestamp, setLastCheckTimestamp] = useState<number>(Date.now());
  
  // Handle visibility change to properly reconnect when returning to the tab
  useEffect(() => {
    const handleVisibilityChange = async () => {
      const now = Date.now();
      const wasHiddenLongEnough = now - lastActiveTimestamp > 10000; // 10 seconds
      
      if (document.visibilityState === 'visible') {
        // Update timestamp whenever tab becomes visible
        setLastActiveTimestamp(now);
        logAuth('Tab became visible, time since last active:', Math.round((now - lastActiveTimestamp)/1000) + 's');
        
        if (wasHiddenLongEnough) {
          // When returning to the tab after some time, check if session is still valid
          setIsReconnecting(true);
          try {
            // First check if we have a session
            const { data } = await supabase.auth.getSession();
            if (data.session) {
              await auth.refreshSession();
              logAuth('Session refreshed after tab became visible');
            } else if (auth.isAuthenticated) {
              // We think we're authenticated but Supabase says no session
              // This is a mismatch we need to fix by checking again
              logAuth('Session mismatch detected, rechecking');
              
              // Try again after a short delay
              setTimeout(async () => {
                const { data: retryData } = await supabase.auth.getSession();
                if (!retryData.session && auth.isAuthenticated) {
                  logAuth('Session still missing after recheck, reloading state');
                  window.location.reload();
                }
              }, 1000);
            }
          } catch (error) {
            console.error('Error refreshing session:', error);
            toast.error("Session Error", {
              description: "There was a problem with your session. Please try signing in again."
            });
          } finally {
            setIsReconnecting(false);
          }
        }
      } else if (document.visibilityState === 'hidden') {
        // Update timestamp when tab becomes hidden
        setLastActiveTimestamp(now);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also set up an interval to periodically refresh the session when the tab is active
    const refreshInterval = setInterval(() => {
      if (document.visibilityState === 'visible' && auth.isAuthenticated && !isReconnecting) {
        const now = Date.now();
        // Only refresh if at least 5 minutes have passed since last check
        if (now - lastCheckTimestamp > 5 * 60 * 1000) {
          setLastCheckTimestamp(now);
          auth.refreshSession().catch(error => {
            console.error('Error in periodic session refresh:', error);
          });
        }
      }
    }, 60 * 1000); // Check every minute, but only refresh if needed
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(refreshInterval);
    };
  }, [auth.isAuthenticated, auth.refreshSession, lastActiveTimestamp, isReconnecting, lastCheckTimestamp]);
  
  // Enhanced auth context with reconnection state and more resilient session handling
  const enhancedAuth = {
    ...auth,
    isReconnecting
  };
  
  return (
    <AuthContext.Provider value={enhancedAuth}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
