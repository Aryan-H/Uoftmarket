
import React from 'react';
import { Loader2 } from 'lucide-react';

interface ImageLoadingIndicatorProps {
  isVisible: boolean;
}

const ImageLoadingIndicator: React.FC<ImageLoadingIndicatorProps> = ({ isVisible }) => {
  if (!isVisible) return null;
  
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
      <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
    </div>
  );
};

export default ImageLoadingIndicator;
