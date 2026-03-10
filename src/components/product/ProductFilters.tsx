
import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Updated locations for better matching - handles all variations by normalization
const LOCATIONS = [
  'St George',
  'Mississauga',
  'Scarborough',
  'Robarts',
  'Bahen',
  'Sidney Smith',
  'Medical Sciences',
  'Myhal',
  'Wallberg',
  'Off-Campus'
];

// Categories matched with the Sell page options and added Furniture
const CATEGORIES = [
  { id: 'textbooks', name: 'Textbooks' },
  { id: 'electronics', name: 'Electronics' },
  { id: 'housing', name: 'Housing' },
  { id: 'furniture', name: 'Furniture' },
  { id: 'transportation', name: 'Transportation' },
  { id: 'academic-services', name: 'Academic Services' },
  { id: 'miscellaneous', name: 'Miscellaneous' }
];

interface ProductFiltersProps {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedLocation: string;
  setSelectedLocation: (location: string) => void;
  priceRange: [number, number];
  setPriceRange: (range: [number, number]) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  resetFilters: () => void;
  mobileFiltersOpen: boolean;
}

const ProductFilters = ({
  selectedCategory,
  setSelectedCategory,
  selectedLocation,
  setSelectedLocation,
  priceRange,
  setPriceRange,
  sortBy,
  setSortBy,
  resetFilters,
  mobileFiltersOpen
}: ProductFiltersProps) => {
  return (
    <div className={`lg:w-1/4 ${mobileFiltersOpen ? 'block' : 'hidden'} lg:block`}>
      <Card className="sticky top-20">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Filters</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={resetFilters}
              className="h-auto p-1 text-gray-500 hover:text-red-600"
            >
              <X className="h-4 w-4 mr-1" />
              <span className="text-xs">Reset</span>
            </Button>
          </div>
          
          <Accordion type="single" collapsible defaultValue="category" className="w-full">
            <AccordionItem value="category" className="border-b">
              <AccordionTrigger className="py-2 text-sm font-medium">Category</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-1 pt-1">
                  {CATEGORIES.map((category) => (
                    <Button
                      key={category.id}
                      variant="ghost"
                      size="sm"
                      className={`w-full justify-start px-2 py-1 h-auto text-sm ${
                        selectedCategory === category.id ? 'text-toronto-blue bg-toronto-blue/10' : ''
                      }`}
                      onClick={() => setSelectedCategory(
                        selectedCategory === category.id ? '' : category.id
                      )}
                    >
                      {category.name}
                    </Button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="location" className="border-b">
              <AccordionTrigger className="py-2 text-sm font-medium">Location</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-1 pt-1">
                  {LOCATIONS.map((location) => (
                    <Button
                      key={location}
                      variant="ghost"
                      size="sm"
                      className={`w-full justify-start px-2 py-1 h-auto text-sm ${
                        selectedLocation === location ? 'text-toronto-blue bg-toronto-blue/10' : ''
                      }`}
                      onClick={() => setSelectedLocation(location === selectedLocation ? '' : location)}
                    >
                      {location}
                    </Button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="price" className="border-b">
              <AccordionTrigger className="py-2 text-sm font-medium">Price Range</AccordionTrigger>
              <AccordionContent>
                <div className="px-2 pt-2">
                  <Slider
                    defaultValue={[0, 10000]}
                    min={0}
                    max={15000}
                    step={100}
                    value={priceRange}
                    onValueChange={(value) => setPriceRange(value as [number, number])}
                    className="my-4"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-sm">${priceRange[0]}</span>
                    <span className="text-sm">
                      {priceRange[1] >= 15000 ? "$15000+" : `$${priceRange[1]}`}
                    </span>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="sort" className="border-b">
              <AccordionTrigger className="py-2 text-sm font-medium">Sort By</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-1 pt-1">
                  {[
                    { id: 'latest', name: 'Newest First' },
                    { id: 'oldest', name: 'Oldest First' },
                    { id: 'priceAsc', name: 'Price: Low to High' },
                    { id: 'priceDesc', name: 'Price: High to Low' },
                    { id: 'popular', name: 'Most Popular' }
                  ].map((option) => (
                    <Button
                      key={option.id}
                      variant="ghost"
                      size="sm"
                      className={`w-full justify-start px-2 py-1 h-auto text-sm ${
                        sortBy === option.id ? 'text-toronto-blue bg-toronto-blue/10' : ''
                      }`}
                      onClick={() => setSortBy(option.id)}
                    >
                      {option.name}
                    </Button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductFilters;
