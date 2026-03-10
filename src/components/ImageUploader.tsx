
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Upload, X } from 'lucide-react';
import { uploadImage, checkBucketExists } from '@/utils/supabaseStorage';
import { useCoreAuth } from '@/contexts/CoreAuthContext';
import { validateImageFile, logImageUploadAttempt } from '@/utils/listingUtils';

interface ImageUploaderProps {
  onImageUploaded: (url: string) => void;
  className?: string;
  maxSizeMB?: number;
  acceptedFileTypes?: string;
  buttonText?: string;
}

const ImageUploader = ({
  onImageUploaded,
  className = '',
  maxSizeMB = 10,
  acceptedFileTypes = 'image/*',
  buttonText = 'Upload Image'
}: ImageUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [bucketStatus, setBucketStatus] = useState<{exists: boolean, error?: string} | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, isAuthenticated } = useCoreAuth();
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Verify authentication
    if (!isAuthenticated || !user?.id) {
      toast.error('Authentication required', {
        description: 'You must be logged in to upload images'
      });
      console.error('User authentication status:', { isAuthenticated, userId: user?.id });
      return;
    }
    
    // Validate the file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error("Invalid file", {
        description: validation.message
      });
      return;
    }
    
    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    // First check if bucket exists before attempting upload
    setIsUploading(true);
    
    try {
      console.log("Starting image upload process for file:", file.name, "size:", file.size);
      console.log("User ID for upload:", user.id);
      
      // Check bucket before uploading - using correct bucket name
      const bucketCheck = await checkBucketExists('listing-images');
      setBucketStatus(bucketCheck);
      
      if (!bucketCheck.exists) {
        throw new Error(`Storage not configured: listing-images bucket is missing. ${bucketCheck.error || ''}`);
      }
      
      // Log the upload attempt
      logImageUploadAttempt(file, 'listing-images', user.id);
      
      // Upload to the listing-images bucket
      const url = await uploadImage(file, 'listing-images');
      
      if (url) {
        console.log("Image uploaded successfully:", url);
        onImageUploaded(url);
        toast.success('Image uploaded successfully');
      } else {
        setUploadError("Failed to upload image. Please try again later.");
        console.error("Upload returned null URL");
        toast.error('Upload failed', {
          description: 'There was a problem uploading your image. Please try again.'
        });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setUploadError(error instanceof Error ? error.message : "Unknown error");
      toast.error('Upload failed', {
        description: error instanceof Error 
          ? `${error.message}. Please try again.` 
          : "Unknown error. Please try again."
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleButtonClick = () => {
    if (!isAuthenticated) {
      toast.error('Authentication required', {
        description: 'You must be logged in to upload images'
      });
      return;
    }
    
    fileInputRef.current?.click();
  };
  
  const clearPreview = () => {
    setPreview(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <div className={`space-y-4 ${className}`}>
      {preview ? (
        <div className="relative">
          <img 
            src={preview} 
            alt="Preview" 
            className="max-h-64 rounded-md object-contain" 
          />
          <button
            type="button"
            onClick={clearPreview}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
            disabled={isUploading}
          >
            <X size={16} />
          </button>
        </div>
      ) : null}
      
      <Button
        type="button"
        onClick={handleButtonClick}
        disabled={isUploading}
        variant="outline"
        className="w-full"
      >
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            {buttonText}
          </>
        )}
      </Button>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={acceptedFileTypes}
        className="hidden"
        disabled={isUploading}
      />
      
      {!isAuthenticated && (
        <p className="text-xs text-red-600 font-medium">
          You must be logged in to upload images
        </p>
      )}
      
      {uploadError && (
        <p className="text-xs text-red-600 font-medium">
          Upload error: {uploadError}
        </p>
      )}
      
      {bucketStatus && !bucketStatus.exists && (
        <p className="text-xs text-red-600 font-medium">
          Storage bucket issue: {bucketStatus.error}
        </p>
      )}
    </div>
  );
};

export default ImageUploader;
