import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/ProductCard';
import ProductListItem from '@/components/product/ProductListItem';
import { Listing } from '@/types/listings';
import { useToast } from '@/hooks/use-toast';

interface ProductGridProps {
  listings: Listing[];
  isAuthenticated: boolean;
  createTestListing?: () => void;
  resetFilters: () => void;
  viewMode: 'grid' | 'list';
}

const ProductGrid = ({
  listings,
  isAuthenticated,
  createTestListing,
  resetFilters,
  viewMode = 'grid'
}: ProductGridProps) => {
  const { toast } = useToast();
  const [imageLoadErrors, setImageLoadErrors] = useState<Record<string, boolean>>({});
  
  const processedListings = useMemo(() => {
    return listings.map(listing => ({
      ...listing,
      processedImages: getListingImages(listing)
    }));
  }, [listings]);
  
  const handleImageError = (listingId: string) => {
    if (!imageLoadErrors[listingId]) {
      setImageLoadErrors(prev => ({...prev, [listingId]: true}));
      toast({
        variant: "destructive",
        title: "Image loading error",
        description: "There was a problem loading an image. We're trying alternative methods.",
      });
    }
  };

  function getListingImages(listing: Listing): string[] {
    const images: string[] = [];
    const uniqueUrls = new Set<string>();
    
    if (listing.image || listing.image_url) {
      const mainImage = listing.image || listing.image_url || "/placeholder.svg";
      images.push(mainImage);
      uniqueUrls.add(mainImage);
    }
    
    if (listing.additionalImages && Array.isArray(listing.additionalImages)) {
      listing.additionalImages.forEach(img => {
        if (img && !uniqueUrls.has(img)) {
          images.push(img);
          uniqueUrls.add(img);
        }
      });
    } else if (listing.additional_images && Array.isArray(listing.additional_images)) {
      listing.additional_images.forEach(img => {
        if (img && !uniqueUrls.has(img)) {
          images.push(img);
          uniqueUrls.add(img);
        }
      });
    }
    
    if (images.length === 0) {
      images.push("/placeholder.svg");
    }
    
    return images;
  };

  if (listings.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium mb-2">No listings found</h3>
        <p className="text-gray-500 mb-4">
          Try adjusting your filters or search criteria
        </p>
        <Button onClick={resetFilters}>
          Reset Filters
        </Button>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="flex flex-col gap-4">
        {processedListings.map(listing => (
          <ProductListItem 
            key={listing.id} 
            id={listing.id} 
            title={listing.title} 
            price={listing.price} 
            image={listing.image || listing.image_url || "/placeholder.svg"} 
            images={listing.processedImages}
            seller={listing.seller}
            sellerAvatar={listing.sellerAvatar}
            category={listing.category} 
            condition={listing.condition} 
            postedTime={listing.postedTime || listing.posted_at || "Recently"} 
            location={listing.location} 
            description={listing.description}
            onImageError={() => handleImageError(listing.id)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {processedListings.map(listing => (
        <ProductCard 
          key={listing.id} 
          id={listing.id} 
          title={listing.title} 
          price={listing.price} 
          image={listing.image || listing.image_url || "/placeholder.svg"} 
          images={listing.processedImages}
          seller={listing.seller}
          sellerAvatar={listing.sellerAvatar}
          category={listing.category} 
          condition={listing.condition} 
          postedTime={listing.postedTime || listing.posted_at || "Recently"} 
          location={listing.location} 
          description={listing.description}
          onImageError={() => handleImageError(listing.id)}
        />
      ))}
    </div>
  );
};

export default ProductGrid;
