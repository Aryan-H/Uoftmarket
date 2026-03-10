
import { supabase } from '@/integrations/supabase/client';

/**
 * Tests Supabase storage connection and permissions
 * @returns Object with test results
 */
export const testSupabaseStorage = async () => {
  try {
    // Check if user is authenticated
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;
    
    if (!userId) {
      return {
        success: false,
        details: {
          error: "Authentication required for storage access"
        }
      };
    }
    
    // 1. Check if the bucket exists
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) {
      console.error('Error listing buckets:', bucketError);
      return {
        success: false,
        details: {
          error: bucketError.message,
          bucketExists: false
        }
      };
    }
    
    const bucketName = 'listing-images';
    const bucketExists = buckets?.some(b => 
      b.name.toLowerCase() === bucketName.toLowerCase()
    );
    
    if (!bucketExists) {
      return {
        success: false,
        details: {
          error: `Bucket '${bucketName}' does not exist`,
          bucketExists: false,
          availableBuckets: buckets?.map(b => b.name) || []
        }
      };
    }
    
    // 2. Get bucket details to check if it's public
    const bucketInfo = buckets.find(b => b.name.toLowerCase() === bucketName.toLowerCase());
    const bucketIsPublic = bucketInfo?.public || false;
    
    // 3. Check permissions - try to list files (requires SELECT policy)
    const { data: files, error: listError } = await supabase.storage
      .from(bucketName)
      .list(userId);
    
    const canList = !listError;
    
    // 4. Check upload permissions (requires INSERT policy)
    // Create a small test file to upload
    const testBlob = new Blob(['test'], { type: 'text/plain' });
    const testFile = new File([testBlob], 'test-upload.txt', { type: 'text/plain' });
    
    const testPath = `${userId}/test-${Date.now()}.txt`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(testPath, testFile, { upsert: true });
    
    const canUpload = !uploadError;
    
    // 5. If upload succeeded, clean up the test file
    if (canUpload && uploadData?.path) {
      await supabase.storage
        .from(bucketName)
        .remove([uploadData.path]);
    }
    
    return {
      success: bucketExists && bucketIsPublic && canList && canUpload,
      details: {
        bucketExists,
        bucketIsPublic,
        canList,
        canUpload,
        path: canUpload ? uploadData?.path : null,
        listError: listError?.message || null,
        uploadError: uploadError?.message || null
      }
    };
  } catch (error) {
    console.error('Unexpected error testing storage:', error);
    return {
      success: false,
      details: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
};

/**
 * Diagnoses issues with bucket configuration
 * @returns Object with suggestions and diagnostics
 */
export const diagnoseBucketIssues = async () => {
  try {
    const { data: session } = await supabase.auth.getSession();
    const isAuthenticated = !!session?.session?.user?.id;
    
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    // Check for potential issues
    const suggestions = [];
    
    if (!isAuthenticated) {
      suggestions.push('You need to be logged in to upload files.');
    }
    
    if (bucketError) {
      suggestions.push(`Bucket access error: ${bucketError.message}`);
    }
    
    const availableBuckets = buckets?.map(b => b.name).join(', ') || 'none';
    
    if (!buckets || buckets.length === 0) {
      suggestions.push('No storage buckets found. The SQL migration may have failed.');
    } else {
      const targetBucket = buckets.find(b => b.name.toLowerCase() === 'listing-images');
      
      if (!targetBucket) {
        suggestions.push(`The 'listing-images' bucket does not exist. Available buckets: ${availableBuckets}`);
      } else if (!targetBucket.public) {
        suggestions.push(`The 'listing-images' bucket exists but is not public.`);
      }
    }
    
    // If no issues found but user still has problems
    if (suggestions.length === 0) {
      suggestions.push('Storage appears to be configured correctly. If problems persist, check your file structure when uploading (use userId as first path segment).');
    }
    
    return {
      suggestions,
      isAuthenticated,
      availableBuckets,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      suggestions: [`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      isAuthenticated: false,
      availableBuckets: 'error',
      timestamp: new Date().toISOString()
    };
  }
};
