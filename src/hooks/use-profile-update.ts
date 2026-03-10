
import { useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { User } from '@/types/auth';
import { updateUserProfile } from '@/utils/authUtils';
import { deleteImage } from '@/utils/supabaseStorage';

// Hook for updating user profile data
export function useProfileUpdate(
  user: User | null,
  setUser: (user: User | null) => void,
  setIsUpdatingProfile: (isUpdating: boolean) => void
) {
  const updateUserProfileData = useCallback(async (profileData: any): Promise<boolean> => {
    if (!user) {
      console.error('Cannot update profile: No authenticated user');
      toast.error('Authentication Error', {
        description: 'You must be logged in to update your profile'
      });
      return false;
    }
    
    console.log('Starting profile update at:', new Date().toISOString());
    console.log('Profile update data:', profileData);
    
    try {
      setIsUpdatingProfile(true);
      
      // Check if avatar_url is being changed and delete old image if so
      if (profileData.avatar_url !== user.avatar_url) {
        // Only try to delete if there was a previous image and it's different from the new one
        // Also make sure to not try to delete if the previous image was null or empty
        if (user.avatar_url && user.avatar_url.trim() !== '' && profileData.avatar_url !== user.avatar_url) {
          console.log('Detected avatar change, deleting old image:', user.avatar_url);
          try {
            await deleteImage(user.avatar_url);
            console.log('Successfully deleted old profile image');
          } catch (deleteError) {
            console.warn('Error deleting old profile image:', deleteError);
            // Continue with profile update even if image deletion fails
          }
        }
      }
      
      // First try to update the database profile
      console.log('Updating profiles table for user ID:', user.id);
      const success = await updateUserProfile(user.id, profileData);
      
      if (!success) {
        console.error('Database profile update failed');
        toast.error('Update Failed', {
          description: 'There was a problem saving your profile to the database'
        });
        setIsUpdatingProfile(false);
        return false;
      }
      
      // Then update auth metadata (as a backup/cache)
      try {
        const { error: metadataError } = await supabase.auth.updateUser({
          data: {
            name: profileData.name,
            program: profileData.program,
            year: profileData.year,
            bio: profileData.bio,
            phone: profileData.phone,
            avatar_url: profileData.avatar_url,
            hasCompletedSetup: true
          }
        });
        
        if (metadataError) {
          console.warn('Failed to update auth metadata, but database update succeeded:', metadataError);
          // Continue since the database update worked
        }
      } catch (metadataError) {
        console.warn('Error updating auth metadata:', metadataError);
        // Continue since the database update worked
      }
      
      // Update local user state with new profile data
      const updatedUser = {
        ...user,
        ...profileData,
        hasCompletedSetup: true
      };
      
      setUser(updatedUser);
      
      console.log('Profile update completed successfully at:', new Date().toISOString());
      toast.success('Profile Updated', {
        description: 'Your profile has been updated successfully'
      });
      
      return true;
    } catch (error) {
      console.error('Error in profile update:', error);
      toast.error('Update Failed', {
        description: 'There was a problem updating your profile'
      });
      return false;
    } finally {
      // Always ensure we reset the updating state
      setIsUpdatingProfile(false);
    }
  }, [user, setUser, setIsUpdatingProfile]);
  
  return {
    updateUserProfile: updateUserProfileData
  };
}
