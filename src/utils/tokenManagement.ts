
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { logAuth } from './debugUtils';

/**
 * Check if the current session token is valid or has been revoked
 * @returns Promise<boolean> true if valid, false if revoked
 */
export const checkTokenValidity = async (): Promise<boolean> => {
  try {
    // Use a special RPC call to check if the current token is revoked
    const { data, error } = await supabase.rpc('is_valid_request', {}, {
      count: 'exact'
    });
    
    if (error) {
      console.error('Error checking token validity:', error);
      return false;
    }
    
    return data === true;
  } catch (error) {
    console.error('Exception in checkTokenValidity:', error);
    return false;
  }
};

/**
 * Revoke all tokens for the current user
 * Called on logout, account deletion, or other security-critical events
 */
export const revokeAllTokens = async (reason: string = 'user_logout'): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('revoke_my_tokens', { 
      revocation_reason: reason 
    }, {
      count: 'exact'
    });
    
    if (error) {
      console.error('Error revoking tokens:', error);
      return false;
    }
    
    logAuth('Successfully revoked all user tokens with reason: ' + reason);
    return data === true;
  } catch (error) {
    console.error('Exception in revokeAllTokens:', error);
    return false;
  }
};

/**
 * Perform a full secure logout, including token revocation
 * This ensures the user cannot use old tokens to access the system
 */
export const secureLogout = async (): Promise<boolean> => {
  try {
    // First revoke all tokens
    const revoked = await revokeAllTokens('user_logout');
    
    if (!revoked) {
      console.warn('Token revocation failed, continuing with logout');
    }
    
    // Then perform the normal logout
    const { error } = await supabase.auth.signOut({
      scope: 'global' // Invalidate all sessions, not just current one
    });
    
    if (error) {
      console.error('Error during logout:', error);
      toast.error("Logout Error", {
        description: "There was a problem logging you out securely."
      });
      return false;
    }
    
    // Clear any local storage
    try {
      localStorage.removeItem('userProfile');
      localStorage.removeItem('supabase-auth');
      
      Object.keys(localStorage)
        .filter(key => key.startsWith('active_session_') || key.startsWith('supabase.auth.'))
        .forEach(key => localStorage.removeItem(key));
        
      logAuth('Successfully cleared local storage during secure logout');
    } catch (e) {
      console.warn('Error clearing local storage during logout:', e);
    }
    
    return true;
  } catch (error) {
    console.error('Exception in secureLogout:', error);
    return false;
  }
};

/**
 * Handle token revocation for account deletion
 */
export const revokeTokensForAccountDeletion = async (): Promise<boolean> => {
  return await revokeAllTokens('account_deleted');
};

/**
 * Perform a token validity check with recovery attempt
 * Returns true if token is valid, false if revoked
 */
export const validateTokenWithRecovery = async (): Promise<boolean> => {
  try {
    const isValid = await checkTokenValidity();
    
    if (!isValid) {
      logAuth('Token validation failed, token may be revoked');
      
      // Try to refresh the session once
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error || !data.session) {
        logAuth('Session refresh failed, token is definitely revoked');
        return false;
      }
      
      // Check again after refresh
      const refreshedValid = await checkTokenValidity();
      if (!refreshedValid) {
        logAuth('Token still invalid after refresh, forcing logout');
        await secureLogout();
        return false;
      }
      
      return true;
    }
    
    return true;
  } catch (error) {
    console.error('Error in validateTokenWithRecovery:', error);
    return false;
  }
};
