
import { useState, useEffect, useCallback } from 'react';
import { Filter, Grid3X3, List, SlidersHorizontal } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useListings } from '@/contexts/ListingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useLocation } from 'react-router-dom';

// Import our components
import ProductFilters from '@/components/product/ProductFilters';
import ActiveFilters from '@/components/product/ActiveFilters';
import ProductGrid from '@/components/product/ProductGrid';
import SearchInput from '@/components/product/SearchInput';
import { useProductFiltering } from '@/hooks/use-product-filtering';

const Products = () => {
  const { listings, refreshListings } = useListings();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const location = useLocation();

  // Use our custom hook for filtering logic
  const {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedLocation,
    setSelectedLocation,
    priceRange,
    setPriceRange,
    sortBy,
    setSortBy,
    mobileFiltersOpen,
    setMobileFiltersOpen,
    filteredListings,
    sortedListings,
    resetFilters
  } = useProductFiltering(listings);

  // Load listings when component mounts - wrapped in useCallback to avoid recreation
  const loadListings = useCallback(async () => {
    console.log("loadListings called, isInitialized:", isInitialized, "isLoading:", isLoading);
    if (isInitialized && !isLoading) return;
    
    setIsLoading(true);
    try {
      console.log("Fetching listings for products page...");
      await refreshListings();
      console.log("Listings fetched successfully, count:", listings.length);
      
      // Debug all listings that were fetched
      listings.forEach(listing => {
        console.log(`Fetched listing: ${listing.id} - ${listing.title} - Category: ${listing.category} - Price: ${listing.price}`);
      });
    } catch (error) {
      console.error("Error loading listings:", error);
      toast({
        title: "Error loading listings",
        description: "There was a problem loading the listings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, [refreshListings, toast, isInitialized, isLoading, listings.length]);
  
  // Re-initialize filters when URL changes while already on the Products page
  useEffect(() => {
    const handleLocationChange = () => {
      // Extract query parameters from the URL
      const searchParams = new URLSearchParams(location.search);
      const categoryParam = searchParams.get('category');
      const searchParam = searchParams.get('search');
      const locationParam = searchParams.get('location');
      
      // Update state based on URL parameters
      if (categoryParam) {
        setSelectedCategory(categoryParam);
      }
      
      if (searchParam) {
        setSearchQuery(searchParam);
      }
      
      if (locationParam) {
        setSelectedLocation(locationParam);
      }
    };
    
    // Run the handler whenever the location changes
    handleLocationChange();
  }, [location.search, setSelectedCategory, setSearchQuery, setSelectedLocation]);
  
  // Force a listings refresh whenever the component mounts
  useEffect(() => {
    console.log("Products page mounted, loading listings...");
    loadListings();
    
    // Debug listings
    console.log("Current listings:", listings);
    
    if (listings.length > 0) {
      console.log("Sample listing:", listings[0]);
    }
  }, [loadListings, listings]);
  
  // Extra debugging for filtered listings
  useEffect(() => {
    console.log("Filtered listings count:", filteredListings?.length);
    console.log("Sorted listings count:", sortedListings?.length);
    
    if (filteredListings?.length > 0) {
      console.log("Filtered listings:", filteredListings.map(l => `${l.id} - ${l.title}`));
    }
    
    if (sortedListings.length > 0) {
      console.log("First sorted listing:", sortedListings[0].title);
    } else if (filteredListings.length > 0) {
      console.log("First filtered listing:", filteredListings[0].title);
    }
  }, [filteredListings, sortedListings]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow py-6 bg-gray-50 my-[60px]">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Browse Listings</h1>
            <p className="text-gray-600">Find what you need from your fellow UofT students</p>
          </div>
          
          <div className="flex items-center justify-between mb-6">
            <SearchInput searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
            
            <div className="hidden md:flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                className={viewMode === 'grid' ? 'bg-toronto-blue/10' : ''}
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4 mr-1" />
                Grid
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className={viewMode === 'list' ? 'bg-toronto-blue/10' : ''}
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4 mr-1" />
                List
              </Button>
            </div>
          </div>

          <div className="lg:flex items-start gap-6">
            {/* Mobile Filters */}
            <div className="mb-4 lg:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <div className="flex items-center">
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      Filters & Sort
                    </div>
                    {(selectedCategory || selectedLocation || priceRange[0] > 0 || priceRange[1] < 1000) && 
                      <Badge variant="secondary" className="ml-2">Active</Badge>
                    }
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[400px] overflow-y-auto">
                  <div className="py-4">
                    <ProductFilters 
                      selectedCategory={selectedCategory} 
                      setSelectedCategory={setSelectedCategory} 
                      selectedLocation={selectedLocation} 
                      setSelectedLocation={setSelectedLocation} 
                      priceRange={priceRange} 
                      setPriceRange={setPriceRange} 
                      sortBy={sortBy} 
                      setSortBy={setSortBy} 
                      resetFilters={resetFilters} 
                      mobileFiltersOpen={true} 
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            
            {/* Desktop Filters */}
            <ProductFilters 
              selectedCategory={selectedCategory} 
              setSelectedCategory={setSelectedCategory} 
              selectedLocation={selectedLocation} 
              setSelectedLocation={setSelectedLocation} 
              priceRange={priceRange} 
              setPriceRange={setPriceRange} 
              sortBy={sortBy} 
              setSortBy={setSortBy} 
              resetFilters={resetFilters} 
              mobileFiltersOpen={false} 
            />
            
            <div className="lg:flex-1">
              {/* Active Filters */}
              <ActiveFilters 
                selectedCategory={selectedCategory} 
                setSelectedCategory={setSelectedCategory} 
                selectedLocation={selectedLocation} 
                setSelectedLocation={setSelectedLocation} 
                priceRange={priceRange} 
                setPriceRange={setPriceRange} 
                filteredCount={sortedListings.length} 
              />
              
              {/* Loading state */}
              {isLoading ? (
                <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
                  <div className="animate-pulse flex flex-col items-center">
                    <div className="h-6 w-24 bg-gray-200 rounded mb-4"></div>
                    <div className="h-4 w-36 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ) : (
                /* Product Grid/List */
                <ProductGrid 
                  listings={sortedListings} 
                  isAuthenticated={isAuthenticated} 
                  resetFilters={resetFilters}
                  viewMode={viewMode}
                />
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Products;
