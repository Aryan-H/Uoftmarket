
import React from 'react';
import { useSavedItems } from '@/contexts/SavedItemsContext';
import { Link } from 'react-router-dom';
import { Bookmark, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const SavedItemsList = () => {
  const { savedItems, removeSavedItem } = useSavedItems();

  const handleRemove = async (id: string) => {
    const success = await removeSavedItem(id);
    if (success) {
      toast.success('Item removed from saved items');
    } else {
      toast.error('Failed to remove item');
    }
  };

  if (savedItems.length === 0) {
    return (
      <div className="bg-background border rounded-lg p-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Bookmark className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No saved items yet</h3>
          <p className="text-muted-foreground mt-2 mb-6">
            Items you save will appear here for easy access.
          </p>
          <Button asChild>
            <Link to="/products">Browse Products</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background border rounded-lg p-6">
      <h3 className="text-lg font-medium mb-4">Saved Items</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savedItems.map(item => (
            <div key={item.id} className="flex border rounded p-4 space-x-4">
              <div className="w-20 h-20 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                {item.image ? (
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <Bookmark className="h-6 w-6 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium text-sm truncate">{item.title}</h4>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleRemove(item.id)}
                    className="h-7 w-7 p-0"
                  >
                    <span className="sr-only">Remove</span>
                    <Bookmark className="h-4 w-4 fill-current" />
                  </Button>
                </div>
                <p className="text-sm font-medium text-muted-foreground">${item.price}</p>
                <p className="text-xs text-muted-foreground">Seller: {item.seller}</p>
                <p className="text-xs text-muted-foreground">Saved on {item.savedDate}</p>
                <div className="mt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    asChild
                    className="h-7 text-xs"
                  >
                    <Link to={`/product/${item.id}`}>
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View Details
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SavedItemsList;
