
import { Link } from 'react-router-dom';
import { Mail, MapPin, Heart, ExternalLink, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useLocation } from 'react-router-dom';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const location = useLocation();
  const isProductsPage = location.pathname === '/products';
  
  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const emailInput = form.querySelector('input[type="email"]') as HTMLInputElement;
    
    if (emailInput && emailInput.value) {
      // In a real app, this would connect to a newsletter service
      console.log('User subscribed to newsletter:', emailInput.value);
      toast.success("Successfully subscribed!", {
        description: "You'll receive updates about campus events."
      });
      emailInput.value = '';
    }
  };

  // Helper function to create product category links that work properly
  const createCategoryLink = (category: string) => {
    // Always create a safe, normalized category name
    const normalizedCategory = category.toLowerCase().trim();
    
    // Check if we're already on the products page
    const currentParams = new URLSearchParams(location.search);
    const currentCategory = currentParams.get('category');
    
    // If we're on products page and clicking the same category, just clear the category
    if (isProductsPage && currentCategory === normalizedCategory) {
      const newParams = new URLSearchParams(location.search);
      newParams.delete('category');
      return {
        pathname: '/products',
        search: newParams.toString() ? `?${newParams.toString()}` : '',
      };
    }
    
    // Otherwise set the category
    return {
      pathname: '/products',
      search: `?category=${normalizedCategory}`,
    };
  };

  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      {/* Main Footer - Clean and balanced layout */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-12 gap-8">
          {/* Logo & About - Takes 3 columns */}
          <div className="col-span-12 md:col-span-3 space-y-4">
            <Link to="/" className="inline-block mb-2">
              <span className="text-xl font-bold text-toronto-blue">
                UofT<span className="text-toronto-gold">Market</span>
              </span>
            </Link>
            <p className="text-gray-600 text-sm leading-relaxed">
              The premier marketplace exclusively for University of Toronto students. Buy, sell, and connect within our trusted community.
            </p>
            
            {/* Social Media Links - Added Instagram */}
            <div className="flex space-x-4 mt-4">
              <a 
                href="https://instagram.com/uoftmarket" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-toronto-blue transition-colors"
                aria-label="Follow us on Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links - Takes 3 columns */}
          <div className="col-span-6 md:col-span-3">
            <h3 className="text-sm font-semibold mb-4 text-gray-800 uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-gray-600 hover:text-toronto-blue transition-colors text-sm">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/products" className="text-gray-600 hover:text-toronto-blue transition-colors text-sm">
                  Browse
                </Link>
              </li>
              <li>
                <Link to="/requests" className="text-gray-600 hover:text-toronto-blue transition-colors text-sm">
                  Requests
                </Link>
              </li>
              <li>
                <Link to="/sell" className="text-gray-600 hover:text-toronto-blue transition-colors text-sm">
                  Sell Item
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-600 hover:text-toronto-blue transition-colors text-sm">
                  About
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories - Takes 3 columns */}
          <div className="col-span-6 md:col-span-3">
            <h3 className="text-sm font-semibold mb-4 text-gray-800 uppercase tracking-wider">Categories</h3>
            <ul className="space-y-3">
              {isProductsPage ? (
                <>
                  <li>
                    <Popover>
                      <PopoverTrigger asChild>
                        <span className="text-gray-600 hover:text-toronto-blue transition-colors text-sm cursor-pointer">
                          Textbooks
                        </span>
                      </PopoverTrigger>
                      <PopoverContent className="w-72">
                        <div className="space-y-2">
                          <h4 className="font-medium">Use Product Filters</h4>
                          <p className="text-sm text-gray-500">
                            Please use the filters in the left sidebar to browse by category while on the products page.
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full mt-2"
                            onClick={() => document.querySelector('.lg\\:block')?.scrollIntoView({ behavior: 'smooth' })}
                          >
                            Go to filters
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </li>
                  <li>
                    <Popover>
                      <PopoverTrigger asChild>
                        <span className="text-gray-600 hover:text-toronto-blue transition-colors text-sm cursor-pointer">
                          Electronics
                        </span>
                      </PopoverTrigger>
                      <PopoverContent className="w-72">
                        <div className="space-y-2">
                          <h4 className="font-medium">Use Product Filters</h4>
                          <p className="text-sm text-gray-500">
                            Please use the filters in the left sidebar to browse by category while on the products page.
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full mt-2"
                            onClick={() => document.querySelector('.lg\\:block')?.scrollIntoView({ behavior: 'smooth' })}
                          >
                            Go to filters
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </li>
                  <li>
                    <Popover>
                      <PopoverTrigger asChild>
                        <span className="text-gray-600 hover:text-toronto-blue transition-colors text-sm cursor-pointer">
                          Housing
                        </span>
                      </PopoverTrigger>
                      <PopoverContent className="w-72">
                        <div className="space-y-2">
                          <h4 className="font-medium">Use Product Filters</h4>
                          <p className="text-sm text-gray-500">
                            Please use the filters in the left sidebar to browse by category while on the products page.
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full mt-2"
                            onClick={() => document.querySelector('.lg\\:block')?.scrollIntoView({ behavior: 'smooth' })}
                          >
                            Go to filters
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </li>
                  <li>
                    <Popover>
                      <PopoverTrigger asChild>
                        <span className="text-gray-600 hover:text-toronto-blue transition-colors text-sm cursor-pointer">
                          Furniture
                        </span>
                      </PopoverTrigger>
                      <PopoverContent className="w-72">
                        <div className="space-y-2">
                          <h4 className="font-medium">Use Product Filters</h4>
                          <p className="text-sm text-gray-500">
                            Please use the filters in the left sidebar to browse by category while on the products page.
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full mt-2"
                            onClick={() => document.querySelector('.lg\\:block')?.scrollIntoView({ behavior: 'smooth' })}
                          >
                            Go to filters
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </li>
                  <li>
                    <Popover>
                      <PopoverTrigger asChild>
                        <span className="text-gray-600 hover:text-toronto-blue transition-colors text-sm cursor-pointer">
                          Transportation
                        </span>
                      </PopoverTrigger>
                      <PopoverContent className="w-72">
                        <div className="space-y-2">
                          <h4 className="font-medium">Use Product Filters</h4>
                          <p className="text-sm text-gray-500">
                            Please use the filters in the left sidebar to browse by category while on the products page.
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full mt-2"
                            onClick={() => document.querySelector('.lg\\:block')?.scrollIntoView({ behavior: 'smooth' })}
                          >
                            Go to filters
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link 
                      to={createCategoryLink('textbooks')} 
                      className="text-gray-600 hover:text-toronto-blue transition-colors text-sm"
                      replace={location.pathname === '/products'}
                    >
                      Textbooks
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to={createCategoryLink('electronics')} 
                      className="text-gray-600 hover:text-toronto-blue transition-colors text-sm"
                      replace={location.pathname === '/products'}
                    >
                      Electronics
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to={createCategoryLink('housing')} 
                      className="text-gray-600 hover:text-toronto-blue transition-colors text-sm"
                      replace={location.pathname === '/products'}
                    >
                      Housing
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to={createCategoryLink('furniture')} 
                      className="text-gray-600 hover:text-toronto-blue transition-colors text-sm"
                      replace={location.pathname === '/products'}
                    >
                      Furniture
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to={createCategoryLink('transportation')} 
                      className="text-gray-600 hover:text-toronto-blue transition-colors text-sm"
                      replace={location.pathname === '/products'}
                    >
                      Transportation
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
          
          {/* Contact & Newsletter - Takes 3 columns */}
          <div className="col-span-12 md:col-span-3">
            <h3 className="text-sm font-semibold mb-4 text-gray-800 uppercase tracking-wider">Stay Connected</h3>
            
            {/* Contact Info */}
            <div className="space-y-3 mb-6">
              <a href="mailto:uoftmarket@gmail.com" className="text-gray-600 hover:text-toronto-blue transition-colors text-sm flex items-start">
                <Mail className="h-4 w-4 mr-2.5 text-toronto-blue flex-shrink-0 mt-0.5" />
                <span>uoftmarket@gmail.com</span>
              </a>
              <div className="flex items-start text-gray-600 text-sm">
                <MapPin className="h-4 w-4 mr-2.5 text-toronto-blue flex-shrink-0 mt-0.5" />
                <span>University of Toronto</span>
              </div>
            </div>
            
            {/* Newsletter - Integrated directly without a box */}
            <div className="mt-6">
              <p className="text-gray-600 mb-3 text-sm">
                Subscribe to campus events newsletter:
              </p>
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <Input 
                  type="email" 
                  placeholder="Your email" 
                  className="text-sm flex-grow border-gray-200"
                  required
                />
                <Button type="submit" variant="gold" size="sm" className="whitespace-nowrap">
                  Subscribe
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer - Clean and simple */}
      <div className="border-t border-gray-200 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
            <div className="flex items-center mb-3 md:mb-0">
              <p>&copy; {currentYear} UofT Market</p>
              <span className="mx-2 text-gray-300">•</span>
              <p className="flex items-center">
                Made with <Heart className="h-3 w-3 text-red-500 mx-1" /> for UofT Students
              </p>
            </div>
            <div className="flex gap-5">
              <Link to="/privacy" className="hover:text-toronto-blue transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="hover:text-toronto-blue transition-colors">
                Terms of Service
              </Link>
              <a href="https://utoronto.ca" target="_blank" rel="noopener noreferrer" className="hover:text-toronto-blue transition-colors flex items-center">
                University of Toronto <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
