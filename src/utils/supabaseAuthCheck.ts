
import { supabase } from '@/integrations/supabase/client';

/**
 * Checks if the user is authenticated and has permission to use storage
 * @returns An object with authentication status and any error message
 */
export const checkAuthAndStorage = async (): Promise<{
  isAuthenticated: boolean;
  userId: string | null;
  canUseStorage: boolean;
  error: string | null;
  storageBuckets?: string[];
}> => {
  try {
    // Check authentication
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id || null;
    const isAuthenticated = !!userId;
    
    if (!isAuthenticated) {
      return {
        isAuthenticated: false,
        userId: null,
        canUseStorage: false,
        error: 'User is not authenticated'
      };
    }
    
    // Get all buckets first to see what's available
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      return {
        isAuthenticated: true,
        userId,
        canUseStorage: false,
        error: `Cannot list buckets: ${bucketsError.message}`,
        storageBuckets: []
      };
    }
    
    const bucketNames = buckets?.map(b => b.name) || [];
    console.log('Available buckets:', bucketNames.join(', '));
    
    // Test storage access by attempting to list files in listing-images bucket
    const bucketName = 'listing-images';
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(`${userId}`);
    
    if (error) {
      console.error('Storage access check failed:', error);
      
      if (error.message.includes('does not exist')) {
        return {
          isAuthenticated: true,
          userId,
          canUseStorage: false,
          error: `Bucket '${bucketName}' not found in the list of available buckets: ${bucketNames.join(', ')}`,
          storageBuckets: bucketNames
        };
      }
      
      if (error.message.includes('Permission denied') || error.message.includes('not authorized')) {
        return {
          isAuthenticated: true,
          userId,
          canUseStorage: false,
          error: 'Permission denied: RLS policy may be blocking access',
          storageBuckets: bucketNames
        };
      }
      
      return {
        isAuthenticated: true,
        userId,
        canUseStorage: false,
        error: `Storage error: ${error.message}`,
        storageBuckets: bucketNames
      };
    }
    
    return {
      isAuthenticated: true,
      userId,
      canUseStorage: true,
      error: null,
      storageBuckets: bucketNames
    };
  } catch (error) {
    console.error('Error checking auth and storage:', error);
    return {
      isAuthenticated: false,
      userId: null,
      canUseStorage: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Checks if the storage bucket exists and is accessible
 * @param bucketName The name of the bucket to check
 * @returns Detailed information about the bucket
 */
export const checkBucketExists = async (bucketName: string = 'listing-images'): Promise<{
  exists: boolean;
  isPublic?: boolean;
  details?: any;
  error?: string;
}> => {
  try {
    console.log(`Detailed check for bucket '${bucketName}'`);
    
    // First verify we have a valid session
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session) {
      return {
        exists: false,
        error: 'No active session found'
      };
    }
    
    // List all buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      return {
        exists: false,
        error: `Could not list buckets: ${bucketsError.message}`
      };
    }
    
    if (!buckets || buckets.length === 0) {
      return {
        exists: false,
        error: 'No buckets found in storage'
      };
    }
    
    console.log('Available buckets:', buckets.map(b => b.name).join(', '));
    
    // Check if our bucket exists (case sensitive and case insensitive)
    const exactBucket = buckets.find(b => b.name === bucketName);
    const caseInsensitiveBucket = buckets.find(b => b.name.toLowerCase() === bucketName.toLowerCase());
    
    if (exactBucket) {
      console.log(`Found exact match for bucket '${bucketName}'`);
      return {
        exists: true,
        isPublic: exactBucket.public,
        details: exactBucket
      };
    } else if (caseInsensitiveBucket) {
      console.log(`Found case-insensitive match for bucket '${bucketName}' as '${caseInsensitiveBucket.name}'`);
      return {
        exists: true,
        isPublic: caseInsensitiveBucket.public,
        details: caseInsensitiveBucket,
        error: `Bucket name case mismatch: requested '${bucketName}' but found '${caseInsensitiveBucket.name}'`
      };
    }
    
    return {
      exists: false,
      error: `Bucket '${bucketName}' not found. Available buckets: ${buckets.map(b => b.name).join(', ')}`
    };
  } catch (error) {
    console.error('Error checking bucket:', error);
    return {
      exists: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
