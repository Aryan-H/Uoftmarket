
import React from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ActiveFiltersProps {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedLocation: string;
  setSelectedLocation: (location: string) => void;
  priceRange: [number, number];
  setPriceRange: (range: [number, number]) => void;
  filteredCount: number;
}

const ActiveFilters = ({
  selectedCategory,
  setSelectedCategory,
  selectedLocation,
  setSelectedLocation,
  priceRange,
  setPriceRange,
  filteredCount
}: ActiveFiltersProps) => {
  return (
    <div className="flex justify-between items-center mb-4">
      <p className="text-sm text-gray-500">
        {filteredCount} {filteredCount === 1 ? 'result' : 'results'} found
      </p>
      
      <div className="flex items-center gap-2 flex-wrap">
        {selectedCategory && (
          <Badge variant="secondary" className="flex items-center">
            {selectedCategory}
            <button 
              onClick={() => setSelectedCategory('')}
              className="ml-1 text-gray-500 hover:text-gray-800"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}
        
        {selectedLocation && (
          <Badge variant="secondary" className="flex items-center">
            {selectedLocation}
            <button 
              onClick={() => setSelectedLocation('')}
              className="ml-1 text-gray-500 hover:text-gray-800"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}
        
        {(priceRange[0] > 0 || priceRange[1] < 15000) && (
          <Badge variant="secondary" className="flex items-center">
            ${priceRange[0]}-{priceRange[1] >= 15000 ? "$15000+" : `$${priceRange[1]}`}
            <button 
              onClick={() => setPriceRange([0, 15000])}
              className="ml-1 text-gray-500 hover:text-gray-800"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}
      </div>
    </div>
  );
};

export default ActiveFilters;
