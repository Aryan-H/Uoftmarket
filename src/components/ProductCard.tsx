
import { useState, useCallback, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSavedItems } from '@/contexts/SavedItemsContext';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import ImageDisplay from '@/components/ImageDisplay';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import ImageCarousel from '@/components/ImageCarousel';

interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  image: string;
  images?: string[];
  seller: string;
  sellerAvatar?: string;
  category?: string;
  condition?: string;
  postedTime?: string;
  location?: string;
  description?: string;
  onImageError?: () => void;
}

const ProductCard = ({
  id,
  title,
  price,
  image,
  images,
  seller,
  sellerAvatar,
  category,
  condition,
  postedTime,
  location,
  onImageError
}: ProductCardProps) => {
  const saveHandled = useRef(false);
  const [isHovered, setIsHovered] = useState(false);
  const { isSaved, addSavedItem, removeSavedItem } = useSavedItems();
  const { toast } = useToast();
  const { user } = useAuth();
  const cardRef = useRef<HTMLDivElement>(null);
  
  const productImages = images || (image ? [image] : ['/placeholder.svg']);
  
  const isMounted = useRef(true);
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleSaveItem = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    
    if (saveHandled.current) return;
    saveHandled.current = true;
    
    setTimeout(() => {
      saveHandled.current = false;
    }, 500);
    
    if (isSaved(id)) {
      removeSavedItem(id);
      toast({
        title: "Item removed",
        description: "This item has been removed from your saved items."
      });
    } else {
      addSavedItem({
        id,
        title,
        price,
        image,
        seller
      });
      toast({
        title: "Item saved",
        description: "This item has been added to your saved items."
      });
    }
  }, [id, isSaved, removeSavedItem, addSavedItem, toast, title, price, image, seller]);

  const truncateTitle = (title: string, wordLimit: number = 6) => {
    const words = title.split(' ');
    if (words.length <= wordLimit) return title;
    return words.slice(0, wordLimit).join(' ') + '...';
  };

  const displayPostedTime = () => {
    if (!postedTime) return 'Recently';
    
    try {
      if (postedTime.includes('ago')) return postedTime;
      
      const date = new Date(postedTime);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return 'Recently';
    }
  };

  const conditionBadge = condition ? (
    <Badge className="bg-toronto-blue/80 text-white hover:bg-toronto-blue/90">{condition}</Badge>
  ) : null;

  return (
    <div 
      ref={cardRef}
      className="bg-white rounded-lg overflow-hidden shadow-soft card-hover border border-gray-100"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/product/${id}`} className="block relative overflow-hidden aspect-[4/3]">
        {productImages.length > 1 ? (
          <ImageCarousel 
            images={productImages}
            alt={title}
            onImageError={onImageError}
            className="h-full w-full"
            conditionBadge={conditionBadge}
          />
        ) : (
          <div className="relative h-full">
            <ImageDisplay 
              imageUrl={productImages[0]}
              alt={title}
              onError={onImageError}
              className="h-full w-full object-contain transition-all duration-300"
            />
            {condition && (
              <div className="absolute bottom-3 left-3 z-10">
                {conditionBadge}
              </div>
            )}
          </div>
        )}
        
        {category && (
          <Badge className="absolute top-3 left-3 bg-white/80 text-toronto-dark hover:bg-white/90">{category}</Badge>
        )}
        
        <Button
          size="icon"
          variant="ghost"
          className={`absolute bottom-3 right-3 rounded-full bg-white/80 hover:bg-white/90 transition-all duration-300 ${
            isSaved(id) ? 'text-toronto-blue hover:text-toronto-blue/90' : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={handleSaveItem}
        >
          <Bookmark className={`h-5 w-5 ${isSaved(id) ? 'fill-current' : ''}`} />
        </Button>
      </Link>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <h3 className="font-bold text-lg line-clamp-1 hover:text-toronto-blue transition-colors">
                  <Link to={`/product/${id}`}>{truncateTitle(title)}</Link>
                </h3>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="max-w-xs">{title}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <span className="font-bold text-toronto-blue flex-shrink-0 ml-2">${price.toFixed(2)}</span>
        </div>
        
        <div className="text-sm text-gray-500 mb-3">
          {location && <span className="block text-toronto-dark">{location}</span>}
          <span className="block">{displayPostedTime()}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Avatar className="h-6 w-6">
              {sellerAvatar ? (
                <AvatarImage src={sellerAvatar} alt={seller} />
              ) : null}
              <AvatarFallback className="bg-toronto-blue text-white text-xs">
                {seller.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{seller}</span>
          </div>
          
          <Button variant="ghost" size="sm" className="p-1 h-8" asChild>
            <Link to={`/product/${id}`}>
              <MessageCircle className="h-4 w-4 mr-1" />
              <span className="text-xs">Contact</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
