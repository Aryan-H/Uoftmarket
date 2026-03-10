import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useNavigate, useLocation } from 'react-router-dom';

interface SearchInputProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const SearchInput = ({ searchQuery, setSearchQuery }: SearchInputProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [internalQuery, setInternalQuery] = useState(searchQuery);

  useEffect(() => {
    setInternalQuery(searchQuery);
  }, [searchQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Update parent component's state
    setSearchQuery(internalQuery);
    
    // Update URL without reloading the page
    const currentPath = location.pathname;
    const currentSearchParams = new URLSearchParams(location.search);
    
    if (internalQuery) {
      currentSearchParams.set('search', internalQuery);
    } else {
      currentSearchParams.delete('search');
    }
    
    // Keep any other existing params like category or location
    const newSearchString = currentSearchParams.toString();
    const newUrl = `${currentPath}${newSearchString ? `?${newSearchString}` : ''}`;
    
    // Use navigate with the replace option to not add to history stack when on the same page
    navigate(newUrl, { replace: currentPath === '/products' });
  };

  const clearSearch = () => {
    setInternalQuery('');
    setSearchQuery('');
    const currentPath = location.pathname;
    const currentSearchParams = new URLSearchParams(location.search);
    currentSearchParams.delete('search');
    
    // Keep any other existing params like category or location
    const newSearchString = currentSearchParams.toString();
    const newUrl = `${currentPath}${newSearchString ? `?${newSearchString}` : ''}`;
    
    // Use navigate with the replace option to not add to history stack when on the same page
    navigate(newUrl, { replace: currentPath === '/products' });
  };

  return (
    <form onSubmit={handleSubmit} className="relative flex-1 max-w-xl">
      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Search for products..."
        className="pl-10 pr-10"
        value={internalQuery}
        onChange={(e) => setInternalQuery(e.target.value)}
      />
      {internalQuery && (
        <button
          type="button"
          className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground"
          onClick={clearSearch}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </form>
  );
};

export default SearchInput;
