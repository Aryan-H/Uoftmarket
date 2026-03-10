
import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface SupabaseImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  fallbackSrc?: string;
  onError?: () => void;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

const SupabaseImage = ({
  src,
  alt,
  className = '',
  width,
  height,
  fallbackSrc = '/placeholder.svg',
  onError,
  objectFit = 'contain'
}: SupabaseImageProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>(src);
  const hasLoggedRef = useRef(false);
  
  // Add cache-busting parameter to Supabase URLs to prevent caching issues
  useEffect(() => {
    if (!src) {
      setImageSrc(fallbackSrc);
      setIsLoading(false);
      return;
    }
    
    const isSupabaseUrl = src.includes('supabase.co/storage');
    if (isSupabaseUrl) {
      // Add download=true parameter to ensure proper content-type
      const urlWithDownload = src.includes('?') 
        ? `${src}&download=true` 
        : `${src}?download=true`;
      
      // Add cache-busting timestamp
      const timestamp = new Date().getTime();
      setImageSrc(`${urlWithDownload}&t=${timestamp}`);
    } else {
      setImageSrc(src);
    }
  }, [src, fallbackSrc]);
  
  const handleImageLoad = () => {
    setIsLoading(false);
    setError(false);
  };
  
  const handleImageError = () => {
    // Only log errors once per component instance to avoid console spam
    if (!hasLoggedRef.current) {
      console.error('Error loading image:', imageSrc);
      hasLoggedRef.current = true;
    }
    
    setIsLoading(false);
    setError(true);
    
    if (onError) {
      onError();
    }
  };
  
  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-md">
          <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
        </div>
      )}
      
      <img
        src={error ? fallbackSrc : imageSrc}
        alt={alt}
        className={`w-full h-full transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        style={{ 
          width, 
          height,
          objectFit
        }}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
    </div>
  );
};

export default SupabaseImage;
