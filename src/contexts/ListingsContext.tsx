import React, { createContext, useContext, ReactNode, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { Listing, FlaggedListing } from '@/types/listings';
import { useAuthDependentStorage } from '@/hooks/use-local-storage';
import { 
  generateListingId, 
  filterActiveListings, 
  sortListingsByViews,
  filterListingsByLocation,
  filterListingsBySeller,
  filterListingsByUserId
} from '@/utils/listingUtils';
import { cleanupStaleData } from '@/utils/storageUtils';
import { supabase } from '@/integrations/supabase/client';
import { deleteListingAndImage } from '@/lib/supabase';

interface ListingsContextType {
  listings: Listing[];
  addListing: (listing: Omit<Listing, 'id' | 'postedTime' | 'sellerId'>) => Promise<string>;
  editListing: (id: string, listing: Partial<Listing>) => Promise<boolean>;
  removeListing: (id: string) => Promise<boolean>;
  getUserListings: () => Listing[];
  getListing: (id: string) => Listing | undefined;
  incrementViews: (id: string) => void;
  getFeaturedListings: (count?: number) => Listing[];
  flagListing: (id: string, reason: string) => Promise<boolean>;
  getSellerListings: (sellerName: string) => Listing[];
  clearAllListings: () => void;
  filterListingsByLocation: (location: string) => Listing[];
  refreshListings: () => Promise<void>;
  getPublicListings: (count?: number) => Listing[];
}

const ListingsContext = createContext<ListingsContextType | undefined>(undefined);

export const ListingsProvider = ({ children }: { children: ReactNode }) => {
  const auth = useAuth();
  const user = auth?.user || null;
  const isAuthenticated = !!user;
  
  const [listings, setListings] = useAuthDependentStorage<Listing[]>('userListings', [], isAuthenticated, 24);
  const [publicListings, setPublicListings] = useState<Listing[]>([]);
  const [flaggedListings, setFlaggedListings] = useAuthDependentStorage<FlaggedListing[]>('flaggedListings', [], isAuthenticated, 24);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const refreshInProgressRef = useRef(false);
  const lastRefreshTimeRef = useRef(0);
  const REFRESH_THROTTLE_MS = 30000; // Prevent refreshes more often than every 30 seconds
  
  const listingCache = useRef<Map<string, Listing>>(new Map());
  
  const isProductDetailPage = useRef<boolean>(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkIfProductPage = () => {
        isProductDetailPage.current = window.location.pathname.startsWith('/product/');
      };
      
      checkIfProductPage();
      
      window.addEventListener('popstate', checkIfProductPage);
      
      return () => {
        window.removeEventListener('popstate', checkIfProductPage);
      };
    }
  }, []);

  const fetchPublicListings = useCallback(async (count: number = 8) => {
    try {
      console.log("Fetching public listings for unauthenticated users");
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('deleted', false)
        .order('views', { ascending: false })
        .limit(count);
      
      if (error) {
        console.error("Error fetching public listings:", error);
        return;
      }
      
      console.log("Raw data from Supabase:", data?.length, "listings");
      
      if (data) {
        interface SupabaseListingData {
          id: string;
          title: string;
          price: number;
          image_url?: string;
          seller_id: string;
          category?: string;
          condition?: string;
          location?: string;
          description?: string;
          posted_at?: string;
          contact_method?: string;
          contact_info?: string;
          payment_methods?: string[];
          views?: number;
          shipping?: boolean;
          deleted?: boolean;
          additional_images?: string[];
        }
        
        const formattedListings: Listing[] = (data as SupabaseListingData[]).map(item => ({
          id: item.id,
          title: item.title,
          price: item.price,
          image: item.image_url || '',
          seller: 'UofT Seller',
          sellerId: item.seller_id,
          category: item.category || '',
          condition: item.condition || '',
          location: item.location || '',
          description: item.description || '',
          postedTime: item.posted_at || new Date().toISOString(),
          contactMethod: item.contact_method || '',
          contactInfo: item.contact_info || '',
          paymentMethods: item.payment_methods || [],
          views: item.views || 0,
          shipping: item.shipping || false,
          deleted: item.deleted || false,
          additionalImages: item.additional_images || [],
          additional_images: item.additional_images || [],
          image_url: item.image_url,
          isPublic: true
        }));
        
        setPublicListings(formattedListings);
        console.log(`Fetched ${formattedListings.length} public listings for unauthenticated users`);
      }
    } catch (error) {
      console.error("Error in fetchPublicListings:", error);
    }
  }, []);

  const getPublicListings = useCallback((count: number = 4) => {
    return publicListings.slice(0, count);
  }, [publicListings]);

  useEffect(() => {
    // Force immediate refresh
    console.log("Initializing public listings fetch...");
    fetchPublicListings();
    
    const interval = setInterval(() => {
      fetchPublicListings();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [fetchPublicListings]);

  const refreshListings = useCallback(async () => {
    if (!isAuthenticated || isLoading) return;
    
    // Prevent multiple concurrent refreshes
    if (refreshInProgressRef.current) {
      console.log("Refresh already in progress, skipping");
      return;
    }
    
    // Throttle refreshes to prevent too many requests
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTimeRef.current;
    if (timeSinceLastRefresh < REFRESH_THROTTLE_MS && lastRefreshTimeRef.current !== 0) {
      console.log(`Throttling refresh (${Math.round(timeSinceLastRefresh/1000)}s since last refresh)`);
      return;
    }
    
    try {
      refreshInProgressRef.current = true;
      setIsLoading(true);
      lastRefreshTimeRef.current = now;
      
      console.log("Starting listings refresh...");
      
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('deleted', false)
        .order('posted_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching listings:", error);
        return;
      }
      
      console.log(`Fetched ${data?.length || 0} listings from Supabase`);
      
      interface SupabaseListingData {
        id: string;
        title: string;
        price: number;
        image_url?: string;
        seller_id: string;
        category?: string;
        condition?: string;
        location?: string;
        description?: string;
        posted_at?: string;
        contact_method?: string;
        contact_info?: string;
        payment_methods?: string[];
        views?: number;
        shipping?: boolean;
        deleted?: boolean;
        additional_images?: string[];
      }
      
      const formattedListings: Listing[] = (data as SupabaseListingData[]).map(item => ({
        id: item.id,
        title: item.title,
        price: item.price,
        image: item.image_url || '',
        seller: '',  // Will be populated below
        sellerId: item.seller_id,
        seller_id: item.seller_id, // Duplicate for compatibility
        category: item.category || '',
        condition: item.condition || '',
        location: item.location || '',
        description: item.description || '',
        postedTime: item.posted_at || new Date().toISOString(),
        posted_at: item.posted_at || new Date().toISOString(), // Duplicate for compatibility
        contactMethod: item.contact_method || '',
        contactInfo: item.contact_info || '',
        paymentMethods: item.payment_methods || [],
        views: item.views || 0,
        shipping: item.shipping || false,
        deleted: item.deleted || false,
        additionalImages: item.additional_images || [],
        additional_images: item.additional_images || [],
        image_url: item.image_url
      }));
      
      console.log(`Formatted ${formattedListings.length} listings`);
      
      // Get unique seller IDs
      const sellerIds = [...new Set(formattedListings.map(listing => listing.sellerId))];
      
      if (sellerIds.length > 0) {
        console.log(`Fetching profile data for ${sellerIds.length} sellers`);
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('public_profiles')
          .select('id, name, avatar_url')
          .in('id', sellerIds);
          
        if (profilesError) {
          console.error("Error fetching seller profiles:", profilesError);
        }
        
        if (profilesData) {
          console.log(`Fetched ${profilesData.length} seller profiles`);
          
          const sellerMap = new Map(profilesData.map(profile => [profile.id, profile.name]));
          const avatarMap = new Map(profilesData.map(profile => [profile.id, profile.avatar_url]));
          
          formattedListings.forEach(listing => {
            listing.seller = sellerMap.get(listing.sellerId) || '';
            listing.sellerAvatar = avatarMap.get(listing.sellerId) || undefined;
          });
        }
      }
      
      console.log(`Final listings count: ${formattedListings.length}`);
      
      // Clear and rebuild the cache
      listingCache.current.clear();
      formattedListings.forEach(listing => {
        if (listing.id) {
          listingCache.current.set(listing.id, listing);
        }
      });
      
      setListings(formattedListings);
    } catch (error) {
      console.error("Error in refreshListings:", error);
    } finally {
      setIsLoading(false);
      refreshInProgressRef.current = false;
    }
  }, [isAuthenticated, isLoading, setListings]);

  useEffect(() => {
    cleanupStaleData();
    
    if (isAuthenticated && !isInitialized && !isLoading) {
      refreshListings().then(() => {
        setIsInitialized(true);
      });
    }
  }, [isAuthenticated, isInitialized, refreshListings, isLoading]);

  const clearAllListings = useCallback(() => {
    console.log('Clearing all listings from storage');
    setListings([]);
    setFlaggedListings([]);
    listingCache.current.clear();
  }, [setListings, setFlaggedListings]);

  const addListing = async (listing: Omit<Listing, 'id' | 'postedTime' | 'sellerId'>): Promise<string> => {
    if (!user) {
      console.error("Cannot add listing without being logged in");
      return "";
    }
    
    try {
      const additionalImages = listing.additionalImages || [];
      
      const mainImageUrl = listing.image;
      
      console.log('Adding listing with main image:', mainImageUrl);
      console.log('Additional images:', additionalImages);
      
      const { data, error } = await supabase
        .from('listings')
        .insert({
          title: listing.title,
          price: listing.price,
          image_url: mainImageUrl,
          seller_id: user.id,
          category: listing.category,
          condition: listing.condition,
          location: listing.location,
          description: listing.description,
          contact_method: listing.contactMethod,
          contact_info: listing.contactInfo,
          payment_methods: listing.paymentMethods,
          views: 0,
          deleted: false,
          additional_images: additionalImages
        })
        .select('id')
        .single();
      
      if (error) {
        console.error("Error creating listing in Supabase:", error);
        return "";
      }
      
      const id = data.id;
      
      const newListing: Listing = { 
        ...listing, 
        id,
        postedTime: new Date().toISOString(),
        views: 0,
        deleted: false,
        sellerId: user.id,
        seller: user.name,
        additionalImages
      };
      
      const updatedListings = [...listings, newListing];
      setListings(updatedListings);
      
      listingCache.current.set(id, newListing);
      
      return id;
    } catch (error) {
      console.error("Error in addListing:", error);
      return "";
    }
  };

  const editListing = async (id: string, updates: Partial<Listing>): Promise<boolean> => {
    const listingIndex = listings.findIndex(listing => listing.id === id);
    
    if (listingIndex === -1) return false;
    
    if (user && listings[listingIndex].sellerId !== user.id) {
      console.warn("Cannot edit a listing that doesn't belong to the current user");
      return false;
    }
    
    try {
      const supabaseUpdates: any = {};
      
      if (updates.title) supabaseUpdates.title = updates.title;
      if (updates.price) supabaseUpdates.price = updates.price;
      if (updates.image) supabaseUpdates.image_url = updates.image;
      if (updates.category) supabaseUpdates.category = updates.category;
      if (updates.condition) supabaseUpdates.condition = updates.condition;
      if (updates.location) supabaseUpdates.location = updates.location;
      if (updates.description) supabaseUpdates.description = updates.description;
      if (updates.contactMethod) supabaseUpdates.contact_method = updates.contactMethod;
      if (updates.contactInfo) supabaseUpdates.contact_info = updates.contactInfo;
      if (updates.paymentMethods) supabaseUpdates.payment_methods = updates.paymentMethods;
      if (updates.shipping !== undefined) supabaseUpdates.shipping = updates.shipping;
      
      // Special handling for postedTime/posted_at for relisting
      if (updates.postedTime) {
        supabaseUpdates.posted_at = updates.postedTime;
        console.log('Updating posted_at in Supabase:', updates.postedTime);
      }
      
      // If posted_at is provided directly, use it
      if (updates.posted_at) {
        supabaseUpdates.posted_at = updates.posted_at;
        console.log('Updating posted_at directly in Supabase:', updates.posted_at);
      }
      
      if (updates.additionalImages) {
        supabaseUpdates.additional_images = updates.additionalImages;
        console.log('Updating additional_images in Supabase:', updates.additionalImages);
      }
      
      supabaseUpdates.updated_at = new Date().toISOString();
      
      console.log('Sending updates to Supabase:', supabaseUpdates);
      
      const { error } = await supabase
        .from('listings')
        .update(supabaseUpdates)
        .eq('id', id);
      
      if (error) {
        console.error("Error updating listing in Supabase:", error);
        return false;
      }
      
      const updatedListings = [...listings];
      updatedListings[listingIndex] = {
        ...updatedListings[listingIndex],
        ...updates,
        id: listings[listingIndex].id,
        postedTime: updates.postedTime || updates.posted_at || listings[listingIndex].postedTime,
        posted_at: updates.postedTime || updates.posted_at || listings[listingIndex].posted_at,
        views: listings[listingIndex].views || 0,
        sellerId: listings[listingIndex].sellerId,
        seller: listings[listingIndex].seller
      };
      
      console.log('Updated listing in local state:', updatedListings[listingIndex]);
      
      setListings(updatedListings);
      
      listingCache.current.set(id, updatedListings[listingIndex]);
      
      return true;
    } catch (error) {
      console.error("Error in editListing:", error);
      return false;
    }
  };

  const incrementViews = async (id: string) => {
    const listingIndex = listings.findIndex(listing => listing.id === id);
    
    if (listingIndex === -1) return;
    
    try {
      await supabase.rpc('increment_listing_views', { 
        listing_uuid: id 
      });
      
      const updatedListings = [...listings];
      updatedListings[listingIndex] = {
        ...updatedListings[listingIndex],
        views: (updatedListings[listingIndex].views || 0) + 1
      };
      
      setListings(updatedListings);
      
      listingCache.current.set(id, updatedListings[listingIndex]);
    } catch (error) {
      console.error("Error incrementing views:", error);
    }
  };

  const getFeaturedListings = (count: number = 4): Listing[] => {
    return sortListingsByViews(listings, count);
  };

  const removeListing = async (id: string): Promise<boolean> => {
    const listingIndex = listings.findIndex(listing => listing.id === id);
    
    if (listingIndex === -1) {
      console.warn(`Listing with ID ${id} not found`);
      return false;
    }
    
    if (user && listings[listingIndex].sellerId !== user.id) {
      console.warn("Cannot remove a listing that doesn't belong to the current user");
      return false;
    }
    
    try {
      console.log(`Attempting to delete listing with ID: ${id}`);
      const imageUrl = listings[listingIndex].image || listings[listingIndex].image_url;
      
      const { success, error } = await deleteListingAndImage(id, imageUrl);
      
      if (!success) {
        console.error("Error removing listing:", error);
        return false;
      }
      
      const updatedListings = listings.filter(listing => listing.id !== id);
      setListings(updatedListings);
      
      listingCache.current.delete(id);
      
      console.log(`Listing ${id} successfully deleted with its image`);
      return true;
    } catch (error) {
      console.error("Error in removeListing:", error);
      return false;
    }
  };

  const getUserListings = (): Listing[] => {
    if (!user) {
      return [];
    }
    
    return filterListingsByUserId(listings, user.id);
  };
  
  const getListing = (id: string): Listing | undefined => {
    if (listingCache.current.has(id)) {
      const listing = listingCache.current.get(id);
      if (listing && !listing.deleted) {
        if (!listing.additionalImages) {
          listing.additionalImages = [];
        }
        return listing;
      }
    }
    
    const shouldLog = isProductDetailPage.current && process.env.NODE_ENV === 'development';
    
    if (shouldLog && !listingCache.current.has(id)) {
      console.log("Looking for listing with ID:", id);
      
      listingCache.current.set(id + '_logged', { id } as Listing);
    }
    
    const listing = listings.find(listing => listing.id === id);
    if (listing && listing.deleted) {
      if (shouldLog) console.log("Listing found but is deleted");
      return undefined;
    }
    
    if (listing) {
      if (!listing.additionalImages) {
        listing.additionalImages = listing.additional_images || [];
        console.log('Using additional_images fallback:', listing.additional_images);
      }
      
      listingCache.current.set(id, listing);
    }
    
    return listing;
  };
  
  const flagListing = async (id: string, reason: string): Promise<boolean> => {
    if (!user) {
      console.error("Cannot flag listing without being logged in");
      return false;
    }
    
    const listingExists = listings.some(listing => listing.id === id && !listing.deleted);
    
    if (listingExists) {
      try {
        const { error } = await supabase
          .from('flagged_listings')
          .insert({
            listing_id: id,
            flagger_id: user.id,
            reason
          });
        
        if (error) {
          console.error("Error flagging listing in Supabase:", error);
          return false;
        }
        
        const updatedFlaggedListings = [...flaggedListings, { id, reason }];
        setFlaggedListings(updatedFlaggedListings);
        return true;
      } catch (error) {
        console.error("Error in flagListing:", error);
        return false;
      }
    }
    
    return false;
  };
  
  const getSellerListings = (sellerName: string): Listing[] => {
    return filterListingsBySeller(listings, sellerName);
  };

  return (
    <ListingsContext.Provider value={{ 
      listings: filterActiveListings(listings), 
      addListing, 
      editListing,
      removeListing, 
      getUserListings,
      getListing,
      incrementViews,
      getFeaturedListings,
      flagListing,
      getSellerListings,
      clearAllListings,
      filterListingsByLocation: (location) => filterListingsByLocation(listings, location),
      refreshListings,
      getPublicListings
    }}>
      {children}
    </ListingsContext.Provider>
  );
};

export const useListings = () => {
  const context = useContext(ListingsContext);
  
  if (context === undefined) {
    throw new Error('useListings must be used within a ListingsProvider');
  }
  
  return context;
};
