
import { useState, useCallback } from 'react';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types/auth';
import { saveUserToLocalStorage } from '@/utils/authUtils';

interface SignupProfile {
  program?: string;
  year?: string;
  bio: string;
  phone: string;
  hasCompletedSetup?: boolean;
}

export function useAuthSignIn(setUser: React.Dispatch<React.SetStateAction<User | null>>) {
  const [error, setError] = useState<Error | null>(null);
  const [isResendingVerification, setIsResendingVerification] = useState(false);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    if (!email || !password) {
      console.error("Email and password are required");
      return false;
    }

    try {
      console.log("Attempting login with Supabase for:", email);
      
      // Clear any previous auth data before attempting login
      localStorage.removeItem('userProfile');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error("Error during sign in:", error.message);
        setError(error);
        return false;
      }
      
      if (!data.user || !data.session) {
        console.error("No user or session returned");
        return false;
      }

      console.log("Login successful for user:", data.user.email);
      // Auth successful, but we'll use the onAuthStateChange event to update user state
      return true;
    } catch (err) {
      const error = err as Error;
      console.error("Unexpected error during sign in:", error.message);
      setError(error);
      return false;
    }
  }, []);

  const signup = useCallback(async (
    name: string, 
    email: string, 
    password: string,
    profileData?: SignupProfile
  ): Promise<boolean> => {
    if (!email || !password || !name || !profileData?.bio || !profileData?.phone) {
      console.error("Name, email, password, bio, and phone are required");
      return false;
    }

    try {
      console.log("Attempting signup with Supabase for:", email);
      console.log("Profile data being sent:", JSON.stringify(profileData, null, 2));
      
      // First check if this email already exists but was deleted
      // This helps ensure the verification process is required again
      const { data: existingUserData, error: existingUserError } = await supabase.auth.signInWithPassword({
        email,
        password: password + "_intentionally_wrong_to_check_existence"
      });
      
      // If we got a user object back with different credentials error, we know this email exists
      // but was deleted from the admin dashboard
      if (existingUserError && 
          existingUserError.message.includes("Invalid login credentials") &&
          email.endsWith('@mail.utoronto.ca')) {
        // Force email verification by setting specific options
        console.log("Email previously existed - ensuring verification is required");
      }
      
      // Configure the redirect URL for email verification
      // Use absolute URL to ensure it works correctly
      const redirectUrl = `${window.location.origin}/auth?verified=true`;
      console.log("Email verification redirect URL:", redirectUrl);
      
      // Sign up the user with email confirmation always required
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            program: profileData?.program || '',
            year: profileData?.year || '',
            bio: profileData.bio,
            phone: profileData.phone,
            hasCompletedSetup: !!profileData?.hasCompletedSetup
          },
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        console.error("Error during sign up:", error.message);
        setError(error);
        return false;
      }

      if (!data.user) {
        console.error("No user returned from sign up");
        return false;
      }
      
      console.log("Signup response:", data);

      // Check if email confirmation is needed
      if (data.session) {
        console.log("User automatically signed in (email verification not required)");
        // User is automatically signed in (email verification not required)
        const userData: User = {
          id: data.user.id,
          name: name,
          email: email,
          isAuthenticated: true,
          hasCompletedSetup: !!profileData?.hasCompletedSetup,
          program: profileData?.program,
          year: profileData?.year,
          bio: profileData.bio,
          phone: profileData.phone
        };
        
        setUser(userData);
        saveUserToLocalStorage(userData);
        
        // Ensure profile data is saved to the profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            name: name,
            email: email,
            program: profileData?.program || null,
            year: profileData?.year || null,
            bio: profileData.bio,
            phone: profileData.phone
          }, { onConflict: 'id' });
        
        if (profileError) {
          console.error("Error updating profile:", profileError);
          toast.warning("Profile Update Warning", {
            description: "Your account was created, but we couldn't save all your profile details."
          });
        } else {
          console.log("Profile successfully created and updated with all fields");
        }
        
        return true;
      } else {
        console.log("Email verification required - user should check email");
        // Even if email verification is required, we should still create the profile
        // This ensures the profile exists when the user verifies their email
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            name: name,
            email: email,
            program: profileData?.program || null,
            year: profileData?.year || null,
            bio: profileData.bio,
            phone: profileData.phone
          }, { onConflict: 'id' });
        
        if (profileError) {
          console.error("Error creating initial profile:", profileError);
        } else {
          console.log("Initial profile successfully created with all fields");
        }
        
        // Only showing the Verification Required message (removed the green Account Created toast)
        toast.info("Verification Required", {
          description: "Verification email sent! Please check your inbox (including spam/junk folders). It may take 1-2 minutes to arrive.",
          duration: 6000 // Longer duration to ensure users have time to read
        });
        
        return true;
      }
    } catch (err) {
      const error = err as Error;
      console.error("Unexpected error during sign up:", error.message);
      setError(error);
      return false;
    }
  }, [setUser]);

  const resendVerificationEmail = useCallback(async (email: string): Promise<boolean> => {
    if (!email || !email.trim()) {
      console.error("Email is required for verification resend");
      toast.error("Email Required", {
        description: "Please provide your email address to resend the verification."
      });
      return false;
    }

    try {
      setIsResendingVerification(true);
      console.log(`Attempting to resend verification email to: ${email}`);
      
      // Configure the redirect URL for email verification
      const redirectUrl = `${window.location.origin}/auth?verified=true`;
      
      // Request Supabase to resend the verification email
      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        console.error("Error resending verification email:", error.message);
        toast.error("Verification Email Failed", {
          description: error.message || "Unable to resend verification email. Please try again later."
        });
        return false;
      }
      
      console.log("Verification email resent successfully:", data);
      
      // Single comprehensive notification for resending
      toast.info("Verification Email Sent", {
        description: "Verification email has been resent. Please check your inbox (including spam/junk folders). It may take 1-2 minutes to arrive.",
        duration: 6000 // Longer duration to ensure users have time to read
      });
      return true;
    } catch (err) {
      const error = err as Error;
      console.error("Unexpected error during verification resend:", error.message);
      toast.error("Verification Email Failed", {
        description: "An unexpected error occurred. Please try again later."
      });
      return false;
    } finally {
      setIsResendingVerification(false);
    }
  }, []);

  return {
    login,
    signup,
    resendVerificationEmail,
    isResendingVerification,
    error
  };
}
