import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CoreAuthProvider } from "@/contexts/CoreAuthContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { SavedItemsProvider } from "@/contexts/SavedItemsContext";
import { ListingsProvider } from "@/contexts/ListingsContext";
import { MessagingProvider } from "@/contexts/MessagingContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ServerValidatedRoute from "@/components/auth/ServerValidatedRoute";
import ScrollToTop from "@/components/ScrollToTop";
import StorageInitializer from "@/components/StorageInitializer";
import { cleanupStaleData } from "@/utils/storageUtils";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { checkCacheVersion, checkStoragePersistence } from "@/utils/cacheUtils";

// Import pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ProductDetail from "./pages/ProductDetail";
import NotFound from "./pages/NotFound";
import Products from "./pages/Products";
import About from "./pages/About";
import Sell from "./pages/Sell";
import Account from "./pages/Account";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import FAQ from "./pages/FAQ";
import Requests from "./pages/Requests";
import RequestDetail from "./pages/RequestDetail";
import Messages from "./pages/Messages";

// Create QueryClient instance outside of component
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      meta: {
        onError: (error: Error) => {
          console.error('Query error:', error);
        }
      }
    },
    mutations: {
      meta: {
        onError: (error: Error) => {
          console.error('Mutation error:', error);
        }
      }
    }
  }
});

// Clean up any stale data in local storage on app startup
cleanupStaleData();

// PWA component to detect online/offline status and handle app updates
const PWAFeatures = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    // Handle online/offline status
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Back Online", {
        description: "Your internet connection has been restored."
      });
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("You're Offline", {
        description: "Some features may be limited until your connection is restored."
      });
    };
    
    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check for service worker updates if available
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      let refreshing = false;
      
      // When a new service worker takes over, refresh the page
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return null; // This component doesn't render anything
};

// Add a component to check for cache issues
const CacheDetector = () => {
  useEffect(() => {
    // Check if we have the correct cache version
    if (!checkCacheVersion()) {
      toast.message("New version available", {
        description: "Refresh the page to get the latest updates.",
        action: {
          label: "Refresh",
          onClick: () => window.location.reload()
        }
      });
    }
    
    // Check if browser storage is working correctly
    if (!checkStoragePersistence()) {
      toast.error("Storage issue detected", {
        description: "Your browser may be blocking storage. Try disabling private browsing or clearing site data."
      });
    }
  }, []);
  
  return null;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CoreAuthProvider>
          <AuthProvider>
            <StorageInitializer>
              <ListingsProvider>
                <SavedItemsProvider>
                  <MessagingProvider>
                    <Sonner />
                  <ScrollToTop />
                  <PWAFeatures />
                  <CacheDetector />
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/faq" element={<FAQ />} />
                    <Route path="/requests" element={
                      <ProtectedRoute>
                        <Requests />
                      </ProtectedRoute>
                    } />
                    <Route path="/request/:id" element={
                      <ProtectedRoute>
                        <RequestDetail />
                      </ProtectedRoute>
                    } />
                    <Route path="/messages" element={
                      <ProtectedRoute>
                        <Messages />
                      </ProtectedRoute>
                    } />
                    
                    {/* Protected routes */}
                    <Route path="/products" element={
                      <ProtectedRoute>
                        <Products />
                      </ProtectedRoute>
                    } />
                    <Route path="/product/:id" element={
                      <ProtectedRoute>
                        <ProductDetail />
                      </ProtectedRoute>
                    } />
                    <Route path="/sell" element={
                      <ProtectedRoute>
                        <Sell />
                      </ProtectedRoute>
                    } />
                    <Route path="/account" element={
                      <ProtectedRoute>
                        <Account />
                      </ProtectedRoute>
                    } />
                    
                    {/* Catch-all route */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  </MessagingProvider>
                </SavedItemsProvider>
              </ListingsProvider>
            </StorageInitializer>
          </AuthProvider>
        </CoreAuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
