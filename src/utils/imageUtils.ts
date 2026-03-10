/**
 * Creates an object URL from an image URL by fetching it
 * @param url The image URL to fetch
 * @returns Object with the created object URL or error
 */
export const createObjectUrlFromImageUrl = async (
  url: string
): Promise<{ objectUrl: string | null; error: string | null }> => {
  try {
    const response = await fetch(url, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return {
        objectUrl: null,
        error: `Failed to fetch image (${response.status}): ${errorText}`
      };
    }
    
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    
    return { objectUrl, error: null };
  } catch (error) {
    return {
      objectUrl: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Tests if an image URL is valid and can be loaded
 * @param url The image URL to test
 * @returns Object with test result status
 */
export const testImageUrl = async (url: string): Promise<{ 
  success: boolean; 
  status?: number;
  contentType?: string;
  error?: string;
  blobSize?: number;
}> => {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'Cache-Control': 'no-cache'
      },
      cache: 'no-store'
    });
    
    return {
      success: response.ok,
      status: response.status,
      contentType: response.headers.get('Content-Type') || undefined,
      error: response.ok ? undefined : `Failed with status: ${response.status}`
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Uploads an image file to Supabase storage preserving the original format
 * This is a wrapper around the supabaseStorage.uploadImage function
 * @param bucketName The bucket to upload to
 * @param userId The user ID (used as the first path segment)
 * @param file The file to upload
 * @returns The URL of the uploaded image or null
 */
export const uploadImagePreservingFormat = async (
  bucketName: string, 
  userId: string,
  file: File
): Promise<string | null> => {
  try {
    // Import here to avoid circular dependency
    const { uploadImage } = await import('@/utils/supabaseStorage');
    
    console.log(`Uploading image to ${bucketName} with user ID ${userId}`);
    console.log(`File details: ${file.name}, type: ${file.type}, size: ${file.size}`);
    
    // Create a specific path for the file to ensure it preserves the format
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const path = `${userId}/${timestamp}-${randomString}-${safeName}`;
    
    return await uploadImage(file, bucketName, path);
  } catch (error) {
    console.error('Error in uploadImagePreservingFormat:', error);
    throw error;
  }
};

/**
 * Tests an image's properties (dimensions, format) from an object URL
 * @param objectUrl The object URL to test
 * @returns Object with test results including dimensions
 */
export const testImageProperties = (objectUrl: string): Promise<{
  success: boolean;
  width?: number;
  height?: number;
  error?: string;
  originalFormat?: string;
}> => {
  return new Promise((resolve) => {
    const img = new Image();
    const timeoutId = setTimeout(() => {
      resolve({
        success: false,
        error: "Image loading timed out after 5 seconds"
      });
    }, 5000);
    
    img.onload = () => {
      clearTimeout(timeoutId);
      resolve({
        success: true,
        width: img.naturalWidth,
        height: img.naturalHeight,
        originalFormat: getImageFormatFromUrl(objectUrl)
      });
    };
    
    img.onerror = () => {
      clearTimeout(timeoutId);
      resolve({
        success: false,
        error: "Image failed to load"
      });
    };
    
    img.src = objectUrl;
  });
};

/**
 * Try to determine image format from URL or MIME type
 * @param url The URL to analyze
 * @returns The detected format or undefined
 */
export const getImageFormatFromUrl = (url: string): string | undefined => {
  // Check URL extension
  const extensionMatch = url.match(/\.([a-zA-Z0-9]+)($|\?)/);
  if (extensionMatch && extensionMatch[1]) {
    const ext = extensionMatch[1].toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif'].includes(ext)) {
      return ext.toUpperCase();
    }
  }
  
  // Check for data URLs
  if (url.startsWith('data:image/')) {
    const mimeMatch = url.match(/^data:image\/([a-zA-Z0-9]+);/);
    if (mimeMatch && mimeMatch[1]) {
      return mimeMatch[1].toUpperCase();
    }
  }
  
  // Check for blob URLs with type info in query params
  if (url.includes('type=image/')) {
    const typeMatch = url.match(/type=image\/([a-zA-Z0-9]+)/);
    if (typeMatch && typeMatch[1]) {
      return typeMatch[1].toUpperCase();
    }
  }
  
  return undefined;
};
