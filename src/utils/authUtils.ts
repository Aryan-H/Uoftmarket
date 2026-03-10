
import { User } from '@/types/auth';
import { withTimeout, logOperation, isSupabaseConfigured, supabase } from '@/lib/supabase';

// For UI state syncing purposes only, not primary storage
// This is only used for quick UI rendering while waiting for actual data from Supabase
export const saveUserToLocalStorage = (user: User | null) => {
  if (user) {
    console.log('Syncing user to localStorage (temporary UI state):', user);
    localStorage.setItem('userProfile', JSON.stringify(user));
  } else {
    localStorage.removeItem('userProfile');
  }
};

export const loadUserFromLocalStorage = (): User | null => {
  try {
    const data = localStorage.getItem('userProfile');
    const user = data ? JSON.parse(data) : null;
    console.log('Loaded temporary user state from localStorage:', user);
    return user;
  } catch (error) {
    console.error('Error loading user from localStorage:', error);
    localStorage.removeItem('userProfile');
    return null;
  }
};

export const isProfileComplete = (profile: any): boolean => {
  return !!(profile && profile.name);
};

// Get user profile from Supabase profiles table
export const getUserProfile = async (userId: string): Promise<User | null> => {
  if (!userId || !isSupabaseConfigured()) return null;
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
    
    if (!data) return null;
    
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      isAuthenticated: true,
      hasCompletedSetup: !!(data.name && (data.program || data.year)),
      program: data.program || '',
      year: data.year || '',
      bio: data.bio || '',
      phone: data.phone || ''
    };
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return null;
  }
};

// Enhanced function to get user from Supabase directly
export const getCurrentUserFromSupabase = async (): Promise<User | null> => {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.log('No active session found');
      return null;
    }
    
    // Get user profile from profiles table
    const profile = await getUserProfile(session.user.id);
    
    if (profile) return profile;
    
    // Fallback to auth user data if profile not found
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData.user) {
      console.error('Error fetching user data:', userError);
      return null;
    }
    
    const userMetadata = userData.user.user_metadata || {};
    
    return {
      id: userData.user.id,
      name: userMetadata.name || userData.user.email?.split('@')[0] || 'User',
      email: userData.user.email || '',
      isAuthenticated: true,
      hasCompletedSetup: userMetadata.hasCompletedSetup || false,
      program: userMetadata.program || '',
      year: userMetadata.year || '',
      bio: userMetadata.bio || '',
      phone: userMetadata.phone || ''
    };
  } catch (error) {
    console.error('Error in getCurrentUserFromSupabase:', error);
    return null;
  }
};

// Sync local user state with Supabase
// Call this function periodically to ensure local state is in sync with server
export const syncUserWithSupabase = async (): Promise<User | null> => {
  try {
    // First, check if we have an active session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.log('No active session, clearing local user state');
      localStorage.removeItem('userProfile');
      return null;
    }
    
    // We have a session, get the user data
    const user = await getCurrentUserFromSupabase();
    if (user) {
      saveUserToLocalStorage(user); // Only for quick UI rendering
      return user;
    } else {
      // No user found but we have a session - this is an inconsistent state
      console.warn('Session exists but no user data found');
      return null;
    }
  } catch (error) {
    console.error('Error syncing user with Supabase:', error);
    return null;
  }
};

// Update user profile in Supabase profiles table
export const updateUserProfile = async (userId: string, profile: Partial<User>): Promise<boolean> => {
  if (!userId || !isSupabaseConfigured()) return false;
  
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        name: profile.name,
        program: profile.program,
        year: profile.year,
        bio: profile.bio,
        phone: profile.phone,
      })
      .eq('id', userId);
    
    if (error) {
      console.error('Error updating user profile:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    return false;
  }
};

// New utility to check if there's an active session from another tab/window
export const detectMultipleSessions = async (currentSessionId: string | null): Promise<boolean> => {
  if (!currentSessionId || !isSupabaseConfigured()) return false;
  
  try {
    // Check for session in localStorage (might be from another tab)
    const storedSession = localStorage.getItem('supabase-auth');
    if (!storedSession) return false;
    
    try {
      const parsedSession = JSON.parse(storedSession);
      const storedAccessToken = parsedSession?.access_token;
      
      if (storedAccessToken) {
        // Extract session ID from stored token
        const storedSessionId = storedAccessToken.slice(-8);
        
        // If the stored session ID doesn't match current session ID, we have multiple sessions
        if (storedSessionId !== currentSessionId) {
          console.log('Detected multiple active sessions:', {
            current: currentSessionId,
            stored: storedSessionId
          });
          return true;
        }
      }
    } catch (e) {
      console.error('Error parsing stored session:', e);
    }
    
    return false;
  } catch (error) {
    console.error('Error in detectMultipleSessions:', error);
    return false;
  }
};

// Utility to handle new logins when there's already an active session
export const handleMultipleLogins = async (currentUser: User | null, sessionId: string | null): Promise<void> => {
  if (!currentUser || !sessionId) return;
  
  // Check if this is a different session for the same user
  const hasMultipleSessions = await detectMultipleSessions(sessionId);
  
  if (hasMultipleSessions) {
    console.log('User has multiple active sessions');
    
    // We could track this in analytics or notify the user
    // For now, we just log it and allow multiple sessions
  }
};
