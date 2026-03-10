
import { Listing } from '@/types/listings';

export const generateListingId = (): string => {
  return `listing-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

export const isListingActive = (listing: Listing): boolean => {
  return !listing.deleted && !isListingExpired(listing);
};

export const isListingExpired = (listing: Listing): boolean => {
  // Check if the listing is more than 30 days old
  const postedDate = new Date(listing.postedTime || listing.posted_at || Date.now());
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  return postedDate < thirtyDaysAgo;
};

export const filterActiveListings = (listings: Listing[]): Listing[] => {
  return listings.filter(isListingActive);
};

export const sortListingsByViews = (listings: Listing[], count: number = 4): Listing[] => {
  return [...listings]
    .filter(isListingActive)
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, count);
};

export const sortMostPopularItems = (listings: Listing[], count: number = 4): Listing[] => {
  return [...listings]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, count);
};

// Enhanced location filtering with comprehensive normalization
export const filterListingsByLocation = (listings: Listing[], location: string): Listing[] => {
  if (!location || location.trim() === '') {
    const activeListings = filterActiveListings(listings);
    console.log("No location filter, returning all active listings:", activeListings.length);
    return activeListings;
  }
  
  // More aggressive normalization of the search location
  // - lowercase
  // - remove periods, hyphens
  // - trim spaces
  // - normalize common variations
  let normalizedLocation = location.toLowerCase()
    .replace(/\./g, '') // remove periods
    .replace(/-/g, '') // remove hyphens
    .replace(/\s+/g, '') // remove all spaces
    .trim();
  
  // Special case for St. George/St George/St-George
  if (normalizedLocation === 'stgeorge') {
    console.log("Special case detected: St. George location");
  }
  
  console.log("Filtering by normalized location:", normalizedLocation);
  
  const filteredListings = listings.filter(listing => {
    // Skip inactive listings
    if (!isListingActive(listing) || !listing.location) {
      return false;
    }
    
    // Apply the same aggressive normalization to listing location
    const normalizedListingLocation = listing.location.toLowerCase()
      .replace(/\./g, '')
      .replace(/-/g, '')
      .replace(/\s+/g, '')
      .trim();
    
    // Check for partial matches in both directions
    const isMatch = normalizedListingLocation.includes(normalizedLocation) || 
                    normalizedLocation.includes(normalizedListingLocation);
    
    console.log(`Location matching: "${listing.location}" vs "${location}" => ${isMatch ? 'MATCH' : 'no match'}`);
    return isMatch;
  });
  
  console.log("Filtered listings by location:", filteredListings.length);
  return filteredListings;
};

export const filterListingsBySeller = (listings: Listing[], sellerName: string): Listing[] => {
  console.log("Getting listings for seller:", sellerName);
  return listings.filter(listing => 
    listing.seller === sellerName && isListingActive(listing)
  );
};

export const filterListingsByUserId = (listings: Listing[], userId: string): Listing[] => {
  console.log("Getting user listings for user ID:", userId);
  const userListings = listings.filter(listing => 
    listing.sellerId === userId
  );
  console.log("User listings found:", userListings.length);
  return userListings;
};

export const getUserActiveListings = (listings: Listing[], userId: string): Listing[] => {
  console.log("Getting active user listings for user ID:", userId);
  const activeUserListings = listings.filter(listing => 
    isListingActive(listing) && 
    listing.sellerId === userId
  );
  console.log("Active user listings found:", activeUserListings.length);
  return activeUserListings;
};

export const getUserExpiredListings = (listings: Listing[], userId: string): Listing[] => {
  console.log("Getting expired user listings for user ID:", userId);
  const expiredUserListings = listings.filter(listing => 
    !listing.deleted && 
    isListingExpired(listing) && 
    listing.sellerId === userId
  );
  console.log("Expired user listings found:", expiredUserListings.length);
  return expiredUserListings;
};

export const relistListing = (listing: Listing): Partial<Listing> => {
  // Create a new post date in both formats used in the system
  const now = new Date();
  const newPostedTime = now.toISOString();
  
  console.log(`Relisting item. Old posted date: ${listing.postedTime}, New posted date: ${newPostedTime}`);
  
  return {
    postedTime: newPostedTime,
    posted_at: newPostedTime // Ensure both fields are updated for compatibility
  };
};

export const MAX_TITLE_LENGTH = 60;

export const validateListingTitle = (title: string): string => {
  if (!title) return '';
  return title.length > MAX_TITLE_LENGTH ? title.substring(0, MAX_TITLE_LENGTH) + '...' : title;
};

export const truncateTitle = (title: string, wordLimit: number = 6): string => {
  const words = title.split(' ');
  if (words.length <= wordLimit) return title;
  return words.slice(0, wordLimit).join(' ') + '...';
};

export const validateImageFile = (file: File): { valid: boolean; message?: string } => {
  if (file.size > 10 * 1024 * 1024) {
    return { valid: false, message: 'File too large (max 10MB)' };
  }
  
  if (!file.type.startsWith('image/')) {
    return { valid: false, message: `Invalid file type: ${file.type}. Only images are allowed.` };
  }
  
  console.log('Validating image file:', {
    name: file.name,
    type: file.type,
    size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
    lastModified: new Date(file.lastModified).toISOString()
  });
  
  return { valid: true };
};

export const logImageUploadAttempt = (
  file: File, 
  bucketName: string, 
  userId: string
): void => {
  console.log(`
    ----------- IMAGE UPLOAD ATTEMPT -----------
    Time: ${new Date().toISOString()}
    User ID: ${userId}
    Bucket: ${bucketName}
    File name: ${file.name}
    File type: ${file.type}
    File size: ${(file.size / 1024 / 1024).toFixed(2)}MB
    --------------------------------------
  `);
};
