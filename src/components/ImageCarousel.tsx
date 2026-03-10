
import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import ImageDisplay from '@/components/ImageDisplay';

interface ImageCarouselProps {
  images: string[];
  alt: string;
  className?: string;
  onImageError?: () => void;
  conditionBadge?: React.ReactNode;
}

const ImageCarousel = ({ 
  images, 
  alt, 
  className = '',
  onImageError,
  conditionBadge
}: ImageCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const loggedImagesRef = useRef(false);
  
  // Clean up any timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  // Log images for debugging only once per component mount
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && !loggedImagesRef.current) {
      console.log('ImageCarousel received images:', images);
      loggedImagesRef.current = true;
    }
  }, [images]);
  
  // Filter out empty or null images and ensure no duplicates
  const validImages = Array.from(new Set(images.filter(img => img && img.trim() !== '')));
  
  // Return regular ImageDisplay if only one or no valid images
  if (validImages.length <= 1) {
    return (
      <div className={`relative ${className}`}>
        <ImageDisplay 
          imageUrl={validImages[0] || '/placeholder.svg'} 
          alt={alt} 
          className="h-full w-full object-contain" 
          onError={onImageError}
        />
        {conditionBadge && (
          <div className="absolute bottom-2 left-2 z-20">
            {conditionBadge}
          </div>
        )}
      </div>
    );
  }

  // Debounced navigation handlers to prevent rapid clicks
  const handlePrevious = useCallback(() => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setCurrentIndex(prev => (prev === 0 ? validImages.length - 1 : prev - 1));
    
    // Reset transition state after animation completes
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = window.setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  }, [isTransitioning, validImages.length]);

  const handleNext = useCallback(() => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setCurrentIndex(prev => (prev === validImages.length - 1 ? 0 : prev + 1));
    
    // Reset transition state after animation completes
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = window.setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  }, [isTransitioning, validImages.length]);

  const handleDotClick = useCallback((index: number) => {
    if (isTransitioning || index === currentIndex) return;
    
    setIsTransitioning(true);
    setCurrentIndex(index);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = window.setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  }, [isTransitioning, currentIndex]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Image counter indicator - positioned at top-right */}
      <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full z-20">
        {currentIndex + 1} / {validImages.length}
      </div>

      {/* Condition badge - positioned at bottom-left */}
      {conditionBadge && (
        <div className="absolute bottom-2 left-2 z-20">
          {conditionBadge}
        </div>
      )}

      <div className="relative h-full w-full">
        <ImageDisplay 
          imageUrl={validImages[currentIndex]} 
          alt={`${alt} - image ${currentIndex + 1} of ${validImages.length}`}
          className="h-full w-full object-contain transition-opacity duration-300"
          onError={onImageError}
        />
      </div>
      
      {/* Dots indicator - improved positioning and visibility */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
        {validImages.map((_, idx) => (
          <button
            key={idx}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              idx === currentIndex ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/80'
            }`}
            onClick={() => handleDotClick(idx)}
            disabled={isTransitioning}
            aria-label={`Go to image ${idx + 1}`}
          />
        ))}
      </div>
      
      {/* Add invisible click areas for touch navigation */}
      <button 
        aria-label="Previous image"
        className="absolute left-0 top-0 h-full w-1/2 opacity-0"
        onClick={handlePrevious}
        disabled={isTransitioning}
      />
      <button 
        aria-label="Next image"
        className="absolute right-0 top-0 h-full w-1/2 opacity-0"
        onClick={handleNext}
        disabled={isTransitioning}
      />
    </div>
  );
};

export default ImageCarousel;
