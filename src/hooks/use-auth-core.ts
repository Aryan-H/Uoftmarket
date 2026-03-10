import { useState, useEffect, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, refreshSessionIfNeeded } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { User as AppUser } from '@/types/auth';
import { saveUserToLocalStorage, loadUserFromLocalStorage, syncUserWithSupabase, getUserProfile } from '@/utils/authUtils';
import { clearAllLocalStorage } from '@/utils/storageUtils';
import { logAuthError } from '@/components/auth/ServerValidatedRoute';
import { logAuth } from '@/utils/debugUtils';
import { secureLogout, validateTokenWithRecovery } from '@/utils/tokenManagement';

export function useAuthCore() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [hasMultipleActiveSessions, setHasMultipleActiveSessions] = useState(false);
  const [tabActive, setTabActive] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [lastSessionCheck, setLastSessionCheck] = useState(Date.now());
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const authSubscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  const initialized = useRef(false);
  
  const checkForMultipleSessions = useCallback(async (currentSessionId: string) => {
    const sessionKey = `active_session_${currentSessionId}`;
    const timestamp = Date.now();
    
    localStorage.setItem(sessionKey, JSON.stringify({
      timestamp,
      lastActive: timestamp
    }));
    
    const otherSessions = Object.keys(localStorage)
      .filter(key => key.startsWith('active_session_') && key !== sessionKey)
      .map(key => {
        try {
          return {
            id: key.replace('active_session_', ''),
            data: JSON.parse(localStorage.getItem(key) || '{}')
          };
        } catch (e) {
          return null;
        }
      })
      .filter(Boolean);
    
    setHasMultipleActiveSessions(otherSessions.length > 0);
    
    if (otherSessions.length > 0) {
      logAuth('Multiple active sessions detected:', {
        current: currentSessionId,
        others: otherSessions
      });
      
      await syncUserWithSupabase();
    }
    
    return otherSessions.length > 0;
  }, []);
  
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    
    let initTimeoutId: NodeJS.Timeout;
    
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      setTabActive(isVisible);
      
      if (isVisible && sessionId) {
        logAuth('Tab became visible, checking session status');
        
        const now = Date.now();
        if (now - lastSessionCheck > 5000) {
          setLastSessionCheck(now);
          
          refreshSessionIfNeeded().catch(error => {
            console.error('Error refreshing session on visibility change:', error);
          });
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    initTimeoutId = setTimeout(() => {
      logAuth('Auth initialization timeout reached, forcing completion');
      setIsInitializing(false);
    }, 3000);
    
    if (!isSupabaseConfigured()) {
      console.warn('Supabase client not properly configured, skipping auth setup');
      setIsInitializing(false);
      clearTimeout(initTimeoutId);
      return;
    }
    
    logAuth('Setting up auth state listener');
    
    const setupAuthSubscription = async () => {
      if (authSubscriptionRef.current) {
        authSubscriptionRef.current.unsubscribe();
      }
      
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
        logAuth('Auth state changed:', event, newSession?.user?.email);
        
        setSession(newSession);
        
        if (newSession?.user) {
          const isVerified = newSession.user.email_confirmed_at !== null;
          setIsEmailVerified(isVerified);
          logAuth('Email verification status:', isVerified);
        } else {
          setIsEmailVerified(false);
        }
        
        if (newSession?.access_token) {
          const newSessionId = newSession.access_token.slice(-8);
          setSessionId(newSessionId);
          logAuth('Session identified as:', newSessionId);
          
          if (event === 'SIGNED_IN') {
            await checkForMultipleSessions(newSessionId);
          }
        } else {
          setSessionId(null);
        }
        
        if (event === 'SIGNED_IN' && newSession) {
          handleSignIn(newSession);
          setIsInitializing(false);
          clearTimeout(initTimeoutId);
        } else if (event === 'SIGNED_OUT') {
          handleSignOut();
          setIsInitializing(false);
          clearTimeout(initTimeoutId);
        } else if (event === 'TOKEN_REFRESHED') {
          handleTokenRefresh(newSession);
          setIsInitializing(false);
          clearTimeout(initTimeoutId);
        } else if (event === 'USER_UPDATED') {
          if (newSession) {
            handleUserUpdate(newSession);
          }
          setIsInitializing(false);
          clearTimeout(initTimeoutId);
        } else {
          setIsInitializing(false);
          clearTimeout(initTimeoutId);
        }
      });
      
      authSubscriptionRef.current = subscription;
    };

    const checkSession = async () => {
      try {
        logAuth('Checking for existing session');
        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
          if (data.session.user) {
            const isVerified = data.session.user.email_confirmed_at !== null;
            setIsEmailVerified(isVerified);
            logAuth('Email verification status on init:', isVerified);
          }
          
          logAuth('Found existing session, refreshing if needed');
          if (data.session.access_token) {
            const existingSessionId = data.session.access_token.slice(-8);
            setSessionId(existingSessionId);
            logAuth('Existing session identified as:', existingSessionId);
            
            await checkForMultipleSessions(existingSessionId);
          }
          
          setSession(data.session);
          
          await refreshSessionIfNeeded();
          
          const currentUser = await syncUserWithSupabase();
          if (currentUser) {
            setUser(currentUser);
          } else {
            setTimeout(async () => {
              const retryUser = await syncUserWithSupabase();
              if (retryUser) {
                setUser(retryUser);
              } else {
                setUser(null);
                setSessionId(null);
                localStorage.removeItem('userProfile');
              }
            }, 1000);
          }
        } else {
          logAuth('No active session, clearing state');
          setUser(null);
          setSessionId(null);
          setIsEmailVerified(false);
          localStorage.removeItem('userProfile');
        }
      } catch (error) {
        console.error('Session check error:', error);
        setUser(null);
        setSessionId(null);
        setIsEmailVerified(false);
        localStorage.removeItem('userProfile');
      } finally {
        setIsInitializing(false);
        clearTimeout(initTimeoutId);
      }
    };
    
    setupAuthSubscription().then(() => {
      checkSession();
    });

    const sessionRefreshInterval = setInterval(async () => {
      if (!tabActive) {
        return;
      }
      
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          await refreshSessionIfNeeded();
          
          if (sessionId) {
            try {
              const sessionKey = `active_session_${sessionId}`;
              const sessionData = JSON.parse(localStorage.getItem(sessionKey) || '{}');
              localStorage.setItem(sessionKey, JSON.stringify({
                ...sessionData,
                lastActive: Date.now()
              }));
              
              await checkForMultipleSessions(sessionId);
            } catch (e) {
              console.error('Error updating session activity:', e);
            }
          }
        } else {
          setUser(null);
          setSessionId(null);
          localStorage.removeItem('userProfile');
        }
      } catch (error) {
        console.error('Session refresh error:', error);
        logAuthError('session_refresh_error', error instanceof Error ? error.message : String(error));
      }
    }, 15 * 60 * 1000);

    const handleStorageChange = async (event: StorageEvent) => {
      if (event.key === 'supabase-auth' || 
          event.key === 'session_refresh_timestamp' || 
          event.key?.startsWith('active_session_')) {
        
        logAuth('Auth storage changed in another tab, syncing state');
        
        try {
          const { data } = await supabase.auth.getSession();
          
          if (data.session) {
            if (sessionId !== data.session.access_token?.slice(-8)) {
              logAuth('Session changed in another tab, updating local state');
              setSession(data.session);
              
              const newSessionId = data.session.access_token?.slice(-8) || null;
              setSessionId(newSessionId);
              
              if (newSessionId) {
                await checkForMultipleSessions(newSessionId);
              }
              
              const currentUser = await syncUserWithSupabase();
              if (currentUser) {
                setUser(currentUser);
              }
            }
          } else if (sessionId) {
            logAuth('User logged out in another tab, clearing state');
            setUser(null);
            setSession(null);
            setSessionId(null);
            localStorage.removeItem('userProfile');
            toast.info("Signed Out", {
              description: "You have been signed out in another tab"
            });
          }
        } catch (error) {
          console.error('Error syncing auth state across tabs:', error);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);

    return () => {
      if (authSubscriptionRef.current) {
        authSubscriptionRef.current.unsubscribe();
      }
      clearInterval(sessionRefreshInterval);
      clearTimeout(initTimeoutId);
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (sessionId) {
        localStorage.removeItem(`active_session_${sessionId}`);
      }
    };
  }, [sessionId, tabActive, checkForMultipleSessions, lastSessionCheck]);

  useEffect(() => {
    if (!user || !isSupabaseConfigured()) return;
    
    let validityCheckInterval: NodeJS.Timeout;
    
    validateTokenWithRecovery().catch(error => {
      console.error('Error validating token on mount:', error);
    });
    
    validityCheckInterval = setInterval(() => {
      if (!user) return;
      
      validateTokenWithRecovery().catch(error => {
        console.error('Error validating token in interval:', error);
      });
    }, 15 * 60 * 1000);
    
    return () => {
      if (validityCheckInterval) {
        clearInterval(validityCheckInterval);
      }
    };
  }, [user]);

  const handleSignIn = async (newSession: Session) => {
    try {
      if (newSession.user) {
        const isVerified = newSession.user.email_confirmed_at !== null;
        setIsEmailVerified(isVerified);
        logAuth('Email verification status on sign in:', isVerified);
        
        if (!isVerified && newSession.user.email?.endsWith('@mail.utoronto.ca')) {
          logAuth('UofT email not verified, special handling may be needed');
        }
      }
      
      const userProfile = await getUserProfile(newSession.user.id);
      
      if (userProfile) {
        setUser(userProfile);
        saveUserToLocalStorage(userProfile);
        
        toast.success("Logged In", {
          description: `Welcome, ${userProfile.name}!`
        });
      } else {
        setTimeout(async () => {
          const retryProfile = await getUserProfile(newSession.user.id);
          
          if (retryProfile) {
            setUser(retryProfile);
            saveUserToLocalStorage(retryProfile);
            
            toast.success("Logged In", {
              description: `Welcome, ${retryProfile.name}!`
            });
            return;
          }
          
          const { data: userData } = await supabase.auth.getUser();
          
          if (userData?.user) {
            const userMetadata = userData.user?.user_metadata || {};
            
            const fallbackProfile = {
              id: newSession.user.id,
              name: userMetadata.name || newSession.user.email?.split('@')[0] || 'User',
              email: newSession.user.email || '',
              isAuthenticated: true,
              hasCompletedSetup: userMetadata.hasCompletedSetup || false,
              program: userMetadata.program || '',
              year: userMetadata.year || '',
              bio: userMetadata.bio || '',
              phone: userMetadata.phone || ''
            };
            
            setUser(fallbackProfile);
            saveUserToLocalStorage(fallbackProfile);
            
            toast.success("Logged In", {
              description: `Welcome, ${fallbackProfile.name}!`
            });
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Error processing sign in event:', error);
      setUser(null);
      logAuthError('sign_in_error', error instanceof Error ? error.message : String(error));
    }
  };

  const handleSignOut = () => {
    console.log('User signed out, clearing state');
    setUser(null);
    setSessionId(null);
    setHasMultipleActiveSessions(false);
    
    Object.keys(localStorage)
      .filter(key => key.startsWith('active_session_'))
      .forEach(key => localStorage.removeItem(key));
    
    clearAllLocalStorage();
    
    if (!loggingOut) {
      toast.success("Logged Out", {
        description: "You have been successfully logged out."
      });
    }
  };

  const handleTokenRefresh = (newSession: Session | null) => {
    console.log('Session token refreshed');
    if (newSession?.access_token) {
      const refreshedSessionId = newSession.access_token.slice(-8);
      setSessionId(refreshedSessionId);
      console.log('Session refreshed, new identifier:', refreshedSessionId);
    }
  };

  const handleUserUpdate = async (newSession: Session) => {
    try {
      const updatedProfile = await getUserProfile(newSession.user.id);
      
      if (updatedProfile) {
        setUser(updatedProfile);
        saveUserToLocalStorage(updatedProfile);
      }
    } catch (error) {
      console.error('Error processing user update event:', error);
      logAuthError('user_update_error', error instanceof Error ? error.message : String(error));
    }
  };

  const logout = useCallback(async (): Promise<void> => {
    try {
      setLoggingOut(true);
      
      if (sessionId) {
        localStorage.removeItem(`active_session_${sessionId}`);
      }
      
      const success = await secureLogout();
      
      setUser(null);
      setSession(null);
      setSessionId(null);
      setHasMultipleActiveSessions(false);
      
      clearAllLocalStorage();
      
      if (!success) {
        toast.error("Logout Warning", {
          description: "There may have been an issue with secure logout. For security, please clear your browser cache."
        });
      } else {
        toast.success("Logged Out", {
          description: "You have been successfully logged out."
        });
      }
      
      setTimeout(() => {
        setLoggingOut(false);
      }, 1000);
    } catch (error) {
      console.error("Error during logout:", error);
      logAuthError('logout_error', error instanceof Error ? error.message : String(error));
      toast.error("Logout Error", {
        description: "There was a problem logging you out."
      });
      setLoggingOut(false);
    }
  }, [sessionId]);

  return {
    user,
    session,
    isAuthenticated: !!user,
    isInitializing,
    isUpdatingProfile,
    sessionId,
    hasMultipleActiveSessions,
    isEmailVerified,
    setUser,
    setIsUpdatingProfile,
    logout
  };
}
