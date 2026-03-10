import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { prepareImageUrl, getDirectDownloadUrl, tryObjectUrlFallback } from '@/utils/supabaseImageUtils';
import ImageErrorDisplay from './ImageErrorDisplay';

interface ImageDisplayProps {
  imageUrl: string | null | undefined;
  alt: string;
  className?: string;
  onError?: () => void;
}

const ImageDisplay = ({ 
  imageUrl, 
  alt, 
  className = '',
  onError
}: ImageDisplayProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [imageSrc, setImageSrc] = useState<string>('/placeholder.svg');
  const [useFallbackUrl, setUseFallbackUrl] = useState(false);
  const [useObjectUrl, setUseObjectUrl] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagnosticInfo, setDiagnosticInfo] = useState<any>(null);
  
  const isProcessingRef = useRef(false);
  const processedUrlRef = useRef<string | null>(null);
  
  const isSupabaseUrl = useMemo(() => 
    !!imageUrl && imageUrl.includes('supabase.co/storage'), 
    [imageUrl]
  );
  
  const processImageUrl = useCallback(async () => {
    if (isProcessingRef.current) return;
    if (processedUrlRef.current && imageUrl === processedUrlRef.current.split('?')[0]) {
      setImageSrc(processedUrlRef.current);
      setIsLoading(false);
      return;
    }
    
    isProcessingRef.current = true;
    
    if (!imageUrl) {
      setImageSrc('/placeholder.svg');
      setIsLoading(false);
      isProcessingRef.current = false;
      return;
    }

    setIsLoading(true);
    setError(false);
    
    let urlToUse = imageUrl;
    if (isSupabaseUrl && urlToUse.endsWith('download=')) {
      urlToUse = urlToUse + 'true';
    }
    
    if (useObjectUrl && isSupabaseUrl) {
      try {
        const { success, objectUrl } = await tryObjectUrlFallback(urlToUse);
        if (success && objectUrl) {
          setImageSrc(objectUrl);
          processedUrlRef.current = objectUrl;
        } else {
          setUseObjectUrl(false);
          setUseFallbackUrl(true);
        }
      } catch (err) {
        console.error('Error with object URL approach:', err);
        setError(true);
      }
      isProcessingRef.current = false;
      return;
    }
    
    if (useFallbackUrl && isSupabaseUrl) {
      try {
        const directUrl = await getDirectDownloadUrl(urlToUse, true);
        if (directUrl) {
          setImageSrc(directUrl);
          processedUrlRef.current = directUrl;
        } else {
          setUseObjectUrl(true);
        }
      } catch (err) {
        console.error('Error getting direct URL:', err);
        setUseObjectUrl(true);
      }
      isProcessingRef.current = false;
    } else {
      const processed = prepareImageUrl(urlToUse, isSupabaseUrl);
      setImageSrc(processed);
      processedUrlRef.current = processed;
      isProcessingRef.current = false;
    }
  }, [imageUrl, retryCount, useFallbackUrl, useObjectUrl, isSupabaseUrl]);

  useEffect(() => {
    processImageUrl();
    
    return () => {
      isProcessingRef.current = false;
    };
  }, [processImageUrl]);

  const handleImageLoad = () => {
    setIsLoading(false);
    setError(false);
  };

  const handleImageError = async () => {
    if (process.env.NODE_ENV === 'development' && retryCount === 0) {
      console.error("Failed to load image:", imageSrc);
    }
    setIsLoading(false);
    
    if (!useFallbackUrl && !useObjectUrl && isSupabaseUrl) {
      setUseFallbackUrl(true);
      return;
    }
    
    if (useFallbackUrl && !useObjectUrl && isSupabaseUrl) {
      setUseObjectUrl(true);
      return;
    }
    
    setError(true);
    
    if (retryCount === 0 && process.env.NODE_ENV === 'development') {
      try {
        const response = await fetch(imageSrc, {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'Accept': 'image/*',
            'Cache-Control': 'no-cache'
          }
        });
        
        const contentType = response.headers.get('content-type');
        let jsonResponse = null;
        let textResponse = null;
        
        if (contentType && contentType.includes('application/json')) {
          try {
            jsonResponse = await response.json();
          } catch (e) {
            console.error('Failed to parse JSON response:', e);
          }
        } else {
          try {
            const text = await response.text();
            textResponse = text.substring(0, 100) + (text.length > 100 ? '...' : '');
          } catch (e) {
            console.error('Failed to get response text:', e);
          }
        }
        
        setDiagnosticInfo({
          status: response.status,
          contentType,
          jsonResponse,
          textResponse,
          url: imageSrc
        });
      } catch (e) {
        console.error('Error getting diagnostic info:', e);
        setDiagnosticInfo({
          error: e instanceof Error ? e.message : String(e),
          url: imageSrc
        });
      }
    }
    
    if (onError) {
      onError();
    }
  };

  const handleRetry = () => {
    setUseObjectUrl(false);
    setUseFallbackUrl(false);
    setRetryCount(prev => prev + 1);
    processedUrlRef.current = null;
    isProcessingRef.current = false;
  };
  
  const handleDownloadImage = async () => {
    if (!isSupabaseUrl) return;
    
    try {
      const directUrl = await getDirectDownloadUrl(imageUrl || '', true);
      if (directUrl) {
        window.open(directUrl, '_blank');
      } else {
        console.error("Could not generate direct download URL");
      }
    } catch (err) {
      console.error('Error handling direct download:', err);
    }
  };

  const toggleDiagnostics = () => {
    setShowDiagnostics(prev => !prev);
  };

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      )}
      
      {error ? (
        <ImageErrorDisplay 
          imageUrl={imageUrl || ''}
          isSupabaseUrl={isSupabaseUrl}
          showDiagnostics={showDiagnostics}
          diagnosticInfo={diagnosticInfo}
          toggleDiagnostics={toggleDiagnostics}
          handleRetry={handleRetry}
          handleDownloadImage={handleDownloadImage}
        />
      ) : (
        <img
          src={imageSrc}
          alt={alt}
          className={`w-full h-full object-contain transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          crossOrigin="anonymous"
        />
      )}
    </div>
  );
};

export default ImageDisplay;
