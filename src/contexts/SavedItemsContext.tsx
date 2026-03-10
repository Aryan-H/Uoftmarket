
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface SavedItem {
  id: string;
  title: string;
  price: number;
  image: string;
  seller: string;
  savedDate: string;
}

interface SavedItemsContextType {
  savedItems: SavedItem[];
  addSavedItem: (item: Omit<SavedItem, 'savedDate'>) => void;
  removeSavedItem: (id: string) => Promise<boolean>;
  isSaved: (id: string) => boolean;
}

const SavedItemsContext = createContext<SavedItemsContextType | undefined>(undefined);

export const SavedItemsProvider = ({ children }: { children: ReactNode }) => {
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch saved items from Supabase when user auth state changes
  useEffect(() => {
    const fetchSavedItems = async () => {
      if (!user) {
        // If not authenticated, try to load from localStorage
        const storedItems = localStorage.getItem('savedItems');
        setSavedItems(storedItems ? JSON.parse(storedItems) : []);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('saved_items')
          .select(`
            id,
            listing_id,
            saved_at,
            listings:listing_id (
              id,
              title,
              price,
              image_url,
              seller_id,
              profiles:seller_id (
                name
              )
            )
          `)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching saved items:', error);
          return;
        }

        if (data) {
          const formattedItems: SavedItem[] = data.map(item => ({
            id: item.listing_id,
            title: item.listings?.title || '',
            price: item.listings?.price || 0,
            image: item.listings?.image_url || '',
            seller: item.listings?.profiles?.name || '',
            savedDate: new Date(item.saved_at || '').toISOString().split('T')[0]
          }));
          
          setSavedItems(formattedItems);
        }
      } catch (error) {
        console.error('Unexpected error fetching saved items:', error);
      }
    };

    fetchSavedItems();
  }, [user]);

  // Fall back to localStorage when not logged in
  useEffect(() => {
    if (!user) {
      localStorage.setItem('savedItems', JSON.stringify(savedItems));
    }
  }, [savedItems, user]);

  const addSavedItem = async (item: Omit<SavedItem, 'savedDate'>) => {
    // Don't add if already exists
    if (savedItems.some(savedItem => savedItem.id === item.id)) {
      return;
    }
    
    const newItem = { 
      ...item, 
      savedDate: new Date().toISOString().split('T')[0] 
    };
    
    // Update local state immediately for responsive UI
    setSavedItems(prev => [...prev, newItem]);

    if (user) {
      try {
        // Store in Supabase
        const { error } = await supabase
          .from('saved_items')
          .insert({
            user_id: user.id,
            listing_id: item.id
          });

        if (error) {
          console.error('Error saving item to Supabase:', error);
          // Rollback local state if Supabase operation fails
          setSavedItems(prev => prev.filter(savedItem => savedItem.id !== item.id));
          toast({
            title: "Error saving item",
            description: "There was a problem adding this item to your saved items.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Unexpected error saving item:', error);
        // Rollback local state
        setSavedItems(prev => prev.filter(savedItem => savedItem.id !== item.id));
      }
    }
  };

  const removeSavedItem = async (id: string): Promise<boolean> => {
    const itemExists = savedItems.some(item => item.id === id);
    
    if (!itemExists) {
      return false;
    }
    
    // Update local state immediately for responsive UI
    setSavedItems(prev => prev.filter(item => item.id !== id));
    
    if (user) {
      try {
        // Remove from Supabase
        const { error } = await supabase
          .from('saved_items')
          .delete()
          .eq('user_id', user.id)
          .eq('listing_id', id);
          
        if (error) {
          console.error('Error removing item from Supabase:', error);
          // Rollback local state if Supabase operation fails
          const itemToRestore = savedItems.find(item => item.id === id);
          if (itemToRestore) {
            setSavedItems(prev => [...prev, itemToRestore]);
          }
          toast({
            title: "Error removing item",
            description: "There was a problem removing this item from your saved items.",
            variant: "destructive"
          });
          return false;
        }
      } catch (error) {
        console.error('Unexpected error removing item:', error);
        // Rollback local state
        const itemToRestore = savedItems.find(item => item.id === id);
        if (itemToRestore) {
          setSavedItems(prev => [...prev, itemToRestore]);
        }
        return false;
      }
    }
    
    return true;
  };

  const isSaved = (id: string): boolean => {
    return savedItems.some(item => item.id === id);
  };

  return (
    <SavedItemsContext.Provider value={{ savedItems, addSavedItem, removeSavedItem, isSaved }}>
      {children}
    </SavedItemsContext.Provider>
  );
};

export const useSavedItems = () => {
  const context = useContext(SavedItemsContext);
  
  if (context === undefined) {
    throw new Error('useSavedItems must be used within a SavedItemsProvider');
  }
  
  return context;
};
