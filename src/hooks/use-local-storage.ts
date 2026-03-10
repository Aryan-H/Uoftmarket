
import { useState, useEffect, useCallback, useRef } from 'react';
import { getWithExpiry, setWithExpiry, hasValidItem, cleanupExpiredItems } from '@/utils/storageUtils';

export function useLocalStorage<T>(
  key: string, 
  initialValue: T, 
  expiryHours?: number
): [T, (value: T) => void, boolean, Error | null] {
  // For non-sensitive data only
  // This hook should only be used for UI preferences and temporary state
  // NOT for user authentication or sensitive information
  
  // State for current value, loading state, and error
  const [storedValue, setStoredValue] = useState<T>(() => {
    return getWithExpiry<T>(key, initialValue);
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Periodically clean up expired items
  useEffect(() => {
    // Clean up on mount
    cleanupExpiredItems();
    
    // Set up interval for cleanup (every hour)
    const interval = setInterval(() => {
      cleanupExpiredItems();
    }, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Function to update stored value
  const setValue = useCallback((value: T) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Update state
      setStoredValue(value);
      
      // Update local storage
      setWithExpiry(key, value, expiryHours);
    } catch (error) {
      console.error(`Error writing to localStorage key "${key}":`, error);
      setError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsLoading(false);
    }
  }, [key, expiryHours]);

  // Listen for changes to the key in other tabs/windows
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue !== null) {
        try {
          // Carefully parse the new value and check expiry
          const item = JSON.parse(event.newValue);
          if (item.expiry && Date.now() > item.expiry) {
            // Don't update if the item is expired
            return;
          }
          setStoredValue(item.value);
        } catch (error) {
          // If there's an error parsing, keep the current value
          console.error(`Error handling storage event for key "${key}":`, error);
        }
      } else if (event.key === key && event.newValue === null) {
        // If the key was removed, reset to initial value
        setStoredValue(initialValue);
      }
    };

    // Add event listener for storage changes
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, initialValue]);

  return [storedValue, setValue, isLoading, error];
}

// Special hook for temporary caching of data while waiting for database operations
// This should only be used for optimistic UI updates and never as primary storage
export function useCachedState<T>(
  key: string, 
  initialValue: T, 
  fetchFn?: () => Promise<T | null>,
  expiryHours: number = 24
): [T, (value: T) => void, boolean, Error | null] {
  const [value, setValue, isLoadingStorage, storageError] = useLocalStorage<T>(key, initialValue, expiryHours);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(storageError);
  
  // If a fetch function is provided, use it to hydrate the state from the backend
  useEffect(() => {
    if (fetchFn) {
      const loadData = async () => {
        try {
          setIsLoading(true);
          const data = await fetchFn();
          if (data !== null) {
            setValue(data);
          }
        } catch (err) {
          console.error(`Error fetching data for key "${key}":`, err);
          setError(err instanceof Error ? err : new Error(String(err)));
        } finally {
          setIsLoading(false);
        }
      };
      
      // Only fetch if we don't have valid cached data
      if (!hasValidItem(key)) {
        loadData();
      }
    }
  }, [fetchFn, setValue, key]);
  
  return [value, setValue, isLoading || isLoadingStorage, error];
}

// New hook specifically for handling auth-dependent data
// Automatically clears when auth state changes
export function useAuthDependentStorage<T>(
  key: string,
  initialValue: T,
  isAuthenticated: boolean,
  expiryHours: number = 24
): [T, (value: T) => void, boolean, Error | null] {
  const [value, setValue, isLoading, error] = useLocalStorage<T>(key, initialValue, expiryHours);
  const prevAuthState = useRef<boolean>(isAuthenticated);
  
  // Clear data when auth state changes to not authenticated
  useEffect(() => {
    // Only clear data if auth state transitions from true to false
    if (prevAuthState.current && !isAuthenticated) {
      setValue(initialValue);
    }
    
    // Update the ref with the current auth state
    prevAuthState.current = isAuthenticated;
  }, [isAuthenticated, initialValue, setValue]);
  
  return [value, setValue, isLoading, error];
}
