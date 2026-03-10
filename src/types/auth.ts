
export interface UserProfile {
  name: string;
  program?: string;
  year?: string;
  bio?: string;
  phone?: string;
  avatar_url?: string | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  isAuthenticated: boolean;
  hasCompletedSetup: boolean;
  program?: string;
  year?: string;
  bio?: string;
  phone?: string;
  avatar_url?: string | null;
}

export interface ProfileData {
  program: string;
  year: string;
  bio?: string;
  phone?: string;
  avatar_url?: string | null;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isUpdatingProfile: boolean;
  isResendingVerification: boolean;
  sessionExpiryTime: Date | null;
  refreshSession: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string, profileData?: any) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUserProfile: (profile: any) => Promise<boolean>;
  resendVerificationEmail: (email: string) => Promise<boolean>;
  checkTokenValidity: () => Promise<boolean>;
  revokeTokens: (reason?: string) => Promise<boolean>;
}
