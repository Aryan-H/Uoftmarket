
import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Calendar, Shield, TagIcon, HeartIcon, Flag, User, Mail, Phone, ChevronLeft, MessageCircle } from "lucide-react";
import { useListings } from "@/contexts/ListingsContext";
import { Listing } from "@/types/listings";
import { useSavedItems } from "@/contexts/SavedItemsContext";
import { useAuth } from "@/contexts/AuthContext";
import { useMessaging } from "@/contexts/MessagingContext";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import FlagListingDialog from "@/components/FlagListingDialog";
import SellerProfile from "@/components/SellerProfile";
import ImageDiagnosticButton from '@/components/ImageDiagnosticButton';
import ImageCarousel from '@/components/ImageCarousel';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from "@/lib/supabase";

const ProductDetail = () => {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const {
    getListing,
    incrementViews
  } = useListings();
  const {
    isSaved,
    addSavedItem,
    removeSavedItem
  } = useSavedItems();
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFlagDialogOpen, setIsFlagDialogOpen] = useState(false);
  const [isSellerProfileOpen, setIsSellerProfileOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const hasRunDiagnostics = useRef(false);
  const productFetched = useRef(false);
  const [productImages, setProductImages] = useState<string[]>([]);
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  useEffect(() => {
    const fetchProduct = async () => {
      if (productFetched.current) return;
      
      setIsLoading(true);
      if (!id) {
        setIsLoading(false);
        return;
      }
      
      const userListing = getListing(id);
      
      if (userListing) {
        if (!hasRunDiagnostics.current && process.env.NODE_ENV === 'development') {
          hasRunDiagnostics.current = true;
          console.log("=================== DIAGNOSTIC IMAGE LOADING ===================");
          console.log(`Product ID: ${id}`);
          console.log("Found listing with raw image URL:", userListing.image || userListing.image_url);
          console.log("Additional images:", userListing.additionalImages || userListing.additional_images);
          console.log("Seller avatar:", userListing.sellerAvatar);
        }
        
        const productData = {
          ...userListing,
          image: userListing.image || userListing.image_url,
          category: userListing.category || "Miscellaneous",
          condition: userListing.condition || "Not specified",
          location: userListing.location || "University of Toronto",
          shipping: userListing.shipping || false,
          contactMethod: userListing.contactMethod || userListing.contactMethod || "email",
          contactInfo: userListing.contactInfo || userListing.contactInfo || "No contact information provided"
        };
        
        setProduct(productData);
        
        // Create an array to track unique images to prevent duplicates
        const images: string[] = [];
        const uniqueUrls = new Set<string>();
        
        // Add main image if it exists and is not null/undefined
        if (productData.image && 
            productData.image !== "null" && 
            productData.image !== "undefined") {
          images.push(productData.image);
          uniqueUrls.add(productData.image);
        }
        
        // Add additional images if they exist, preventing duplicates
        if (productData.additionalImages && Array.isArray(productData.additionalImages) && productData.additionalImages.length > 0) {
          productData.additionalImages.forEach((img: string) => {
            if (img && img !== "null" && img !== "undefined" && img.trim() !== '' && !uniqueUrls.has(img)) {
              images.push(img);
              uniqueUrls.add(img);
            }
          });
        } else if (productData.additional_images && Array.isArray(productData.additional_images) && productData.additional_images.length > 0) {
          productData.additional_images.forEach((img: string) => {
            if (img && img !== "null" && img !== "undefined" && img.trim() !== '' && !uniqueUrls.has(img)) {
              images.push(img);
              uniqueUrls.add(img);
            }
          });
        }
        
        if (process.env.NODE_ENV === 'development') {
          console.log("All product images (deduplicated):", images);
        }
        
        if (images.length === 0) {
          images.push("/placeholder.svg");
        }
        
        setProductImages(images);
        
        incrementViews(id);
        setIsLoading(false);
        productFetched.current = true;
        return;
      }
      
      const mockProducts = [{
        id: "1",
        title: "Calculus Textbook",
        price: 45,
        description: "MAT137 Calculus textbook, slightly used with no markings. Great condition, all pages intact. This is the latest edition required for the current semester. Save money compared to the bookstore price!",
        image: "/placeholder.svg",
        seller: "Alice Chen",
        postedTime: "2023-09-15",
        condition: "Like New",
        category: "textbooks",
        location: "St. George Campus",
        contactMethod: "email",
        contactInfo: "alice.chen@mail.utoronto.ca",
        shipping: false
      }, {
        id: "2",
        title: "MacBook Pro 2021",
        price: 1200,
        description: "M1 MacBook Pro with 16GB RAM and 512GB SSD. Perfect condition, barely used. Comes with original box and charger. Battery cycle count is under 50. Great for CS or engineering students!",
        image: "/placeholder.svg",
        seller: "John Smith",
        postedTime: "2023-10-01",
        condition: "Excellent",
        category: "electronics",
        location: "Bahen Centre",
        contactMethod: "phone",
        contactInfo: "416-555-1234",
        shipping: true
      }, {
        id: "3",
        title: "Room for Rent",
        price: 850,
        description: "Private room in 3-bedroom apartment near campus. Available immediately. Utilities and internet included. 5-minute walk to campus. Shared kitchen and bathroom. Laundry in building. No pets.",
        image: "/placeholder.svg",
        seller: "Maria Garcia",
        postedTime: "2023-10-05",
        condition: "N/A",
        category: "housing",
        location: "College & Spadina",
        contactMethod: "email",
        contactInfo: "maria.g@mail.utoronto.ca",
        shipping: false
      }, {
        id: "4",
        title: "Physics Tutoring",
        price: 30,
        description: "PHY131/PHY132 tutoring from a 4th year Physics major. $30/hour. Flexible scheduling. Can meet on campus or online. Strong track record of helping students improve their grades.",
        image: "/placeholder.svg",
        seller: "David Kim",
        postedTime: "2023-09-28",
        condition: "N/A",
        category: "academic-services",
        location: "Robarts Library",
        contactMethod: "message",
        contactInfo: "@david_kim",
        shipping: false
      }];
      
      const mockProduct = mockProducts.find(p => p.id === id);
      if (mockProduct) {
        setProduct(mockProduct);
        setProductImages([mockProduct.image]);
      } else {
        toast.error("Product not found", {
          description: "The product you're looking for doesn't exist or has been removed."
        });
      }
      
      setIsLoading(false);
      productFetched.current = true;
    };
    
    fetchProduct();
  }, [id, getListing, incrementViews]);
  
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, {
        addSuffix: true
      });
    } catch (e) {
      return dateString;
    }
  };
  
  const handleToggleSave = () => {
    if (!product || !id) return;
    if (isSaved(product.id)) {
      removeSavedItem(id);
      toast.success("Removed from saved items", {
        description: "This item has been removed from your saved items."
      });
    } else {
      addSavedItem({
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.image || "/placeholder.svg",
        seller: product.seller
      });
      toast.success("Saved!", {
        description: "This item has been added to your saved items."
      });
    }
  };
  
  const handleFlagClick = () => {
    setIsFlagDialogOpen(true);
  };
  
  const handleViewSellerProfile = () => {
    setIsSellerProfileOpen(true);
  };

  const handleMessageSeller = async () => {
    if (!user) {
      toast.error("Please sign in to message sellers");
      navigate("/auth");
      return;
    }

    if (!product || !product.seller_id) {
      toast.error("Unable to message seller");
      return;
    }

    if (user.id === product.seller_id) {
      toast.error("You cannot message yourself");
      return;
    }

    // Check if conversation already exists using the new schema
    // Find conversations for this listing between these two users
    const { data: existingConversations, error } = await supabase
      .from('conversations')
      .select('id')
      .eq('listing_id', product.id)
      .or(`and(user1_id.eq.${user.id},user2_id.eq.${product.seller_id}),and(user1_id.eq.${product.seller_id},user2_id.eq.${user.id})`);

    if (error) {
      console.error('Error checking for existing conversation:', error);
      // Fall back to creating new conversation
    } else if (existingConversations && existingConversations.length > 0) {
      const conversation = existingConversations[0]; // Should only be one conversation between two users for a listing
      
      // Found existing conversation - navigate directly to it
      toast.success("Opening existing conversation...");
      
      navigate("/messages", {
        state: {
          conversationId: conversation.id,
          listingTitle: product.title
        }
      });
      return;
    }

    // No existing conversation found - create new one via pending conversation
    const defaultMessage = `Hi! I'm interested in your "${product.title}" listing.`;
    
    navigate("/messages", {
      state: {
        pendingConversation: {
          sellerId: product.seller_id,
          sellerName: product.seller?.name || 'Seller',
          sellerAvatar: product.seller?.avatar_url,
          listingId: product.id,
          listingTitle: product.title,
          defaultMessage
        }
      }
    });
  };
  
  const handleImageError = () => {
    if (process.env.NODE_ENV === 'development') {
      console.log("Image error occurred");
    }
    
    setImageError(true);
  };
  
  const getContactMethodIcon = () => {
    const method = product?.contactMethod?.toLowerCase() || '';
    if (method === 'email') return <Mail className="h-5 w-5 text-gray-600 mr-2" />;
    if (method === 'phone') return <Phone className="h-5 w-5 text-gray-600 mr-2" />;
    return <User className="h-5 w-5 text-gray-600 mr-2" />;
  };
  
  if (isLoading) {
    return <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-12">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="flex flex-col md:flex-row gap-8">
              <div className="w-full md:w-1/2 h-96 bg-gray-200 rounded-md"></div>
              <div className="w-full md:w-1/2 space-y-4">
                <div className="h-8 bg-gray-200 rounded"></div>
                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 my-6"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                <div className="h-10 bg-gray-200 rounded w-full mt-6"></div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>;
  }
  
  if (!product) {
    return <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-12 flex flex-col items-center justify-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <p className="text-gray-600 mb-8">The product you're looking for doesn't exist or has been removed.</p>
          <Button asChild>
            <Link to="/products">Browse Products</Link>
          </Button>
        </main>
        <Footer />
      </div>;
  }
  
  return <div className="min-h-screen flex flex-col my-[40px]">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" asChild className="hover:bg-transparent pl-0 py-[44px]">
            <Link to="/products" className="flex items-center text-gray-600 hover:text-gray-900">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Products
            </Link>
          </Button>
        </div>
        
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/2">
            <div className="bg-white rounded-lg overflow-hidden border h-96 flex items-center justify-center relative">
              {productImages.length > 0 ? (
                <ImageCarousel 
                  images={productImages} 
                  alt={product?.title || "Product images"} 
                  className="h-full w-full"
                  onImageError={handleImageError}
                />
              ) : (
                <div className="h-10 w-10 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin"></div>
              )}
            </div>
            {product?.image && <div className="mt-2 flex justify-end">
                <ImageDiagnosticButton imageUrl={product.image} />
              </div>}
              
            {/* Moved Tabs section here */}
            <Tabs defaultValue="shipping" className="mt-6">
              <TabsList className="mb-4">
                <TabsTrigger value="shipping">Shipping & Pickup</TabsTrigger>
                <TabsTrigger value="payment">Payment Options</TabsTrigger>
              </TabsList>
              
              <TabsContent value="shipping" className="bg-white p-6 rounded-lg border">
                <h2 className="text-lg font-semibold mb-3">Shipping & Pickup Options</h2>
                <div className="space-y-4">
                  <div className="p-3 border rounded-md flex items-start">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-3 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium">Campus Pickup</h3>
                      <p className="text-sm text-gray-600">Meet at the specified campus location: {product.location}</p>
                    </div>
                  </div>
                  
                  <div className="p-3 border rounded-md flex items-start">
                    {product.shipping ? <>
                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-3 mt-0.5">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-medium">Shipping Available</h3>
                          <p className="text-sm text-gray-600">Seller offers shipping. Contact them for details and shipping costs.</p>
                        </div>
                      </> : <>
                        <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center text-red-600 mr-3 mt-0.5">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-medium">Shipping</h3>
                          <p className="text-sm text-gray-600">No shipping available for this item. Local pickup only.</p>
                        </div>
                      </>}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="payment" className="bg-white p-6 rounded-lg border">
                <h2 className="text-lg font-semibold mb-3">Accepted Payment Methods</h2>
                <div className="space-y-4">
                  {product.paymentMethods && product.paymentMethods.includes("cash") && <div className="p-3 border rounded-md flex items-start">
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-3 mt-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium">Cash</h3>
                        <p className="text-sm text-gray-600">Pay in cash when meeting in person</p>
                      </div>
                    </div>}
                  
                  {product.paymentMethods && product.paymentMethods.includes("e-transfer") && <div className="p-3 border rounded-md flex items-start">
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-3 mt-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium">E-Transfer</h3>
                        <p className="text-sm text-gray-600">Send electronic transfer to seller's account</p>
                      </div>
                    </div>}
                  
                  {product.paymentMethods && product.paymentMethods.includes("paypal") && <div className="p-3 border rounded-md flex items-start">
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-3 mt-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium">PayPal</h3>
                        <p className="text-sm text-gray-600">Send payment via PayPal</p>
                      </div>
                    </div>}
                  
                  {(!product.paymentMethods || product.paymentMethods.length === 0) && <div className="p-3 border rounded-md flex items-start">
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-3 mt-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium">Cash</h3>
                        <p className="text-sm text-gray-600">Pay in cash when meeting in person</p>
                      </div>
                    </div>}
                  
                  <div className="p-4 bg-yellow-50 rounded-md text-sm mt-4">
                    <p className="font-medium text-yellow-800">Payment Safety Tips:</p>
                    <ul className="list-disc ml-5 mt-2 text-yellow-800">
                      <li>Always verify the product before making payment</li>
                      <li>Use secure payment methods when possible</li>
                      <li>Get a receipt for cash transactions</li>
                      <li>Meet in public, well-lit places for exchanges</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="w-full md:w-1/2">
            <div className="bg-white p-6 rounded-lg border">
              <div className="flex justify-between items-start">
                <h1 className="text-2xl font-bold mb-2">{product?.title}</h1>
                <div className="flex space-x-2">
                  <Button variant="outline" size="icon" className={isSaved(product?.id) ? "text-red-500 border-red-200" : ""} onClick={handleToggleSave}>
                    <HeartIcon className="h-5 w-5" fill={isSaved(product?.id) ? "currentColor" : "none"} />
                    <span className="sr-only">{isSaved(product?.id) ? "Unsave" : "Save"}</span>
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleFlagClick}>
                    <Flag className="h-5 w-5" />
                    <span className="sr-only">Flag</span>
                  </Button>
                </div>
              </div>
              
              <div className="text-2xl font-bold text-toronto-blue mt-2">${product?.price.toFixed(2)}</div>
              
              <div className="flex flex-wrap gap-2 items-center mt-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>Posted {formatDate(product?.postedTime)}</span>
                </div>
                <span>•</span>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{product?.location}</span>
                </div>
                <span>•</span>
                <div className="flex items-center">
                  <TagIcon className="h-4 w-4 mr-1" />
                  <span>{product?.category.charAt(0).toUpperCase() + product?.category.slice(1)}</span>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-4">
                <div>
                  <h2 className="font-semibold">Seller</h2>
                  <div className="flex items-center mt-1">
                    <Avatar className="w-10 h-10 mr-3">
                      {product.sellerAvatar ? (
                        <AvatarImage src={product.sellerAvatar} alt={product.seller} />
                      ) : null}
                      <AvatarFallback className="bg-gray-200 text-gray-600">
                        {product.seller.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium">{product.seller}</div>
                      <div className="text-sm text-gray-500">UofT Verified</div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleMessageSeller}
                        disabled={user?.id === product.seller_id}
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        <span>{user?.id === product.seller_id ? "Your Item" : "Message"}</span>
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleViewSellerProfile}>
                        <User className="h-4 w-4 mr-1" />
                        <span>View Profile</span>
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h2 className="font-semibold">Condition</h2>
                  <p>{product.condition}</p>
                </div>
                
                <Separator />
                
                <div>
                  <h2 className="font-semibold">Description</h2>
                  <p className="text-gray-700 whitespace-pre-wrap">{product.description}</p>
                </div>
              </div>
              
              <div className="mt-6 space-y-4">
                <div className="flex gap-3">
                  <Button 
                    onClick={handleMessageSeller} 
                    className="flex-1"
                    disabled={user?.id === product.seller_id}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    {user?.id === product.seller_id ? "Your Listing" : "Message Seller"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleViewSellerProfile}
                    className="px-3"
                  >
                    <User className="h-4 w-4" />
                  </Button>
                </div>

                <div className="bg-gray-50 p-4 rounded-md">
                  <h2 className="font-semibold mb-2">Contact Information</h2>
                  <div className="flex items-center bg-white p-3 rounded-md border">
                    {getContactMethodIcon()}
                    <div>
                      <div className="text-sm font-medium">
                        {product.contactMethod === 'email' ? 'Email' : product.contactMethod === 'phone' ? 'Phone' : 'Contact Method'}
                      </div>
                      <div className="text-gray-700 break-all">
                        {product.contactInfo || "No contact information provided"}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    You can also contact the seller directly using the information above.
                  </p>
                </div>
              </div>
              
              <div className="flex items-center mt-6 bg-blue-50 p-3 rounded-md text-sm">
                <Shield className="h-5 w-5 text-blue-500 mr-2" />
                <div>
                  <span className="font-medium">UofT Market Protection:</span> Always meet in public places and inspect items before payment
                </div>
              </div>
            </div>
          </div>
        </div>
        
        
        {isFlagDialogOpen && <FlagListingDialog listingId={product.id} isOpen={isFlagDialogOpen} onClose={() => setIsFlagDialogOpen(false)} />}
        
        {isSellerProfileOpen && <SellerProfile seller={product.seller} isOpen={isSellerProfileOpen} onClose={() => setIsSellerProfileOpen(false)} />}
      </main>
      
      <Footer />
    </div>;
};

export default ProductDetail;
