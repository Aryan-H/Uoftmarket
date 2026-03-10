import { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Categories from '@/components/Categories';
import ProductCard from '@/components/ProductCard';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useListings } from '@/contexts/ListingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { LockIcon, Sparkles, Book, Cpu, MessageSquare, ArrowRight, ListCheck, Coffee as CoffeeIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { sortMostPopularItems } from '@/utils/listingUtils';

const mockFeaturedProducts = [{
  id: "1",
  title: 'MacBook Pro M2 - Nearly New',
  price: 1200.00,
  image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80',
  category: 'Electronics',
  condition: 'Like New',
  seller: 'Maya T',
  sellerId: 'mock-seller-1',
  postedTime: '2023-10-15',
  location: 'St. George Campus',
  views: 52
}, {
  id: "2",
  title: 'Calculus & Linear Algebra Textbooks Bundle',
  price: 85.00,
  image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80',
  category: 'Textbooks',
  condition: 'Good',
  seller: 'Jayden K',
  sellerId: 'mock-seller-2',
  postedTime: '2023-10-20',
  location: 'Robarts Library',
  views: 38
}, {
  id: "3",
  title: 'Study Desk and Chair Set',
  price: 120.00,
  image: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80',
  category: 'Furniture',
  condition: 'New',
  seller: 'Aisha M',
  sellerId: 'mock-seller-3',
  postedTime: '2023-10-10',
  location: 'Mississauga Campus',
  views: 45
}];

const Index = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPublicListingsLoaded, setIsPublicListingsLoaded] = useState(false);
  const {
    listings,
    getFeaturedListings,
    getPublicListings,
    refreshListings
  } = useListings();
  const {
    isAuthenticated,
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const hasLoggedRef = useRef(false);
  
  const recentUserListings = listings.sort((a, b) => new Date(b.postedTime).getTime() - new Date(a.postedTime).getTime()).slice(0, 4);
  const userFeaturedListings = isAuthenticated ? getFeaturedListings(4) : [];
  const publicListings = getPublicListings(8); // Get 8 listings to show 4
  
  // For authenticated users, prioritize featured listings, then recent listings
  // For unauthenticated users, use public listings or mock data as fallback
  const displayProducts = isAuthenticated 
    ? userFeaturedListings.length > 0 
      ? userFeaturedListings 
      : recentUserListings.length > 0 
        ? recentUserListings 
        : []
    : publicListings.length > 0 
      ? publicListings.slice(0, 4) // Show only 4 of the 8 fetched
      : isPublicListingsLoaded 
        ? [] // If we've tried to load public listings but got none, show empty
        : mockFeaturedProducts; // Show mock data while loading
  
  const usingMockData = !isAuthenticated && publicListings.length === 0 && isPublicListingsLoaded;

  // Track when public listings have been loaded (for unauthenticated users)
  useEffect(() => {
    if (!isAuthenticated && publicListings.length > 0) {
      setIsPublicListingsLoaded(true);
    }
  }, [isAuthenticated, publicListings.length]);

  useEffect(() => {
    setIsLoaded(true);
    if (isAuthenticated) {
      refreshListings();
    }
    
    // Add a small delay to ensure ListingsContext has initialized
    const timer = setTimeout(() => {
      if (!hasLoggedRef.current) {
        console.log("Index loaded, listings count:", listings.length);
        if (isAuthenticated) {
          console.log("Using authenticated listings:", userFeaturedListings.length);
        } else {
          console.log("User not authenticated, using public listings:", publicListings.length);
          if (publicListings.length === 0 && !isPublicListingsLoaded) {
            console.log("Public listings still loading, showing mock data temporarily");
          } else if (publicListings.length === 0) {
            console.log("No public listings available after loading");
          }
        }
        hasLoggedRef.current = true;
      }
    }, 100);
    
    return () => {
      clearTimeout(timer);
      hasLoggedRef.current = false;
    };
  }, [listings.length, isAuthenticated, publicListings.length, userFeaturedListings.length, refreshListings, isPublicListingsLoaded]);

  return <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        <Hero />
        
        <Categories />

        <section className="py-24 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-white to-transparent z-0"></div>
          <div className="absolute -top-20 right-0 w-96 h-96 rounded-full bg-blue-50 opacity-70 blur-3xl z-0"></div>
          <div className="absolute bottom-0 -left-20 w-80 h-80 rounded-full bg-amber-50 opacity-60 blur-3xl z-0"></div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="mb-14 text-center">
              <div className="inline-flex items-center justify-center mb-3 px-4 py-1.5 bg-toronto-blue/10 rounded-full text-toronto-blue">
                <Sparkles className="h-4 w-4 mr-2" />
                <span className="text-sm font-semibold uppercase tracking-wider">Top Picks</span>
              </div>
              <h2 className={`text-3xl md:text-5xl font-bold mb-4 text-toronto-dark bg-clip-text text-transparent bg-gradient-to-r from-toronto-blue to-toronto-blue/70 transition-all duration-700 
                ${isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-10'}`}>
                Featured Products
              </h2>
              <p className={`text-lg text-gray-600 max-w-2xl mx-auto transition-all duration-700 delay-100
                ${isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-10'}`}>
                {isAuthenticated ? 'Most popular items with highest engagement' : 'Popular items from our marketplace'}
              </p>
              
              {!isAuthenticated && <div className="mt-5 py-3 px-4 text-amber-700 bg-amber-50 rounded-lg inline-flex items-center gap-2 border border-amber-200 shadow-sm">
                  <LockIcon className="h-4 w-4" />
                  <span className="font-medium">Sign in to access all features and products</span>
                </div>}
              
              {isAuthenticated && displayProducts.length === 0 && <div className="mt-5 py-3 px-4 text-amber-700 bg-amber-50 rounded-lg inline-flex items-center gap-2 border border-amber-200 shadow-sm">
                  <LockIcon className="h-4 w-4" />
                  <span className="font-medium">No products available at this time</span>
                </div>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {displayProducts.length > 0 ? displayProducts.map((product, index) => <div key={product.id} className={`transition-all duration-700 relative card-hover transform hover:-translate-y-2 hover:shadow-xl
                    ${isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-10'}`} style={{
              transitionDelay: `${index * 100}ms`
            }}>
                    <ProductCard {...product} />
                    {!isAuthenticated && <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-lg backdrop-blur-[3px]">
                        <Button asChild variant="glass" className="gap-2 shadow-md">
                          <Link to="/auth">
                            <LockIcon className="h-4 w-4" />
                            Sign in to View
                          </Link>
                        </Button>
                      </div>}
                  </div>) : isAuthenticated ? <div className="col-span-full text-center py-10">
                  <p className="text-gray-500 mb-4">No products available at this time.</p>
                </div> : <div className="col-span-full text-center py-10">
                  <p className="text-gray-500 mb-4">Sign in to see product listings</p>
                  <Button asChild>
                    <Link to="/auth">Sign In</Link>
                  </Button>
                </div>}
            </div>
            
            <div className="mt-14 text-center">
              <Button asChild className="bg-toronto-blue hover:bg-toronto-blue/90 text-white px-8 py-6 rounded-full shadow-lg group transition-all duration-300 hover:pr-10">
                <Link to="/products" className="inline-flex items-center">
                  View All Products
                  <ArrowRight className="ml-2 h-4 w-4 transform transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-24 bg-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] z-0"></div>
          <div className="absolute top-1/3 right-0 w-64 h-64 rounded-full bg-toronto-blue/5 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-gray-50/50 to-transparent"></div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="mb-14 text-center">
              <div className="inline-flex items-center justify-center mb-3 px-4 py-1.5 bg-toronto-gold/20 rounded-full text-toronto-dark">
                <CoffeeIcon className="h-4 w-4 mr-2" />
                <span className="text-sm font-semibold uppercase tracking-wider">Simple Process</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-toronto-dark">How It Works</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                UofT Market makes buying and selling simple and secure
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-10 relative">
              <div className="hidden md:block absolute top-1/3 left-1/6 w-2/3 h-0.5 bg-gradient-to-r from-toronto-blue/30 to-toronto-gold/30"></div>
              
              <Card className="group text-center p-8 rounded-2xl bg-white shadow-soft hover:shadow-md transition-all duration-300 relative overflow-hidden border-0 hover:border-toronto-blue/20 hover:border">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="bg-toronto-blue text-white rounded-full w-16 h-16 flex items-center justify-center text-xl font-bold mx-auto mb-6 shadow-md relative z-10 group-hover:scale-110 transition-transform duration-300">
                  <Book className="h-7 w-7" />
                </div>
                <CardContent className="p-0 relative z-10">
                  <h3 className="text-xl font-bold mb-3 text-toronto-dark group-hover:text-toronto-blue transition-colors">Sign Up with UofT Email</h3>
                  <p className="text-gray-600">
                    Create an account using your @mail.utoronto.ca email to join our verified student marketplace.
                  </p>
                </CardContent>
                <div className="absolute -bottom-2 -right-2 w-24 h-24 bg-blue-50 rounded-full opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
              </Card>

              <Card className="group text-center p-8 rounded-2xl bg-white shadow-soft hover:shadow-md transition-all duration-300 relative overflow-hidden border-0 hover:border-toronto-blue/20 hover:border">
                <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="bg-toronto-blue text-white rounded-full w-16 h-16 flex items-center justify-center text-xl font-bold mx-auto mb-6 shadow-md relative z-10 group-hover:scale-110 transition-transform duration-300">
                  <Cpu className="h-7 w-7" />
                </div>
                <CardContent className="p-0 relative z-10">
                  <h3 className="text-xl font-bold mb-3 text-toronto-dark group-hover:text-toronto-blue transition-colors">Browse or List Items</h3>
                  <p className="text-gray-600">
                    Find what you need or list items you want to sell. Add photos, descriptions, and set your price.
                  </p>
                </CardContent>
                <div className="absolute -bottom-2 -right-2 w-24 h-24 bg-green-50 rounded-full opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
              </Card>

              <Card className="group text-center p-8 rounded-2xl bg-white shadow-soft hover:shadow-md transition-all duration-300 relative overflow-hidden border-0 hover:border-toronto-blue/20 hover:border">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="bg-toronto-blue text-white rounded-full w-16 h-16 flex items-center justify-center text-xl font-bold mx-auto mb-6 shadow-md relative z-10 group-hover:scale-110 transition-transform duration-300">
                  <ListCheck className="h-7 w-7" />
                </div>
                <CardContent className="p-0 relative z-10">
                  <h3 className="text-xl font-bold mb-3 text-toronto-dark group-hover:text-toronto-blue transition-colors">Make or Find Requests</h3>
                  <p className="text-gray-600">Can't find what you need in the listings? Use the Requests feature to ask other students for anything you want. </p>
                </CardContent>
                <div className="absolute -bottom-2 -right-2 w-24 h-24 bg-purple-50 rounded-full opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
              </Card>

              <Card className="group text-center p-8 rounded-2xl bg-white shadow-soft hover:shadow-md transition-all duration-300 relative overflow-hidden border-0 hover:border-toronto-blue/20 hover:border">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="bg-toronto-blue text-white rounded-full w-16 h-16 flex items-center justify-center text-xl font-bold mx-auto mb-6 shadow-md relative z-10 group-hover:scale-110 transition-transform duration-300">
                  <MessageSquare className="h-7 w-7" />
                </div>
                <CardContent className="p-0 relative z-10">
                  <h3 className="text-xl font-bold mb-3 text-toronto-dark group-hover:text-toronto-blue transition-colors">Meet & Complete Transaction</h3>
                  <p className="text-gray-600">
                    Connect with buyers or sellers through our messaging system and arrange a campus meetup.
                  </p>
                </CardContent>
                <div className="absolute -bottom-2 -right-2 w-24 h-24 bg-amber-50 rounded-full opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
              </Card>
            </div>

            <div className="mt-16 text-center">
              <Button asChild className="bg-toronto-gold text-toronto-dark hover:bg-toronto-gold/90 px-8 py-6 rounded-full shadow-lg group transition-all duration-300 hover:pr-10">
                <Link to="/auth" className="inline-flex items-center">
                  Get Started Today
                  <ArrowRight className="ml-2 h-4 w-4 transform transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>;
};

export default Index;
