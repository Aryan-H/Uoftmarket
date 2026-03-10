
/**
 * Utility for controlled console logging
 * Prevents excessive console spam while still allowing
 * important logs to go through
 */

// Set this to true to enable verbose debug logs
let VERBOSE = false;

// Try to get debug preference from localStorage to persist between refreshes
try {
  if (typeof window !== 'undefined' && localStorage) {
    VERBOSE = localStorage.getItem('debug_verbose') === 'true';
  }
} catch (e) {
  // Ignore localStorage errors
}

// Set up namespaces to control which logs are shown
const enabledNamespaces: Record<string, boolean> = {};

/**
 * Create a namespaced logger that can be enabled/disabled
 * @param namespace - The namespace for this logger
 * @returns A logging function
 */
export const createLogger = (namespace: string) => {
  // Initialize namespace to off by default
  enabledNamespaces[namespace] = false;
  
  // Try to get namespace preference from localStorage
  try {
    if (typeof window !== 'undefined' && localStorage) {
      enabledNamespaces[namespace] = localStorage.getItem(`debug_${namespace}`) === 'true';
    }
  } catch (e) {
    // Ignore localStorage errors
  }
  
  // Return a logging function
  return (...args: any[]) => {
    if (VERBOSE || enabledNamespaces[namespace]) {
      console.log(`[${namespace}]`, ...args);
    }
  };
};

/**
 * Enable verbose logging
 */
export const enableVerboseLogging = () => {
  VERBOSE = true;
  try {
    if (typeof window !== 'undefined' && localStorage) {
      localStorage.setItem('debug_verbose', 'true');
    }
  } catch (e) {
    // Ignore localStorage errors
  }
};

/**
 * Disable verbose logging
 */
export const disableVerboseLogging = () => {
  VERBOSE = false;
  try {
    if (typeof window !== 'undefined' && localStorage) {
      localStorage.setItem('debug_verbose', 'false');
    }
  } catch (e) {
    // Ignore localStorage errors
  }
};

/**
 * Toggle a specific namespace on/off
 * @param namespace - The namespace to toggle
 * @param enabled - Whether to enable or disable
 */
export const toggleNamespace = (namespace: string, enabled: boolean) => {
  enabledNamespaces[namespace] = enabled;
  try {
    if (typeof window !== 'undefined' && localStorage) {
      localStorage.setItem(`debug_${namespace}`, enabled ? 'true' : 'false');
    }
  } catch (e) {
    // Ignore localStorage errors
  }
};

// Pre-configure some common loggers
export const logAuth = createLogger('auth');
export const logListings = createLogger('listings');
export const logImages = createLogger('images');
export const logStorage = createLogger('storage');
export const logProfile = createLogger('profile');

// Error logger - always logs regardless of settings
export const logError = (message: string, error?: any) => {
  console.error(`[ERROR] ${message}`, error ? error : '');
};
