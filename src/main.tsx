
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

// Set up cache busting with a more stable approach
const cacheBuster = {
  version: Date.now().toString(),
  
  // Add cache-busting parameter to resources
  addCacheBustParam(url) {
    if (!url || typeof url !== 'string') return url;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${this.version}`;
  },
  
  // Apply cache busting to dynamic resources
  applyToResource(resource) {
    if (!resource || !resource.href || resource.hasAttribute('data-no-cache-bust')) return;
    resource.href = this.addCacheBustParam(resource.href);
  },
  
  // Initialize cache busting
  init() {
    // Only set cache version if it doesn't exist already in this session
    if (!sessionStorage.getItem('app_cache_version')) {
      sessionStorage.setItem('app_cache_version', this.version);
      
      // Clear localStorage cache flags that might affect app behavior
      localStorage.removeItem('lastCacheCheck');
      console.log('Cache buster initialized:', this.version);
    } else {
      // Use the existing version from session storage to prevent constant reloads
      this.version = sessionStorage.getItem('app_cache_version') || this.version;
    }
    
    // Clear any service worker caches if supported
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => registration.unregister());
      });
    }
    
    return this;
  }
}.init();

// Social media crawler detection
// This helps identify when the page is being accessed by a crawler
if (typeof window !== 'undefined') {
  // Add a property that can be checked in components to modify behavior for crawlers
  window.isSocialMediaCrawler = /facebookexternalhit|twitterbot|linkedinbot|pinterest|googlebot/i.test(navigator.userAgent);
  
  // Preload favicon for faster loading
  if (window.isSocialMediaCrawler) {
    const preloadLink = document.createElement('link');
    preloadLink.rel = 'preload';
    preloadLink.as = 'image';
    preloadLink.href = '/social-preview.png';
    document.head.appendChild(preloadLink);
    
    // Log crawler detection in development only
    if (process.env.NODE_ENV === 'development') {
      console.log('Social media crawler detected:', navigator.userAgent);
    }
  }
}

// Safari detection - to help with browser-specific adjustments
if (typeof window !== 'undefined') {
  // Check if browser is Safari
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  window.isSafari = isSafari;
  
  if (isSafari && process.env.NODE_ENV === 'development') {
    console.log('Safari browser detected - applying compatibility adjustments');
  }
}

// Track if cleanup has already been performed to avoid duplicate logs
let cleanupPerformed = false;

// Clean up stale auth data on app start, but don't disrupt active sessions
if (typeof window !== 'undefined' && !cleanupPerformed) {
  cleanupPerformed = true;
  try {
    // Only log in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('Checking for orphaned auth data on startup');
    }
    
    // Check if we have a valid session before cleaning up
    const hasValidSession = localStorage.getItem('supabase-auth');
    
    // Only clean up if there's no valid session
    if (!hasValidSession) {
      // Find and clear any orphaned or corrupted auth data
      const sessionKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('supabase.auth.') || 
        key === 'supabase-auth' ||
        key.startsWith('active_session_')
      );
      
      if (sessionKeys.length > 0 && process.env.NODE_ENV === 'development') {
        console.log('Cleaning up orphaned auth data:', sessionKeys);
        sessionKeys.forEach(key => localStorage.removeItem(key));
      }
    }
    
    // Always clear persistent state flags on startup
    localStorage.removeItem('authRedirectToast');
  } catch (e) {
    console.warn('Failed to clean localStorage on startup:', e);
  }
}

// Set up improved console log handling for production vs development
if (process.env.NODE_ENV === 'production') {
  // Disable verbose console logs in production
  const originalConsoleLog = console.log;
  console.log = function(...args) {
    // Only log errors and warnings in production
    if (args[0] && typeof args[0] === 'string' && 
        (args[0].includes('error') || args[0].includes('warning'))) {
      originalConsoleLog.apply(console, args);
    }
  };
}

// Add metadata to help diagnose version issues
if (typeof window !== 'undefined') {
  window.APP_VERSION = cacheBuster.version;
  console.log(`App initialized with version: ${cacheBuster.version}`);
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
