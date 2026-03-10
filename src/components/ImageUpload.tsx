
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, X, Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';
import { validateImageFile } from '@/utils/listingUtils';

interface ImageUploadProps {
  images: { file: File; preview: string }[];
  setImages: React.Dispatch<React.SetStateAction<{ file: File; preview: string }[]>>;
  maxImages?: number;
  onChange?: (files: File[]) => void;
}

const ImageUpload = ({ 
  images, 
  setImages, 
  maxImages = 5,
  onChange 
}: ImageUploadProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    setIsLoading(true);
    const newImages: { file: File; preview: string }[] = [];
    const fileList: File[] = [];
    
    // Count how many slots we have left
    const slotsLeft = maxImages - images.length;
    if (slotsLeft <= 0) {
      toast("Maximum images reached", {
        description: `You can only upload up to ${maxImages} images.`
      });
      setIsLoading(false);
      return;
    }
    
    // Process only as many files as we have slots for
    const filesToProcess = Math.min(files.length, slotsLeft);
    let processedCount = 0;
    
    for (let i = 0; i < files.length && processedCount < filesToProcess; i++) {
      const file = files[i];
      
      // Validate file
      const validation = validateImageFile(file);
      if (!validation.valid) {
        toast.error("Invalid file", {
          description: `${file.name}: ${validation.message}`
        });
        continue;
      }
      
      processedCount++;
      fileList.push(file);
      
      // Read file as data URL for preview
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          newImages.push({ file, preview: reader.result });
          
          // When all files are processed, update state
          if (newImages.length === processedCount) {
            setImages(prev => [...prev, ...newImages]);
            setIsLoading(false);
            
            if (onChange) {
              onChange([...images.map(img => img.file), ...fileList]);
            }
          }
        }
      };
      
      reader.onerror = () => {
        toast("Error loading image", {
          description: "There was a problem loading the image preview."
        });
        setIsLoading(false);
      };
      
      reader.readAsDataURL(file);
    }
    
    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // If no valid images were found
    if (processedCount === 0) {
      toast("No valid images", {
        description: "Please select valid image files (JPG, PNG, etc.)."
      });
      setIsLoading(false);
    }
  };
  
  const handleRemoveImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
    
    if (onChange) {
      onChange(updatedImages.map(img => img.file));
    }
  };
  
  const handleAddImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Display existing images */}
        {images.map((image, index) => (
          <div key={index} className="relative aspect-square rounded-md overflow-hidden border bg-gray-50">
            <img 
              src={image.preview} 
              alt={`Preview ${index + 1}`}
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600"
              onClick={() => handleRemoveImage(index)}
            >
              <span className="sr-only">Remove</span>
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        
        {/* Upload button (only if under max images) */}
        {images.length < maxImages && (
          <div 
            className={`aspect-square rounded-md border-2 border-dashed border-gray-300 flex flex-col items-center justify-center p-4 hover:bg-gray-50 ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={isLoading ? undefined : handleAddImageClick}
          >
            {isLoading ? (
              <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
            ) : (
              <>
                <Camera className="mx-auto h-8 w-8 text-gray-400" />
                <span className="mt-2 block text-sm font-medium text-gray-600">
                  Add Photo
                </span>
              </>
            )}
          </div>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleImageUpload}
          disabled={isLoading}
        />
      </div>
      
      <div className="space-y-2">
        <p className="text-xs text-gray-500">
          Upload up to {maxImages} photos of your item. The first photo will be the cover image.
        </p>
        <div className="flex items-start gap-1 text-xs text-blue-600">
          <Info className="h-3 w-3 mt-0.5" />
          <p>You must be logged in to upload images.</p>
        </div>
      </div>
    </div>
  );
};

export default ImageUpload;
