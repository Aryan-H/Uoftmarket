
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';

export const useProfile = () => {
  const { user, updateUserProfile, isUpdatingProfile } = useAuth();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const location = useLocation();
  
  // Initialize form data with user data if available
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    program: user?.program || '',
    year: user?.year || '',
    bio: user?.bio || '',
    phone: user?.phone || '',
  });
  
  // Update form state when user data changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        program: user.program || '',
        year: user.year || '',
        bio: user.bio || '',
        phone: user.phone || '',
      });
      
      // If we have user data, check for avatar URL
      if (user.avatar_url) {
        setProfileImage(user.avatar_url);
      }
    }
  }, [user]); 
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to update your profile');
      return;
    }
    
    try {
      await updateUserProfile({
        name: formData.name,
        program: formData.program,
        year: formData.year,
        bio: formData.bio,
        phone: formData.phone,
        avatar_url: profileImage
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('An error occurred while updating your profile');
    }
  };
  
  // Get the active tab from URL parameters
  const getActiveTabFromUrl = () => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    
    if (tab === 'listings') return 'listings';
    if (tab === 'saved') return 'saved';
    if (tab === 'settings') return 'settings';
    return 'profile'; // Default tab
  };
  
  return {
    formData,
    handleChange,
    handleSelectChange,
    handleSubmit,
    isSubmitting: isUpdatingProfile,
    profileImage,
    setProfileImage: (url: string) => {
      setProfileImage(url);
      if (url) {
        toast.success('Profile photo updated successfully');
      }
    },
    activeTab: getActiveTabFromUrl()
  };
};
