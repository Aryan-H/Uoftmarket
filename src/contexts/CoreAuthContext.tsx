
import React, { createContext, useContext, ReactNode } from 'react';
import { User as AppUser } from '@/types/auth';
import { useAuthCore } from '@/hooks/use-auth-core';
import { useAuthSignIn } from '@/hooks/use-auth-signin';
import { useProfileUpdate } from '@/hooks/use-profile-update';
import { useSessionExpiry } from '@/hooks/use-session-expiry';

interface CoreAuthContextType {
  user: AppUser | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  isUpdatingProfile: boolean;
  isResendingVerification: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string, profileData?: any) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUserProfile: (profile: any) => Promise<boolean>;
  sessionId: string | null;
  hasMultipleActiveSessions: boolean;
  isSessionNearExpiry: boolean;
  sessionExpiryTime: Date | null;
  refreshSession: () => Promise<void>;
  isEmailVerified: boolean;
  resendVerificationEmail: (email: string) => Promise<boolean>;
}

const CoreAuthContext = createContext<CoreAuthContextType | undefined>(undefined);

export const CoreAuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useAuthCore();
  const authSignIn = useAuthSignIn(auth.setUser);
  const profileUpdate = useProfileUpdate(auth.user, auth.setUser, auth.setIsUpdatingProfile);
  const { isNearExpiry, expiryTime, refreshSession } = useSessionExpiry();
  
  const contextValue: CoreAuthContextType = {
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    isInitializing: auth.isInitializing,
    isUpdatingProfile: auth.isUpdatingProfile,
    isResendingVerification: authSignIn.isResendingVerification,
    sessionId: auth.sessionId,
    hasMultipleActiveSessions: auth.hasMultipleActiveSessions,
    isSessionNearExpiry: isNearExpiry,
    sessionExpiryTime: expiryTime,
    refreshSession,
    logout: auth.logout,
    isEmailVerified: auth.isEmailVerified,
    ...authSignIn,
    ...profileUpdate
  };
  
  return (
    <CoreAuthContext.Provider value={contextValue}>
      {children}
    </CoreAuthContext.Provider>
  );
};

export const useCoreAuth = () => {
  const context = useContext(CoreAuthContext);
  
  if (context === undefined) {
    throw new Error('useCoreAuth must be used within a CoreAuthProvider');
  }
  
  return context;
};
