import { supabase } from '@/integrations/supabase/client';
import { createObjectUrlFromImageUrl, testImageUrl, uploadImagePreservingFormat } from '@/utils/imageUtils';

// Use a global cache to avoid redundant URL processing across component instances
const processedUrlCache = new Map<string, string>();
const processedUrlTimestamps = new Map<string, number>();
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

// Cleanup function to prevent memory leaks from the cache
const cleanupExpiredCache = () => {
  const now = Date.now();
  processedUrlTimestamps.forEach((timestamp, key) => {
    if (now - timestamp > CACHE_EXPIRY_MS) {
      processedUrlCache.delete(key);
      processedUrlTimestamps.delete(key);
    }
  });
};

// Run cleanup every minute
setInterval(cleanupExpiredCache, 60 * 1000);

/**
 * Prepares a URL for image loading with appropriate parameters
 */
export const prepareImageUrl = (url: string, isSupabaseUrl: boolean): string => {
  if (!url) return '/placeholder.svg';
  
  // Check if we've already processed this URL
  const cacheKey = `${url}-${isSupabaseUrl}`;
  if (processedUrlCache.has(cacheKey)) {
    // Update timestamp to keep the cache entry fresh
    processedUrlTimestamps.set(cacheKey, Date.now());
    return processedUrlCache.get(cacheKey)!;
  }
  
  let processedUrl = url;
  if (isSupabaseUrl) {
    // If URL contains 'sign' path, it's a signed URL - need special handling
    if (url.includes('/object/sign/')) {
      // For signed URLs, ensure download parameter is present
      if (!url.includes('download=')) {
        processedUrl = url.includes('?') 
          ? `${url}&download=true` 
          : `${url}?download=true`;
      }
    } else {
      // For public URLs, rebuild with forced download=true parameter
      try {
        // Extract bucket and path information
        const matches = url.match(/\/storage\/v1\/object\/public\/([^\/]+)\/(.+?)(\?|$)/);
        if (matches && matches.length >= 3) {
          const bucket = matches[1];
          const path = matches[2].split('?')[0]; // Remove any query params
          
          // Rebuild URL with public endpoint and forced download parameter
          const { data } = supabase.storage
            .from(bucket)
            .getPublicUrl(path, { download: true });
          
          if (data?.publicUrl) {
            processedUrl = data.publicUrl;
          }
        }
      } catch (e) {
        console.error('Error rebuilding Supabase URL:', e);
      }
    }
  }
  
  // Make sure URL always ends with download=true, not just download=
  if (processedUrl.endsWith('download=')) {
    processedUrl = processedUrl + 'true';
  }
  
  // Add cache-busting timestamp
  const timestamp = Date.now();
  const finalUrl = processedUrl.includes('?') 
    ? `${processedUrl}&t=${timestamp}` 
    : `${processedUrl}?t=${timestamp}`;
  
  // Cache the processed URL
  processedUrlCache.set(cacheKey, finalUrl);
  processedUrlTimestamps.set(cacheKey, timestamp);
  
  return finalUrl;
};

// Create a cache for direct download URLs
const directDownloadCache = new Map<string, string>();
const directDownloadTimestamps = new Map<string, number>();

/**
 * Gets a direct download URL for a Supabase Storage object
 */
export const getDirectDownloadUrl = async (url: string, isSupabaseUrl: boolean): Promise<string | null> => {
  if (!isSupabaseUrl) return null;
  
  // Check cache first
  if (directDownloadCache.has(url)) {
    // Update timestamp to keep the cache entry fresh
    directDownloadTimestamps.set(url, Date.now());
    return directDownloadCache.get(url)!;
  }
  
  try {
    // First determine if this is a signed or public URL
    const isSignedUrl = url.includes('/object/sign/');
    
    let bucket, filePath;
    
    if (isSignedUrl) {
      // Extract bucket and path from signed URL
      const urlParts = url.match(/\/object\/sign\/([^\/]+)\/(.+?)(\?|$)/);
      if (urlParts && urlParts.length >= 3) {
        bucket = urlParts[1];
        filePath = urlParts[2].split('?')[0]; // Remove query params
      }
    } else {
      // Extract bucket and path from public URL
      const urlParts = url.match(/\/storage\/v1\/object\/public\/([^\/]+)\/(.+?)(\?|$)/);
      if (urlParts && urlParts.length >= 3) {
        bucket = urlParts[1];
        filePath = urlParts[2].split('?')[0]; // Remove query params
      }
    }
    
    if (!bucket || !filePath) {
      console.error('Could not extract bucket and path from URL:', url);
      return null;
    }
    
    // Generate a fresh signed URL with download=true
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, 60, {
        download: true,
        // Explicitly disable transform to avoid format conversion
        transform: {
          quality: 100 // Request highest quality to avoid compression
        }
      });
    
    if (signedUrlError) {
      console.error('Error creating signed URL:', signedUrlError);
      
      // Fall back to public URL with download flag
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath, {
          download: true
        });
      
      if (publicUrlData?.publicUrl) {
        directDownloadCache.set(url, publicUrlData.publicUrl);
        directDownloadTimestamps.set(url, Date.now());
        return publicUrlData.publicUrl;
      }
    } else if (signedUrlData?.signedUrl) {
      directDownloadCache.set(url, signedUrlData.signedUrl);
      directDownloadTimestamps.set(url, Date.now());
      return signedUrlData.signedUrl;
    }
  } catch (err) {
    console.error('Error getting direct download URL:', err);
  }
  
  return null;
};

// Cleanup expired direct download URLs
const cleanupExpiredDirectDownloads = () => {
  const now = Date.now();
  directDownloadTimestamps.forEach((timestamp, key) => {
    if (now - timestamp > CACHE_EXPIRY_MS) {
      directDownloadCache.delete(key);
      directDownloadTimestamps.delete(key);
    }
  });
};

// Run cleanup every minute
setInterval(cleanupExpiredDirectDownloads, 60 * 1000);

/**
 * Attempts to create an Object URL from an image URL as a fallback method
 */
export const tryObjectUrlFallback = async (url: string): Promise<{ success: boolean, objectUrl: string | null }> => {
  try {
    // Add download flag to URL for direct download
    const downloadUrl = url.includes('?') 
      ? `${url.split('?')[0]}?download=true` 
      : `${url}?download=true`;
    
    const { objectUrl: objUrl, error: objError } = await createObjectUrlFromImageUrl(downloadUrl);
    
    if (objUrl && !objError) {
      return { success: true, objectUrl: objUrl };
    } else if (objError) {
      // Only log detailed errors in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to create object URL with download=true:', objError);
      }
      
      // Try with original URL as a fallback
      const { objectUrl: originalObjUrl, error: originalObjError } = await createObjectUrlFromImageUrl(url);
      if (originalObjUrl && !originalObjError) {
        return { success: true, objectUrl: originalObjUrl };
      }
      
      return { success: false, objectUrl: null };
    }
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error creating object URL:', err);
    }
  }
  return { success: false, objectUrl: null };
};

// Re-export useful functions from imageUtils
export { uploadImagePreservingFormat, testImageUrl } from '@/utils/imageUtils';
