import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Camera, Trash2 } from 'lucide-react';
import { uploadImage, checkBucketExists, deleteImage } from '@/utils/supabaseStorage';
import { useCoreAuth } from '@/contexts/CoreAuthContext';
import { validateImageFile, logImageUploadAttempt } from '@/utils/supabaseStorage';
import { supabase } from '@/integrations/supabase/client';

interface ProfileImageUploaderProps {
  onImageUploaded: (url: string) => void;
  className?: string;
  initialImage?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

const ProfileImageUploader = ({
  onImageUploaded,
  className = '',
  initialImage = null,
  size = 'md'
}: ProfileImageUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(initialImage);
  const [bucketStatus, setBucketStatus] = useState<{exists: boolean, error?: string} | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, isAuthenticated } = useCoreAuth();
  
  const BUCKET_NAME = 'profile-images';
  
  useEffect(() => {
    if (user?.id && !initialImage && isAuthenticated) {
      const fetchProfileImage = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('avatar_url')
            .eq('id', user.id)
            .single();
            
          if (error) {
            console.error("Error fetching profile image:", error);
            return;
          }
            
          if (data && data.avatar_url) {
            setPreview(data.avatar_url);
          }
        } catch (error) {
          console.error("Error in fetchProfileImage:", error);
        }
      };
        
      fetchProfileImage();
    }
  }, [user?.id, initialImage, isAuthenticated]);
  
  const sizeClasses = {
    sm: {
      container: 'h-16 w-16',
      icon: 'h-4 w-4',
      button: 'p-1'
    },
    md: {
      container: 'h-24 w-24',
      icon: 'h-5 w-5',
      button: 'p-1.5'
    },
    lg: {
      container: 'h-32 w-32',
      icon: 'h-6 w-6',
      button: 'p-2'
    }
  }[size];
  
  useEffect(() => {
    const initBucket = async () => {
      if (!isAuthenticated || !user?.id) {
        console.log('User not authenticated, skipping bucket initialization');
        return;
      }
      
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        console.error('No valid session found for bucket initialization:', sessionError);
        setBucketStatus({
          exists: false,
          error: 'Authentication error: No valid session found'
        });
        return;
      }
      
      console.log('Checking profile bucket status...');
      const bucketCheck = await checkBucketExists(BUCKET_NAME);
      setBucketStatus(bucketCheck);
      
      if (!bucketCheck.exists) {
        console.error(`Failed to find bucket: ${bucketCheck.error}`);
      } else {
        console.log(`Bucket ${BUCKET_NAME} exists and is ready to use`);
      }
    };
    
    if (isAuthenticated && user?.id) {
      initBucket();
    }
  }, [isAuthenticated, user?.id, BUCKET_NAME]);
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!user?.id || !isAuthenticated) {
      toast.error('Authentication required', {
        description: "You must be logged in to upload a profile image"
      });
      return;
    }
    
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error('Invalid file', {
        description: validation.message
      });
      return;
    }
    
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
    
    setIsUploading(true);
    try {
      console.log("Starting profile image upload for file:", file.name, "type:", file.type);
      console.log("User ID for upload:", user.id);
      
      logImageUploadAttempt(file, BUCKET_NAME, user.id);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/profile-${Date.now()}.${fileExt}`;
      
      console.log(`Uploading to path: ${BUCKET_NAME}/${fileName}`);
      
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .single();
          
        if (profileError) {
          console.error("Error fetching current profile data:", profileError);
          throw new Error("Could not verify current profile image");
        }
        
        if (profileData?.avatar_url) {
          console.log("Attempting to delete profile image from storage:", profileData.avatar_url);
          const deleted = await deleteImage(profileData.avatar_url);
          
          if (!deleted) {
            console.warn("Could not delete profile image from storage");
          } else {
            console.log("Successfully deleted profile image from storage");
          }
        }
      } catch (prevImageError) {
        console.warn("Error checking/deleting previous profile image:", prevImageError);
        // Continue with upload even if deletion fails
      }
      
      const url = await uploadImage(file, BUCKET_NAME, fileName);
      
      if (url) {
        console.log("Profile image uploaded successfully:", url);
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: url })
          .eq('id', user.id);
          
        if (updateError) {
          console.error("Error updating profile with avatar URL:", updateError);
        }
        
        onImageUploaded(url);
      } else {
        setUploadError("Failed to upload image. Please try again later.");
        console.error("Upload returned null URL");
        toast.error('Upload failed', {
          description: "There was a problem uploading your profile image"
        });
      }
    } catch (error) {
      console.error('Error uploading profile image:', error);
      setUploadError(error instanceof Error ? error.message : "Unknown error");
      toast.error('Upload failed', {
        description: error instanceof Error 
          ? error.message 
          : "An unexpected error occurred"
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleButtonClick = () => {
    if (!user?.id || !isAuthenticated) {
      toast.error('Authentication required', {
        description: "You must be logged in to upload a profile image"
      });
      return;
    }
    
    fileInputRef.current?.click();
  };
  
  const removeImage = async () => {
    if (!user?.id || !preview || !isAuthenticated) return;
    
    try {
      setIsUploading(true);
      
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error('Authentication required. Please re-login and try again.');
      }
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error("Error fetching current profile data:", profileError);
        throw new Error("Could not verify current profile image");
      }
      
      if (profileData?.avatar_url) {
        console.log("Attempting to delete profile image from storage:", profileData.avatar_url);
        const deleted = await deleteImage(profileData.avatar_url);
        
        if (!deleted) {
          console.warn("Could not delete profile image from storage");
        } else {
          console.log("Successfully deleted profile image from storage");
        }
      }
      
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);
        
      if (error) {
        throw new Error("Failed to remove profile image: " + error.message);
      }
      
      setPreview(null);
      onImageUploaded('');
      toast.success("Profile image removed");
    } catch (error) {
      console.error("Error removing profile image:", error);
      toast.error("Failed to remove profile image");
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div className={`relative ${sizeClasses.container} ${className}`}>
      <div className={`${sizeClasses.container} rounded-full overflow-hidden bg-gray-100 relative`}>
        {preview ? (
          <>
            <img 
              src={preview} 
              alt="Profile" 
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-0 right-0 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full p-1 m-1 shadow-sm"
              disabled={isUploading}
              aria-label="Remove profile image"
              title="Remove profile image"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </>
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gray-100">
            <Camera className={`${sizeClasses.icon} text-gray-400`} />
          </div>
        )}
        
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none">
            <Loader2 className={`${sizeClasses.icon} text-white animate-spin`} />
          </div>
        )}
      </div>
      
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={isUploading || !isAuthenticated}
        className={`absolute bottom-0 right-0 bg-blue-500 text-white rounded-full ${sizeClasses.button} hover:bg-blue-600 disabled:opacity-50`}
      >
        <Camera className={sizeClasses.icon} />
      </button>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
        disabled={isUploading || !isAuthenticated}
      />
      
      {!isAuthenticated && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-full pointer-events-none">
          <p className="text-xs text-red-600 font-medium bg-white p-1 rounded">
            Login required
          </p>
        </div>
      )}
      
      {uploadError && (
        <div className="absolute -bottom-8 left-0 right-0 text-xs text-red-600 text-center">
          {uploadError}
        </div>
      )}
      
      {bucketStatus && !bucketStatus.exists && (
        <p className="text-xs text-red-600 font-medium mt-2">
          Storage bucket issue: {bucketStatus.error}
        </p>
      )}
    </div>
  );
};

export default ProfileImageUploader;
