import { supabase } from '@/integrations/supabase/client';

/**
 * Checks if a storage bucket exists
 * @param bucketName Name of the bucket to check
 * @returns Object containing existence status and any error
 */
export const checkBucketExists = async (
  bucketName: string
): Promise<{ exists: boolean; error?: string }> => {
  try {
    console.log(`Checking if bucket '${bucketName}' exists...`);
    
    // Ensure we have a valid session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      console.warn('No active session found for bucket check');
      return {
        exists: false,
        error: `Authentication required: ${sessionError?.message || 'No valid session'}`
      };
    }
    
    // Log session info for debugging
    console.log(`Session info for bucket check: User ID ${sessionData.session.user.id}, expires ${new Date(sessionData.session.expires_at! * 1000).toISOString()}`);
    
    // Directly try to access the bucket to test if it exists
    try {
      // Try to list files in the root of the bucket with a small limit
      const { data: files, error: listError } = await supabase.storage
        .from(bucketName)
        .list('', { limit: 1 });
      
      // If we get a "Bucket not found" error, it doesn't exist
      if (listError && listError.message.includes('bucket not found')) {
        console.log(`Bucket '${bucketName}' does not exist (confirmed via list error)`);
        return { 
          exists: false, 
          error: `Bucket not found` 
        };
      }
      
      // If we get another error, log it but assume bucket exists (could be permissions)
      if (listError) {
        console.log(`Got error listing bucket '${bucketName}', but bucket might still exist:`, listError);
        
        // Try an alternate approach - get public URL for a non-existent file
        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl('test-file-that-doesnt-exist.txt');
        
        // If we can generate a URL, the bucket exists
        if (urlData && urlData.publicUrl) {
          console.log(`Confirmed bucket '${bucketName}' exists via public URL generation`);
          return { exists: true };
        }
        
        return { 
          exists: false, 
          error: `Error accessing bucket: ${listError.message}` 
        };
      }
      
      // If we successfully listed files (even an empty array), the bucket exists
      console.log(`Bucket '${bucketName}' exists (confirmed via successful list)`);
      return { exists: true };
    } catch (accessError) {
      console.error(`Error trying to access bucket '${bucketName}':`, accessError);
      return {
        exists: false,
        error: accessError instanceof Error ? accessError.message : 'Unknown access error'
      };
    }
  } catch (error) {
    console.error('Error checking bucket:', error);
    return {
      exists: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Checks if a storage bucket exists and creates it if it doesn't (admin-only operation)
 * Note: This has been updated to work with existing buckets only
 */
export const ensureBucketExists = async (
  bucketName: string
): Promise<{ exists: boolean; created: boolean; error: string | null }> => {
  try {
    console.log(`Checking if bucket '${bucketName}' exists...`);
    
    // First check if a valid session exists
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !sessionData.session) {
      console.error('No valid session found for bucket access:', sessionError);
      return {
        exists: false,
        created: false,
        error: 'Authentication required: No valid session found'
      };
    }
    
    // USE THE SAME METHOD IN checkBucketExists TO VERIFY BUCKET EXISTENCE
    const bucketCheck = await checkBucketExists(bucketName);
    
    if (bucketCheck.exists) {
      console.log(`Bucket '${bucketName}' already exists`);
      return { exists: true, created: false, error: null };
    }
    
    // Bucket doesn't exist, but we can't create it through the client
    // This requires an admin SQL operation
    console.log(`Bucket '${bucketName}' not found - please ensure it's created via SQL migration`);
    return {
      exists: false,
      created: false,
      error: bucketCheck.error || `Bucket '${bucketName}' does not exist and cannot be created from the client`
    };
  } catch (error) {
    console.error('Error in ensureBucketExists:', error);
    return {
      exists: false,
      created: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Uploads an image to Supabase storage
 * @param file File to upload
 * @param bucketName Bucket to upload to
 * @param filePath Optional custom file path
 * @returns URL of the uploaded file or null if upload failed
 */
export const uploadImage = async (
  file: File,
  bucketName: string,
  filePath?: string
): Promise<string | null> => {
  try {
    // Ensure the user is authenticated before upload
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      console.error('Authentication required to upload files');
      return null;
    }
    
    // Generate a file path if not provided
    const path = filePath || `${sessionData.session.user.id}/${Math.random().toString(36).substring(2)}/${file.name}`;
    
    console.log(`Uploading ${file.name} to ${bucketName}/${path}`);
    
    // Explicitly log the file information to help with debugging
    console.log("File details:", {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: new Date(file.lastModified).toISOString()
    });
    
    // Create a FormData object to ensure proper file handling
    const formData = new FormData();
    formData.append('file', file);
    
    // Use the SUPABASE_URL from the environment instead of accessing protected properties
    const { SUPABASE_URL } = await import('@/integrations/supabase/client');
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${bucketName}/${path}`;
    
    // Upload using the low-level fetch API to ensure proper content type handling
    const uploadResponse = await fetch(
      uploadUrl,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionData.session.access_token}`
        },
        body: formData
      }
    );
    
    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      console.error('Error uploading file:', errorData);
      return null;
    }
    
    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(path);
    
    if (!urlData?.publicUrl) {
      console.error('Could not generate public URL');
      return null;
    }
    
    console.log('File uploaded successfully. Public URL:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadImage:', error);
    return null;
  }
};

/**
 * Lists images stored for a specific user
 * @param userId User ID to list images for
 * @param bucketName Name of the bucket (defaults to 'listing-images')
 * @returns Array of image objects or null if operation failed
 */
export const listImages = async (
  userId: string,
  bucketName: string = 'listing-images'
): Promise<any[] | null> => {
  try {
    console.log(`Listing images for user ${userId} in bucket ${bucketName}`);
    
    // Ensure we have a valid session
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      console.error('Authentication required to list images');
      return null;
    }
    
    // Ensure the bucket exists
    const bucketCheck = await checkBucketExists(bucketName);
    if (!bucketCheck.exists) {
      console.error(`Cannot list from non-existent bucket: ${bucketCheck.error}`);
      return null;
    }
    
    // List files in the user's directory
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(userId);
    
    if (error) {
      console.error('Error listing images:', error);
      return null;
    }
    
    console.log(`Found ${data?.length || 0} files for user ${userId}`);
    return data || [];
  } catch (error) {
    console.error('Error in listImages:', error);
    return null;
  }
};

/**
 * Deletes an image from Supabase storage
 * @param url URL of the image to delete
 * @returns Success status
 */
export const deleteImage = async (url: string): Promise<boolean> => {
  try {
    if (!url || typeof url !== 'string' || url.trim() === '') {
      console.warn('Cannot delete image: URL is empty or invalid');
      return false;
    }
    
    console.log('Attempting to delete image:', url);
    
    // Extract bucket and path from URL
    // Handle both public and signed URLs
    let regex;
    
    if (url.includes('/storage/v1/object/public/')) {
      regex = /\/storage\/v1\/object\/public\/([^\/]+)\/(.+?)(\?.*)?$/;
    } else if (url.includes('/storage/v1/object/sign/')) {
      regex = /\/storage\/v1\/object\/sign\/([^\/]+)\/(.+?)(\?.*)?$/;
    } else {
      console.error('Unrecognized storage URL format:', url);
      return false;
    }
    
    const match = url.match(regex);
    
    if (!match || match.length < 3) {
      console.error('Invalid storage URL format, could not extract path:', url);
      return false;
    }
    
    const bucket = match[1];
    // Remove any query parameters from the path
    const path = match[2].split('?')[0];
    
    console.log(`Attempting to delete file from ${bucket}/${path}`);
    
    // Ensure the user is authenticated before deletion
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      console.error('Authentication required to delete files');
      return false;
    }
    
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);
    
    if (error) {
      console.error('Error deleting file:', error);
      return false;
    }
    
    console.log('File deleted successfully from storage');
    return true;
  } catch (error) {
    console.error('Error in deleteImage:', error);
    return false;
  }
};

/**
 * Utility for validating image file properties
 */
export const validateImageFile = (file: File) => {
  // Maximum file size (10MB)
  const MAX_SIZE = 10 * 1024 * 1024;
  
  // Valid image types
  const VALID_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ];
  
  console.log(`Validating image file: ${file.name}, type: ${file.type}, size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
  
  if (!VALID_TYPES.includes(file.type)) {
    return {
      valid: false,
      message: 'Please upload a valid image file (JPEG, PNG, GIF, WEBP, or SVG)'
    };
  }
  
  if (file.size > MAX_SIZE) {
    return {
      valid: false,
      message: 'File size must be less than 10MB'
    };
  }
  
  return { valid: true, message: 'File is valid' };
};

/**
 * Logs image upload attempt for debugging
 */
export const logImageUploadAttempt = (file: File, bucketName: string, userId: string) => {
  console.log(`
    =========================================
    IMAGE UPLOAD ATTEMPT
    =========================================
    User ID: ${userId}
    Filename: ${file.name}
    File type: ${file.type}
    File size: ${(file.size / 1024).toFixed(2)} KB
    Bucket: ${bucketName}
    Timestamp: ${new Date().toISOString()}
    =========================================
  `);
};
