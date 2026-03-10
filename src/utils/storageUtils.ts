/**
 * Utility functions for handling local storage operations
 */

// Constants for storage keys
export const STORAGE_KEYS = {
  USER_PROFILE: 'userProfile',
  USER_LISTINGS: 'userListings',
  FLAGGED_LISTINGS: 'flaggedListings',
  USER_MESSAGES: 'userMessages',
  SUPABASE_AUTH: 'supabase-auth',
  AUTH_REDIRECT_TOAST: 'authRedirectToast',
  LAST_CLEANUP: 'lastStorageCleanup',
  LISTINGS_CACHE: 'listingsCache',
  SAVED_ITEMS_CACHE: 'savedItemsCache',
  UI_PREFERENCES: 'uiPreferences'
};

/**
 * Clears all application-related data from local storage
 * Call this during logout or when cleaning up user data
 */
export const clearAllLocalStorage = () => {
  // Auth
  localStorage.removeItem('userProfile');
  localStorage.removeItem('userMessages');
  localStorage.removeItem('supabase-auth');
  localStorage.removeItem('authRedirectToast');
  
  // State management
  localStorage.removeItem('savedItems');
  localStorage.removeItem('lastViewedListings');
  localStorage.removeItem('userListings');
  
  // Filter preferences
  localStorage.removeItem('filterSettings');
  localStorage.removeItem('searchQuery');
  
  console.log('All auth-related localStorage items cleared');
};

/**
 * Clears only user-generated content from local storage
 * Keeps authentication data intact
 */
export const clearUserContentStorage = () => {
  localStorage.removeItem(STORAGE_KEYS.USER_LISTINGS);
  localStorage.removeItem(STORAGE_KEYS.FLAGGED_LISTINGS);
  localStorage.removeItem(STORAGE_KEYS.LISTINGS_CACHE);
  localStorage.removeItem(STORAGE_KEYS.SAVED_ITEMS_CACHE);
  console.log('User content cleared from local storage');
};

/**
 * Checks if there are any stale listings in local storage
 * Returns true if listings exist but no user is logged in
 */
export const hasStaleListings = (): boolean => {
  const listingsData = localStorage.getItem(STORAGE_KEYS.USER_LISTINGS);
  const sessionData = localStorage.getItem(STORAGE_KEYS.SUPABASE_AUTH);
  
  return !!listingsData && !sessionData;
};

/**
 * Checks if data in local storage needs to be cleaned up
 * based on last access time
 */
export const hasStaleData = (maxAgeDays = 7): boolean => {
  const lastCleanup = localStorage.getItem(STORAGE_KEYS.LAST_CLEANUP);
  if (!lastCleanup) return true;
  
  const lastCleanupTime = parseInt(lastCleanup, 10);
  const now = Date.now();
  const daysSinceCleanup = (now - lastCleanupTime) / (1000 * 60 * 60 * 24);
  
  return daysSinceCleanup > maxAgeDays;
};

/**
 * Cleans up any stale listings data if needed
 */
export const cleanupStaleData = (maxAgeInDays = 7) => {
  try {
    if (hasStaleListings()) {
      console.log('Detected stale listings data, cleaning up');
      clearUserContentStorage();
    }
    
    if (hasStaleData(maxAgeInDays)) {
      console.log('Performing periodic storage cleanup');
      clearUserContentStorage();
      localStorage.setItem(STORAGE_KEYS.LAST_CLEANUP, Date.now().toString());
    }
    
    // Clean up any expired items
    cleanupExpiredItems();
  } catch (error) {
    console.error('Error cleaning up stale data:', error);
  }
};

/**
 * Removes all expired items from localStorage
 */
export const cleanupExpiredItems = (): void => {
  const now = Date.now();
  let count = 0;
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    
    try {
      const itemStr = localStorage.getItem(key);
      if (!itemStr) continue;
      
      const item = JSON.parse(itemStr);
      if (item.expiry && now > item.expiry) {
        localStorage.removeItem(key);
        count++;
      }
    } catch (e) {
      // Skip items that aren't JSON or don't have expiry
      continue;
    }
  }
  
  if (count > 0) {
    console.log(`Cleaned up ${count} expired items from localStorage`);
  }
};

/**
 * Gets an item from localStorage with optional expiry
 */
export const getWithExpiry = <T>(key: string, defaultValue: T): T => {
  try {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) return defaultValue;
    
    const item = JSON.parse(itemStr);
    
    // Check if the item has an expiry time
    if (item.expiry && Date.now() > item.expiry) {
      localStorage.removeItem(key);
      return defaultValue;
    }
    
    return item.value || defaultValue;
  } catch (error) {
    console.error(`Error retrieving item ${key} from localStorage:`, error);
    return defaultValue;
  }
};

/**
 * Sets an item in localStorage with optional expiry
 */
export const setWithExpiry = <T>(key: string, value: T, expiryHours?: number): void => {
  try {
    const item = {
      value: value,
      expiry: expiryHours ? Date.now() + (expiryHours * 60 * 60 * 1000) : null,
      timestamp: Date.now() // Add timestamp for tracking
    };
    
    localStorage.setItem(key, JSON.stringify(item));
  } catch (error) {
    console.error(`Error storing item ${key} in localStorage:`, error);
  }
};

/**
 * Checks if a key exists in localStorage and is not expired
 */
export const hasValidItem = (key: string): boolean => {
  try {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) return false;
    
    const item = JSON.parse(itemStr);
    
    // Check if the item has an expiry time
    if (item.expiry && Date.now() > item.expiry) {
      localStorage.removeItem(key);
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Gets all keys in localStorage that match a prefix and are not expired
 */
export const getKeysWithPrefix = (prefix: string): string[] => {
  const keys: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      if (hasValidItem(key)) {
        keys.push(key);
      }
    }
  }
  
  return keys;
};
