import { supabase as configuredSupabase } from '@/integrations/supabase/client';
import { User } from '@/types/auth';
import { v4 as uuidv4 } from 'uuid';
import { uploadImagePreservingFormat, testImageUrl } from '@/utils/imageUtils';
import { deleteImage } from '@/utils/supabaseStorage';

// Use the configured Supabase client from the integration
export const supabase = configuredSupabase;

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  try {
    // Check if we have a Supabase client with valid configuration
    return !!supabase && !!supabase.auth;
  } catch (error) {
    console.error('Supabase configuration error:', error);
    return false;
  }
};

// Helper function to reset all auth sessions
export const resetAllSessions = async (): Promise<boolean> => {
  if (!isSupabaseConfigured()) {
    console.error('Supabase is not configured');
    return false;
  }
  
  try {
    console.log('Attempting to reset all sessions');
    
    // Sign out with global scope to invalidate all sessions
    const { error: signOutError } = await supabase.auth.signOut({ 
      scope: 'global' 
    });
    
    if (signOutError) {
      console.error('Error resetting sessions:', signOutError);
      return false;
    }
    
    // Clear any auth data from localStorage
    if (typeof window !== 'undefined') {
      try {
        console.log('Clearing local storage auth data');
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('supabase.auth.') || 
              key === 'supabase-auth' || 
              key.startsWith('active_session_') ||
              key === 'userProfile' ||
              key === 'savedItems' ||
              key === 'userMessages') {
            console.log('Removing item:', key);
            localStorage.removeItem(key);
          }
        });
      } catch (e) {
        console.warn('Failed to clean localStorage:', e);
      }
    }
    
    console.log('All sessions reset successfully');
    return true;
  } catch (error) {
    console.error('Error in resetAllSessions:', error);
    return false;
  }
};

// Retrieve current session from Supabase
export const getCurrentSession = async () => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error getting session:', error);
      return null;
    }
    return data.session;
  } catch (error) {
    console.error('Error in getCurrentSession:', error);
    return null;
  }
};

// Get current user with complete profile information
export const getCurrentUser = async (): Promise<User | null> => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  
  try {
    const session = await getCurrentSession();
    if (!session) {
      console.log('No active session found');
      return null;
    }
    
    // First try to get user from profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    if (!profileError && profileData) {
      return {
        id: profileData.id,
        name: profileData.name,
        email: profileData.email,
        isAuthenticated: true,
        hasCompletedSetup: !!(profileData.name && (profileData.program || profileData.year)),
        program: profileData.program || '',
        year: profileData.year || '',
        bio: profileData.bio || '',
        phone: profileData.phone || '',
        avatar_url: profileData.avatar_url || null
      };
    }
    
    // Fallback to auth user data
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData.user) {
      console.error('Error fetching user data:', userError);
      return null;
    }
    
    const userMetadata = userData.user.user_metadata || {};
    
    return {
      id: userData.user.id,
      name: userMetadata.name || userData.user.email?.split('@')[0] || 'User',
      email: userData.user.email || '',
      isAuthenticated: true,
      hasCompletedSetup: !!userMetadata.hasCompletedSetup,
      program: userMetadata.program || '',
      year: userMetadata.year || '',
      bio: userMetadata.bio || '',
      phone: userMetadata.phone || '',
      avatar_url: userMetadata.avatar_url || null
    };
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
};

// Add timeout function to help with debugging - with improved error handling
export const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> => {
  let timeoutId: NodeJS.Timeout;
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${errorMessage} (timeout after ${timeoutMs}ms)`));
    }, timeoutMs);
  });

  return Promise.race([
    promise.then(value => {
      clearTimeout(timeoutId);
      return value;
    }).catch(error => {
      // Propagate the original error if it fails
      clearTimeout(timeoutId);
      throw error;
    }),
    timeoutPromise,
  ]);
};

// Helper function to log supabase operations
export const logOperation = (operation: string, startTime: number) => {
  const duration = Date.now() - startTime;
  console.log(`Supabase operation: ${operation} completed in ${duration}ms`);
};

// Refresh the session if it's close to expiration
export const refreshSessionIfNeeded = async () => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  
  try {
    const session = await getCurrentSession();
    if (!session) return null;
    
    // Check if the session expires in less than 60 minutes (3600 seconds)
    const expiresAt = session.expires_at || 0;
    const expiresIn = expiresAt - Math.floor(Date.now() / 1000);
    
    if (expiresIn < 3600) {
      console.log('Session expiring soon, refreshing...');
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Error refreshing session:', error);
        return null;
      }
      return data.session;
    }
    
    return session;
  } catch (error) {
    console.error('Error in refreshSessionIfNeeded:', error);
    return null;
  }
};

// Functions for listings

// Create a new listing
export const createListing = async (listingData: any) => {
  if (!isSupabaseConfigured()) {
    return { error: 'Supabase is not configured' };
  }
  
  try {
    const { data, error } = await supabase
      .from('listings')
      .insert(listingData)
      .select('id')
      .single();
    
    if (error) {
      console.error('Error creating listing:', error);
      return { error };
    }
    
    return { data };
  } catch (error) {
    console.error('Error in createListing:', error);
    return { error };
  }
};

// Get all active listings
export const getListings = async () => {
  if (!isSupabaseConfigured()) {
    return { data: [] };
  }
  
  try {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('deleted', false)
      .order('posted_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching listings:', error);
      return { error };
    }
    
    return { data: data || [] };
  } catch (error) {
    console.error('Error in getListings:', error);
    return { error };
  }
};

// Get a specific listing by ID
export const getListingById = async (listingId: string) => {
  if (!isSupabaseConfigured()) {
    return { error: 'Supabase is not configured' };
  }
  
  try {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('id', listingId)
      .eq('deleted', false)
      .single();
    
    if (error) {
      console.error('Error fetching listing:', error);
      return { error };
    }
    
    return { data };
  } catch (error) {
    console.error('Error in getListingById:', error);
    return { error };
  }
};

/**
 * Uploads a listing image to Supabase storage
 */
export const uploadListingImage = async (userId: string, file: File): Promise<string | null> => {
  return uploadImagePreservingFormat('listingimages', userId, file);
};

/**
 * Uploads a profile image to Supabase storage
 */
export const uploadProfileImage = async (userId: string, file: File): Promise<string | null> => {
  return uploadImagePreservingFormat('profileimages', userId, file);
};

/**
 * Creates a valid image URL with appropriate parameters
 */
export const createValidImageUrl = (url: string | null | undefined): string => {
  if (!url) return '/placeholder.svg';
  
  // Make sure URL always ends with download=true
  let processedUrl = url;
  if (url.includes('supabase.co/storage')) {
    // If it's a Supabase storage URL, ensure it has download=true parameter
    if (url.includes('?')) {
      if (!url.includes('download=')) {
        processedUrl = `${url}&download=true`;
      }
    } else {
      processedUrl = `${url}?download=true`;
    }
  }
  
  // Make sure URL always ends with download=true, not just download=
  if (processedUrl.endsWith('download=')) {
    processedUrl = processedUrl + 'true';
  }
  
  // Add cache-busting timestamp
  const timestamp = new Date().getTime();
  return processedUrl.includes('?') 
    ? `${processedUrl}&t=${timestamp}` 
    : `${processedUrl}?t=${timestamp}`;
};

/**
 * Deletes a listing and its associated images
 */
export const deleteListingAndImage = async (listingId: string, imageUrl?: string | null): Promise<{ success: boolean, error?: any }> => {
  try {
    // Check if user is authenticated - only authenticated users can delete listings
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;
    
    if (!userId) {
      console.error('User must be authenticated to delete listings');
      return { success: false, error: 'Authentication required' };
    }
    
    // First get the listing to check for additional images
    const { data: listing, error: fetchError } = await supabase
      .from('listings')
      .select('image_url, additional_images')
      .eq('id', listingId)
      .eq('seller_id', userId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching listing details for deletion:', fetchError);
      // Continue with deletion attempt even if fetch fails
    }
    
    // Track deletion status for logging
    const deletedImages = [];
    const failedImages = [];
    
    // Delete the main image if it exists
    const mainImageUrl = imageUrl || listing?.image_url;
    if (mainImageUrl) {
      try {
        await deleteImage(mainImageUrl);
        deletedImages.push('main image');
        console.log(`Deleted main image for listing: ${listingId}`);
      } catch (imageError) {
        failedImages.push('main image');
        console.warn(`Error deleting main image, continuing with listing deletion:`, imageError);
      }
    }
    
    // Delete additional images if they exist
    const additionalImages = listing?.additional_images || [];
    if (additionalImages.length > 0) {
      console.log(`Found ${additionalImages.length} additional images to delete`);
      
      for (const imgUrl of additionalImages) {
        if (imgUrl) {
          try {
            await deleteImage(imgUrl);
            deletedImages.push(imgUrl.substring(imgUrl.lastIndexOf('/') + 1, imgUrl.length));
            console.log(`Deleted additional image: ${imgUrl}`);
          } catch (imageError) {
            failedImages.push(imgUrl.substring(imgUrl.lastIndexOf('/') + 1, imgUrl.length));
            console.warn(`Error deleting additional image, continuing:`, imageError);
          }
        }
      }
    }

    const { error: updateUnfulfilledError } = await supabase
      .from("requests")
      .update({
        fulfilled_listing_id: null,
        status: "open",
        fulfilled_by: null
      })
      .eq("fulfilled_listing_id", listingId)
      .eq("status", "pending");

    if (updateUnfulfilledError) {
      console.error("Error updating unfulfilled requests:", updateUnfulfilledError);
      return { success: false, error: updateUnfulfilledError };
    }

    // Update requests where fulfilled_at is not null (i.e. request is fulfilled)
    // Only clear the fulfilled_listing_id.
    const { error: updateFulfilledError } = await supabase
      .from("requests")
      .update({ fulfilled_listing_id: null })
      .eq("fulfilled_listing_id", listingId)
      .eq("status", "fulfilled");

    if (updateFulfilledError) {
      console.error("Error updating fulfilled requests:", updateFulfilledError);
      return { success: false, error: updateFulfilledError };
    }

    
    // Permanently delete the listing (not just mark as deleted)
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', listingId)
      .eq('seller_id', userId); // Ensure the user can only delete their own listings
    
    if (error) {
      console.error('Error permanently deleting listing:', error);
      return { success: false, error };
    }
    
    console.log(`Successfully deleted listing ${listingId} permanently`);
    console.log(`Image deletion summary - Deleted: ${deletedImages.join(', ')} | Failed: ${failedImages.join(', ') || 'None'}`);
    
    return { success: true };
  } catch (error) {
    console.error('Error in deleteListingAndImage:', error);
    return { success: false, error };
  }
};

/**
 * Flag a listing
 */
export const flagListing = async (
  flaggerId: string,
  listingId: string,
  reason: string
): Promise<boolean> => {
  if (!flaggerId || !listingId || !isSupabaseConfigured()) return false;
  
  try {
    const { error } = await supabase
      .from('flagged_listings')
      .insert({
        flagger_id: flaggerId,
        listing_id: listingId,
        reason
      });
    
    if (error) {
      console.error('Error flagging listing:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in flagListing:', error);
    return false;
  }
};

/**
 * Delete a user rating
 */
export const deleteRating = async (
  ratingId: string
): Promise<boolean> => {
  if (!ratingId || !isSupabaseConfigured()) return false;
  
  try {
    // Ensure the user is authenticated
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;
    
    if (!userId) {
      console.error('User must be authenticated to delete ratings');
      return false;
    }
    
    const { error } = await supabase
      .from('ratings')
      .delete()
      .eq('id', ratingId)
      .eq('reviewer_id', userId); // Ensure the user can only delete their own ratings
    
    if (error) {
      console.error('Error deleting rating:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteRating:', error);
    return false;
  }
};

// Helper function to debug image loading issues - consolidated version
export const debugImageUrl = (url: string | null | undefined): void => {
  if (!url || url === 'null' || url === 'undefined' || url === '') {
    console.log('Image URL is empty, null, or undefined');
    return;
  }

  console.log('Original image URL:', url);
  console.log('URL length:', url.length);
  console.log('URL contains supabase storage path:', url.includes('supabase.co/storage'));
  
  // Check if the URL already has download parameter
  console.log('URL already has download parameter:', url.includes('download=true'));
  
  // Log the processed URL that will be used
  const processedUrl = createValidImageUrl(url);
  console.log('Processed image URL:', processedUrl);
};

// Helper function to get image from Supabase storage with proper headers
export const fetchSupabaseImage = async (url: string): Promise<Response> => {
  try {
    // Make sure the URL has the download=true parameter if it's a Supabase URL
    let fetchUrl = url;
    if (url.includes('supabase.co/storage/v1/object/public') && !url.includes('download=true')) {
      fetchUrl = url.includes('?') 
        ? `${url}&download=true` 
        : `${url}?download=true`;
    }
    
    // Add full headers to ensure proper fetch
    return await fetch(fetchUrl, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Accept': 'image/*'
      },
      cache: 'no-store',
      mode: 'cors',
      credentials: 'omit'
    });
  } catch (error) {
    console.error('Error fetching image from Supabase:', error);
    throw error;
  }
};

// Get user rating
export const getUserRating = async (userId: string): Promise<{ average: number, count: number } | null> => {
  if (!userId || !isSupabaseConfigured()) return null;
  
  try {
    const { data, error } = await supabase.rpc('get_seller_rating', { 
      seller_uuid: userId 
    });
    
    if (error) {
      console.error('Error fetching user rating:', error);
      return null;
    }
    
    if (data && data.length > 0) {
      return {
        average: parseFloat(data[0].average_rating?.toString() || '0') || 0,
        count: typeof data[0].review_count === 'string' 
          ? parseInt(data[0].review_count) 
          : Number(data[0].review_count) || 0
      };
    }
    
    return { average: 0, count: 0 };
  } catch (error) {
    console.error('Error in getUserRating:', error);
    return null;
  }
};

/**
 * Delete a user account and all associated data
 */
export const deleteUserAccount = async (): Promise<{ success: boolean, error?: any }> => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase is not configured' };
  }
  
  try {
    // Check if user is authenticated
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) {
      console.error('User must be authenticated to delete account');
      return { success: false, error: 'Authentication required' };
    }
    
    console.log('Initiating account deletion process...');
    
    // Call the Edge Function to delete the account with all related data
    const { data, error } = await supabase.functions.invoke('delete-account', {
      method: 'POST'
    });
    
    if (error) {
      console.error('Error calling delete-account function:', error);
      return { success: false, error };
    }
    
    if (!data.success) {
      console.error('Account deletion failed:', data.error);
      return { success: false, error: { message: data.error } };
    }
    
    // Sign out after successful deletion
    await supabase.auth.signOut();
    
    return { success: true };
  } catch (error) {
    console.error('Error in deleteUserAccount:', error);
    return { success: false, error };
  }
};
