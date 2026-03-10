
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { logAuth } from '@/utils/debugUtils';

export function useSessionExpiry() {
  const [isNearExpiry, setIsNearExpiry] = useState(false);
  const [expiryTime, setExpiryTime] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState(Date.now());
  
  // Check if session is close to expiry (less than 10 minutes)
  const checkSessionExpiry = useCallback(async () => {
    try {
      const now = Date.now();
      // Limit check frequency to prevent too many API calls
      if (now - lastCheckTime < 10000) { // 10 seconds
        return;
      }
      setLastCheckTime(now);
      
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setIsNearExpiry(false);
        setExpiryTime(null);
        return;
      }
      
      const expiresAt = data.session.expires_at;
      if (!expiresAt) return;
      
      const expiryDate = new Date(expiresAt * 1000);
      setExpiryTime(expiryDate);
      
      const timeUntilExpiry = expiryDate.getTime() - now;
      const tenMinutesInMs = 10 * 60 * 1000;
      
      // Set near expiry if less than 10 minutes left
      const wasNearExpiry = isNearExpiry;
      const isNowNearExpiry = timeUntilExpiry < tenMinutesInMs && timeUntilExpiry > 0;
      setIsNearExpiry(isNowNearExpiry);
      
      // Show notification when session is about to expire (only on transition to near expiry)
      if (isNowNearExpiry && !wasNearExpiry) {
        const minutes = Math.floor(timeUntilExpiry / 60000);
        logAuth(`Session expiring in ${minutes} minutes`);
        
        // Only show toast if more than 1 minute left
        if (minutes > 1) {
          toast.warning("Session Expiring Soon", {
            description: `Your session will expire in ${minutes} minute${minutes !== 1 ? 's' : ''}`,
            action: {
              label: "Refresh",
              onClick: () => refreshSession()
            },
            duration: 10000, // Show for 10 seconds
          });
        } else {
          // Automatically refresh if less than 1 minute
          refreshSession();
        }
      }
      
      // Automatically refresh if very close to expiry (< 2 minutes)
      if (timeUntilExpiry < 2 * 60 * 1000 && timeUntilExpiry > 0 && !isRefreshing) {
        logAuth('Auto-refreshing session (< 2 min to expiry)');
        refreshSession();
      }
    } catch (error) {
      console.error('Error checking session expiry:', error);
    }
  }, [isNearExpiry, isRefreshing, lastCheckTime]);
  
  // Refresh session with improved error handling
  const refreshSession = async () => {
    if (isRefreshing) return; // Prevent multiple simultaneous refresh attempts
    
    try {
      setIsRefreshing(true);
      logAuth('Attempting to refresh session...');
      
      // First get current session to confirm we have one
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        logAuth('No active session to refresh');
        setIsRefreshing(false);
        return;
      }
      
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Error refreshing session:', error);
        
        // Try again once with a delay for network issues
        setTimeout(async () => {
          try {
            const { data: retryData, error: retryError } = await supabase.auth.refreshSession();
            
            if (retryError) {
              console.error('Error on retry refresh:', retryError);
              toast.error("Session Error", {
                description: "Could not refresh your session. You may need to sign in again."
              });
            } else if (retryData.session) {
              setIsNearExpiry(false);
              const newExpiryDate = new Date(retryData.session.expires_at! * 1000);
              setExpiryTime(newExpiryDate);
              logAuth('Session successfully refreshed on retry until:', newExpiryDate);
              broadcastSessionRefresh(retryData.session.expires_at! * 1000);
            }
          } catch (e) {
            console.error('Error in refresh retry:', e);
          } finally {
            setIsRefreshing(false);
          }
        }, 2000);
        
        return;
      }
      
      if (data && data.session) {
        setIsNearExpiry(false);
        const newExpiryDate = new Date(data.session.expires_at! * 1000);
        setExpiryTime(newExpiryDate);
        logAuth('Session successfully refreshed until:', newExpiryDate);
        
        // Broadcast refresh to other tabs
        broadcastSessionRefresh(data.session.expires_at! * 1000);
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
      toast.error("Session Error", {
        description: "An unexpected error occurred. Please try signing in again."
      });
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Helper to broadcast session refresh to other tabs
  const broadcastSessionRefresh = (expiryTimestamp: number) => {
    try {
      localStorage.setItem('session_last_refreshed', Date.now().toString());
      localStorage.setItem('session_expiry', expiryTimestamp.toString());
    } catch (e) {
      console.warn('Could not save session refresh data:', e);
    }
  };
  
  useEffect(() => {
    // Check session expiry on mount and then every minute
    checkSessionExpiry();
    const interval = setInterval(() => {
      checkSessionExpiry();
    }, 60000); // Check every minute
    
    // Also check when tab becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        logAuth('Tab became visible, checking session expiry');
        checkSessionExpiry();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also add a listener for potential session updates from other tabs
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'session_last_refreshed' || event.key === 'session_expiry') {
        logAuth('Session refreshed in another tab, checking local session state');
        checkSessionExpiry();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [checkSessionExpiry]);
  
  return {
    isNearExpiry,
    expiryTime,
    refreshSession,
    isRefreshing
  };
}
