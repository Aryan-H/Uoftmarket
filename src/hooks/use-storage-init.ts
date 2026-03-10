
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { checkBucketExists } from '@/utils/supabaseStorage';
import { useCoreAuth } from '@/contexts/CoreAuthContext';
import { toast } from 'sonner';

// Use localStorage to track initialization status across component re-renders
const STORAGE_INIT_KEY = 'storage_initialized';

export const useStorageInit = () => {
  const [isInitializing, setIsInitializing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(() => {
    // Check if we've already initialized in this session
    return localStorage.getItem(STORAGE_INIT_KEY) === 'true';
  });
  const [error, setError] = useState<string | null>(null);
  const { user } = useCoreAuth();

  // When component mounts, check if we're already initialized
  useEffect(() => {
    if (localStorage.getItem(STORAGE_INIT_KEY) === 'true') {
      setIsInitialized(true);
    }
  }, []);

  const initializeStorage = useCallback(async () => {
    // Don't proceed if already initializing or initialized
    if (isInitializing || isInitialized) return;
    
    setIsInitializing(true);
    setError(null);
    
    try {
      // Verify we have a valid session first
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        throw new Error('Authentication required: No valid session found');
      }

      console.log('Starting storage initialization checks with token:', 
        sessionData.session?.access_token ? 'Token exists' : 'No token');
      
      // Add a small delay to ensure auth is fully processed
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check buckets with detailed logging
      console.log('Checking if bucket \'listing-images\' exists...');
      const listingBucket = await checkBucketExists('listing-images');
      console.log('Listing bucket check result:', listingBucket);
      
      console.log('Checking if bucket \'profile-images\' exists...');
      const profileBucket = await checkBucketExists('profile-images');
      console.log('Profile bucket check result:', profileBucket);
      
      // Report results
      const results = {
        'listing-images': listingBucket.exists ? 'exists' : 'missing',
        'profile-images': profileBucket.exists ? 'exists' : 'missing'
      };
      
      console.log('Storage bucket verification results:', results);
      
      // Check for missing buckets
      const missingBuckets = [];
      
      if (!listingBucket.exists) {
        missingBuckets.push({
          bucket: 'listing-images',
          error: listingBucket.error
        });
      }
      
      if (!profileBucket.exists) {
        missingBuckets.push({
          bucket: 'profile-images',
          error: profileBucket.error
        });
      }
      
      // If buckets are missing, we set an error but still mark as initialized
      // This allows the app to continue working, but with degraded functionality
      if (missingBuckets.length > 0) {
        const errorMessage = missingBuckets
          .map(b => `Bucket ${b.bucket} is missing: ${b.error || 'No storage buckets found'}`)
          .join('; ');
        
        // Set error message, but don't throw - allow app to continue functioning
        setError(errorMessage);
        
        // Still mark as initialized to prevent infinite retries
        setIsInitialized(true);
        localStorage.setItem(STORAGE_INIT_KEY, 'true');
        
        toast.warning('Storage configuration issue', {
          description: 'Some required storage buckets are inaccessible. File uploads may not work correctly.'
        });
      } else {
        // All buckets exist and are accessible
        setIsInitialized(true);
        localStorage.setItem(STORAGE_INIT_KEY, 'true');
        toast.success('Storage initialized successfully', {
          id: 'storage-init-success', // Prevent duplicate toasts
        });
      }
    } catch (err) {
      console.error('Storage initialization error:', err);
      setError(err instanceof Error ? err.message : 'Unknown storage initialization error');
    } finally {
      setIsInitializing(false);
    }
  }, [isInitializing, isInitialized]);
  
  return {
    isInitializing,
    isInitialized,
    error,
    initializeStorage
  };
};
