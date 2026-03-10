import { useState, useEffect, useMemo } from 'react';
import { Listing } from '@/types/listings';

export const useProductFiltering = (listings: Listing[]) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 15000]);
  const [sortBy, setSortBy] = useState<string>('latest');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    const searchParam = urlParams.get('search');
    const locationParam = urlParams.get('location');
    
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
    
    if (searchParam) {
      setSearchQuery(searchParam);
    }
    
    if (locationParam) {
      setSelectedLocation(locationParam);
    }
  }, []);

  const filteredListings = useMemo(() => {
    console.log("Filtering listings:", listings.length);
    console.log("Current filters - Category:", selectedCategory, "Location:", selectedLocation, "Price range:", priceRange);
    
    listings.forEach(listing => {
      console.log(`Available listing: ${listing.id} - ${listing.title} - ${listing.category} - ${listing.location} - ${listing.price}`);
    });
    
    if (!listings || listings.length === 0) {
      console.log("No listings to filter");
      return [];
    }
    
    return listings.filter(listing => {
      const matchesSearch = !searchQuery || 
        (listing.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        listing.description?.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = !selectedCategory || 
        (!listing.category ? false : 
          (listing.category.toLowerCase() === selectedCategory.toLowerCase() || 
           (selectedCategory === 'academic-services' && 
            listing.category.toLowerCase().replace(/[\s-_]+/g, '').includes('academicservice')) ||
           (selectedCategory === 'furniture' && 
            listing.category.toLowerCase().replace(/[\s-_]+/g, '').includes('furniture'))));
      
      let matchesLocation = true;
      if (selectedLocation && listing.location) {
        const normalizedSelection = selectedLocation.toLowerCase()
          .replace(/\./g, '')
          .replace(/-/g, '')
          .replace(/\s+/g, '')
          .trim();
          
        const normalizedLocation = listing.location.toLowerCase()
          .replace(/\./g, '')
          .replace(/-/g, '')
          .replace(/\s+/g, '')
          .trim();
        
        matchesLocation = normalizedLocation.includes(normalizedSelection) || 
                          normalizedSelection.includes(normalizedLocation);
                           
        console.log(`Location check: "${normalizedLocation}" vs "${normalizedSelection}" => ${matchesLocation ? 'match' : 'no match'}`);
      } else {
        matchesLocation = !selectedLocation;
      }
      
      const listingPrice = typeof listing.price === 'number' ? listing.price : 
                          (typeof listing.price === 'string' ? parseFloat(listing.price) : 0);
      
      const matchesPrice = (listingPrice >= priceRange[0] && 
                           (priceRange[1] >= 15000 || listingPrice <= priceRange[1]));
      
      const shouldInclude = matchesSearch && matchesCategory && matchesLocation && matchesPrice;
      
      console.log(`Evaluating listing ${listing.id} (${listing.title}) - Include: ${shouldInclude}`);
      console.log(`  Search: ${matchesSearch}, Category: ${matchesCategory}, Location: ${matchesLocation}, Price: ${matchesPrice}`);
      console.log(`  Price range: [${priceRange[0]}, ${priceRange[1]}], Listing price: ${listingPrice}, Type: ${typeof listing.price}`);
      console.log(`  Category filter: '${selectedCategory}', Listing category: '${listing.category}'`);
      console.log(`  Location filter: '${selectedLocation}', Listing location: '${listing.location}'`);
      
      return shouldInclude;
    });
  }, [listings, searchQuery, selectedCategory, selectedLocation, priceRange]);

  const sortedListings = useMemo(() => {
    if (!filteredListings.length) return [];
    
    console.log("Sorting listings, count:", filteredListings.length, "Sort by:", sortBy);
    
    let sorted = [...filteredListings];
    
    switch (sortBy) {
      case 'latest':
        sorted = sorted.sort((a, b) => {
          const dateA = new Date(a.postedTime || a.posted_at || '').getTime();
          const dateB = new Date(b.postedTime || b.posted_at || '').getTime();
          return dateB - dateA;
        });
        break;
      case 'oldest':
        sorted = sorted.sort((a, b) => {
          const dateA = new Date(a.postedTime || a.posted_at || '').getTime();
          const dateB = new Date(b.postedTime || b.posted_at || '').getTime();
          return dateA - dateB;
        });
        break;
      case 'priceAsc':
        sorted = sorted.sort((a, b) => {
          const priceA = typeof a.price === 'number' ? a.price : parseFloat(String(a.price)) || 0;
          const priceB = typeof b.price === 'number' ? b.price : parseFloat(String(b.price)) || 0;
          return priceA - priceB;
        });
        break;
      case 'priceDesc':
        sorted = sorted.sort((a, b) => {
          const priceA = typeof a.price === 'number' ? a.price : parseFloat(String(a.price)) || 0;
          const priceB = typeof b.price === 'number' ? b.price : parseFloat(String(b.price)) || 0;
          return priceB - priceA;
        });
        break;
      case 'popular':
        sorted = sorted.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      default:
        break;
    }
    
    console.log("Sorted listings count:", sorted.length);
    sorted.forEach(listing => console.log(`Sorted listing: ${listing.title}`));
    
    return sorted;
  }, [filteredListings, sortBy]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedLocation('');
    setPriceRange([0, 15000]);
    setSortBy('latest');
  };

  return {
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
  };
};
