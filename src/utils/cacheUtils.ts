
/**
 * Utility functions for managing caching and cache invalidation
 */

// Cache constants
export const CACHE_KEYS = {
  APP_VERSION: 'app_cache_version',
  LAST_AUTH_CHECK: 'last_auth_check',
  STORAGE_VERSION: 'storage_version'
};

/**
 * Forces a reload of the page, clearing browser cache
 */
export const forceRefresh = (): void => {
  console.log('Forcing page refresh and cache clear');
  window.location.reload();
};

/**
 * Clears all application cache data
 */
export const clearAppCache = (): void => {
  // Clear localStorage app cache data
  Object.values(CACHE_KEYS).forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
  
  // Clear cache flags
  localStorage.removeItem('lastCacheCheck');
  
  // Safari-specific cleanup for better compatibility
  if (window.isSafari) {
    try {
      // Clear all auth-related items to prevent stale data in Safari
      Object.keys(localStorage)
        .filter(key => key.includes('auth') || key.includes('supabase') || key.includes('session'))
        .forEach(key => {
          localStorage.removeItem(key);
          console.log('Safari compatibility: Removed item:', key);
        });
      
      // Clear cookies related to authentication
      document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.trim().split('=');
        if (name && (name.includes('supabase') || name.includes('auth') || name.includes('session'))) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        }
      });
    } catch (e) {
      console.error('Error during Safari-specific cleanup:', e);
    }
  }
  
  console.log('App cache cleared');
};

/**
 * Checks if the app cache version has changed, which might indicate 
 * the user is seeing a stale version of the app
 */
export const checkCacheVersion = (): boolean => {
  const currentVersion = window.APP_VERSION;
  const storedVersion = sessionStorage.getItem(CACHE_KEYS.APP_VERSION);
  
  if (!storedVersion) {
    sessionStorage.setItem(CACHE_KEYS.APP_VERSION, currentVersion);
    return true;
  }
  
  return storedVersion === currentVersion;
};

/**
 * Adds a cache-busting parameter to a URL
 */
export const addCacheBustParam = (url: string): string => {
  if (!url) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${Date.now()}`;
};

/**
 * Adds cache-control header to prevent caching
 */
export const noCacheHeaders = {
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0'
};

/**
 * Checks if browser storage is being properly updated or if caching issues
 * might be preventing new data from being stored
 */
export const checkStoragePersistence = (): boolean => {
  const testKey = 'storage_test';
  const testValue = Date.now().toString();
  
  try {
    localStorage.setItem(testKey, testValue);
    const retrievedValue = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    
    return retrievedValue === testValue;
  } catch (e) {
    console.error('Storage test failed:', e);
    return false;
  }
};

/**
 * Get a storage method that will work even in Safari's strict privacy mode
 * Falls back to sessionStorage if localStorage isn't available
 */
export const getStorageMethod = () => {
  try {
    // Test if localStorage is available
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    return localStorage;
  } catch (e) {
    console.warn('localStorage not available, falling back to sessionStorage');
    try {
      // Test if sessionStorage is available
      sessionStorage.setItem('test', 'test');
      sessionStorage.removeItem('test');
      return sessionStorage;
    } catch (e) {
      console.error('No storage method available');
      // Return a mock storage object that doesn't actually store anything
      return {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
        clear: () => {}
      };
    }
  }
};

/**
 * Safari-specific function to ensure cookies are properly set
 * Safari has stricter rules for cookies, especially in ITP mode
 */
export const ensureSafariCompatibility = () => {
  if (window.isSafari) {
    // For development logging
    console.log('Applying Safari-specific compatibility fixes');
    
    // Prevent Safari from blocking cookies for authentication
    document.cookie = "safari_compat_check=1; SameSite=None; Secure; Path=/";
    
    // Force localStorage sync
    try {
      const keys = Object.keys(localStorage);
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const value = localStorage.getItem(key);
        if (value) {
          localStorage.setItem(key, value);
        }
      }
    } catch (e) {
      console.warn('Error syncing localStorage in Safari:', e);
    }
  }
};
