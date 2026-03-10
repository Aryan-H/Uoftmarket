
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import ImageUploader from './ImageUploader';
import SupabaseImage from './SupabaseImage';
import { deleteImage, listImages } from '@/utils/supabaseStorage';
import { useCoreAuth } from '@/contexts/CoreAuthContext';

const StorageDemo = () => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [userImages, setUserImages] = useState<any[]>([]);
  const { user, isAuthenticated } = useCoreAuth();
  
  const handleImageUploaded = (url: string) => {
    setImageUrl(url);
  };
  
  const handleDeleteImage = async () => {
    if (!imageUrl) return;
    
    const success = await deleteImage(imageUrl);
    if (success) {
      toast.success('Image deleted successfully');
      setImageUrl('');
    } else {
      toast.error('Failed to delete image');
    }
  };
  
  const handleListImages = async () => {
    if (!isAuthenticated || !user?.id) {
      toast.error('You must be logged in to list your images');
      return;
    }
    
    const images = await listImages(user.id);
    if (images) {
      setUserImages(images);
      toast.success(`Found ${images.length} images`);
    } else {
      toast.error('Failed to list images');
    }
  };
  
  return (
    <div className="space-y-8 p-6 bg-white rounded-lg shadow-sm">
      <div>
        <h2 className="text-xl font-semibold mb-4">Upload an Image</h2>
        <ImageUploader onImageUploaded={handleImageUploaded} />
      </div>
      
      {imageUrl && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Uploaded Image</h2>
          <SupabaseImage 
            src={imageUrl} 
            alt="Uploaded image" 
            className="w-full max-h-64 rounded-md" 
          />
          
          <div>
            <Label htmlFor="image-url">Image URL</Label>
            <div className="flex gap-2 mt-1">
              <Input 
                id="image-url" 
                value={imageUrl} 
                readOnly 
                className="font-mono text-xs"
              />
              <Button 
                variant="destructive" 
                size="icon"
                onClick={handleDeleteImage}
                title="Delete image"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <div className="border-t pt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Your Images</h2>
          <Button onClick={handleListImages} disabled={!isAuthenticated}>
            Refresh
          </Button>
        </div>
        
        {userImages.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {userImages.map((image) => (
              <div key={image.name} className="space-y-1">
                {image.metadata && image.metadata.mimetype?.startsWith('image/') ? (
                  <SupabaseImage 
                    src={`${user?.id}/${image.name}`} 
                    alt={image.name}
                    className="aspect-square rounded-md" 
                  />
                ) : (
                  <div className="aspect-square bg-gray-100 rounded-md flex items-center justify-center">
                    <p className="text-sm text-gray-500">Not an image</p>
                  </div>
                )}
                <p className="text-xs truncate">{image.name}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No images found. Upload some images first.</p>
        )}
      </div>
    </div>
  );
};

export default StorageDemo;
