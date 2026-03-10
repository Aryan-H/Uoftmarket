import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Star, MapPin, Clock, Shield, GraduationCap, CalendarDays, Trash2 } from "lucide-react";
import { useListings } from "@/contexts/ListingsContext";
import { formatDistanceToNow } from "date-fns";
import ProductCard from "@/components/ProductCard";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import SupabaseImage from "@/components/SupabaseImage";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Review {
  id: string;
  rating: number;
  comment: string;
  reviewer: string;
  date: string;
  isUserReview?: boolean;
}

interface SellerProfileProps {
  seller: string;
  isOpen: boolean;
  onClose: () => void;
}

const SellerProfile = ({ seller, isOpen, onClose }: SellerProfileProps) => {
  const { getSellerListings } = useListings();
  const { user } = useAuth();
  const { toast } = useToast();
  const sellerListings = getSellerListings(seller);
  const [activeTab, setActiveTab] = useState<"listings" | "reviews">("listings");
  const [currentPage, setCurrentPage] = useState(1);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [hasInteractedWithSeller, setHasInteractedWithSeller] = useState(false);
  const [sellerUserData, setSellerUserData] = useState<any>(null);
  const [isLoadingSellerData, setIsLoadingSellerData] = useState(true);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [sellerUserId, setSellerUserId] = useState<string | null>(null);
  const [hasRatedSeller, setHasRatedSeller] = useState(false);
  const [deleteReviewId, setDeleteReviewId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [sellerData, setSellerData] = useState({
    name: seller,
    joinedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    location: "University of Toronto",
    rating: 0,
    reviewCount: 0,
    verified: true
  });
  
  useEffect(() => {
    const fetchSellerData = async () => {
      setIsLoadingSellerData(true);
      
      try {
        if (isSupabaseConfigured()) {
          const { data: profileData, error: profileError } = await supabase
            .from('public_profiles')
            .select('id')
            .eq('name', seller)
            .limit(1)
            .maybeSingle();
            
          if (profileError) {
            console.error("Error fetching seller profile by name:", profileError);
          }
          
          let sellerId = null;
          
          if (profileData && profileData.id) {
            sellerId = profileData.id;
            setSellerUserId(sellerId);
            
            const profileResult = await supabase
              .from('public_profiles')
              .select('*')
              .eq('id', sellerId)
              .maybeSingle();
              
            const { data: profileDetailData, error } = profileResult;
            
            if (error) {
              console.error("Error fetching seller profile details:", error);
            }
            
            if (profileDetailData) {
              console.log("Found seller profile:", profileDetailData);
              setSellerUserData(profileDetailData);
              
              type QueryResult = { data: any | null, error: any | null };
              
              const accountAgeResults: QueryResult[] = await Promise.all([
                supabase
                  .from('listings')
                  .select('posted_at')
                  .eq('seller_id', sellerId)
                  .order('posted_at', { ascending: true })
                  .limit(1)
                  .maybeSingle(),
                
                supabase
                  .from('ratings')
                  .select('created_at')
                  .eq('reviewer_id', sellerId)
                  .order('created_at', { ascending: true })
                  .limit(1)
                  .maybeSingle(),
                  
                supabase
                  .from('ratings')
                  .select('created_at')
                  .eq('seller_id', sellerId)
                  .order('created_at', { ascending: true })
                  .limit(1)
                  .maybeSingle()
              ]);
              
              const dates = accountAgeResults
                .filter(result => !result.error && result.data)
                .map(result => {
                  const data = result.data;
                  if (data && 'posted_at' in data) {
                    return data.posted_at;
                  } else if (data && 'created_at' in data) {
                    return data.created_at;
                  }
                  return null;
                })
                .filter(date => date !== null) as string[];
              
              const earliestActivityDate = dates.length > 0
                ? new Date(Math.min(...dates.map(date => new Date(date).getTime())))
                : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
              
              setSellerData(prev => ({
                ...prev,
                joinedDate: earliestActivityDate.toISOString()
              }));
              
              const { data: ratingData, error: ratingError } = await supabase
                .rpc('get_seller_rating', { seller_uuid: sellerId });
                  
              if (ratingError) {
                console.error("Error fetching seller rating:", ratingError);
              } else if (ratingData && ratingData.length > 0) {
                const averageRating = parseFloat(ratingData[0].average_rating.toString()) || 0;
                const reviewCount = typeof ratingData[0].review_count === 'string' 
                  ? parseInt(ratingData[0].review_count) 
                  : Number(ratingData[0].review_count) || 0;
                
                setSellerData(prev => ({
                  ...prev,
                  rating: averageRating,
                  reviewCount: reviewCount
                }));
              }
            } else {
              console.log("No profile found for seller:", seller);
              setSellerUserData({
                program: "Not specified",
                year: "Not specified",
                bio: "No bio available.",
                hasCompletedSetup: true
              });
            }
          } else {
            console.log("No profile found with name:", seller);
            setSellerUserData({
              program: "Not specified",
              year: "Not specified",
              bio: "No bio available.",
              hasCompletedSetup: true
            });
          }
        }
      } catch (error) {
        console.error("Error fetching seller data:", error);
        setSellerUserData({
          program: "Not specified",
          year: "Not specified",
          bio: "No bio available.",
          hasCompletedSetup: true
        });
      } finally {
        setIsLoadingSellerData(false);
      }
    };
    
    if (isOpen) {
      fetchSellerData();
    }
  }, [seller, isOpen]);
  
  useEffect(() => {
    const fetchReviews = async () => {
      if (!sellerUserId) return;
      
      setIsLoadingReviews(true);
      
      try {
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('ratings')
          .select(`
            id,
            rating,
            comment,
            created_at,
            reviewer_id,
            profiles!reviewer_id(name)
          `)
          .eq('seller_id', sellerUserId)
          .order('created_at', { ascending: false });
          
        if (reviewsError) {
          console.error("Error fetching reviews:", reviewsError);
          return;
        }
        
        if (reviewsData) {
          console.log("Fetched reviews:", reviewsData);
          
          const formattedReviews = reviewsData.map(review => ({
            id: review.id,
            rating: review.rating,
            comment: review.comment || "",
            reviewer: review.profiles?.name || "Anonymous User",
            date: review.created_at,
            isUserReview: user ? user.id === review.reviewer_id : false
          }));
          
          setReviews(formattedReviews);
          
          if (user) {
            const { data: existingRating, error: ratingCheckError } = await supabase
              .from('ratings')
              .select('id, rating, comment')
              .eq('seller_id', sellerUserId)
              .eq('reviewer_id', user.id)
              .maybeSingle();
              
            if (!ratingCheckError && existingRating) {
              setHasRatedSeller(true);
              setUserRating(existingRating.rating);
              setRatingComment(existingRating.comment || "");
            } else {
              setHasRatedSeller(false);
            }
          }
        }
      } catch (error) {
        console.error("Error in fetchReviews:", error);
      } finally {
        setIsLoadingReviews(false);
      }
    };
    
    if (isOpen && sellerUserId) {
      fetchReviews();
    }
  }, [sellerUserId, isOpen, user]);
  
  useEffect(() => {
    if (user && sellerUserId && user.id !== sellerUserId) {
      setHasInteractedWithSeller(true);
    } else {
      setHasInteractedWithSeller(false);
    }
  }, [user, sellerUserId]);
  
  const itemsPerPage = 5;
  const totalPages = Math.ceil(reviews.length / itemsPerPage);
  
  const paginatedReviews = reviews.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const formatJoinDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return "Recently";
    }
  };
  
  const handleRatingSubmit = async () => {
    if (userRating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a rating before submitting.",
        variant: "destructive"
      });
      return;
    }
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to rate this seller.",
        variant: "destructive"
      });
      return;
    }
    
    if (!sellerUserId) {
      toast({
        title: "Seller not found",
        description: "Unable to submit rating at this time.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      let ratingResult;
      
      if (hasRatedSeller) {
        const { data, error } = await supabase
          .from('ratings')
          .update({
            rating: userRating,
            comment: ratingComment
          })
          .eq('seller_id', sellerUserId)
          .eq('reviewer_id', user.id);
          
        if (error) {
          console.error("Error updating rating:", error);
          toast({
            title: "Error updating rating",
            description: "There was a problem updating your rating.",
            variant: "destructive"
          });
          return;
        }
        
        toast({
          title: "Rating updated!",
          description: "Your rating has been updated successfully.",
        });
        
        ratingResult = { updated: true };
      } else {
        const { data, error } = await supabase
          .from('ratings')
          .insert({
            seller_id: sellerUserId,
            reviewer_id: user.id,
            rating: userRating,
            comment: ratingComment
          })
          .select();
          
        if (error) {
          console.error("Error submitting rating:", error);
          toast({
            title: "Error submitting rating",
            description: "There was a problem submitting your rating.",
            variant: "destructive"
          });
          return;
        }
        
        toast({
          title: "Rating submitted!",
          description: "Thank you for rating this seller.",
        });
        
        ratingResult = { inserted: true, data };
      }
      
      const { data: ratingData, error: ratingError } = await supabase
        .rpc('get_seller_rating', { seller_uuid: sellerUserId });
        
      if (!ratingError && ratingData && ratingData.length > 0) {
        const averageRating = parseFloat(ratingData[0].average_rating.toString()) || 0;
        const reviewCount = typeof ratingData[0].review_count === 'string' 
          ? parseInt(ratingData[0].review_count) 
          : Number(ratingData[0].review_count) || 0;
        
        setSellerData(prev => ({
          ...prev,
          rating: averageRating,
          reviewCount: reviewCount
        }));
      }
      
      const newReview: Review = {
        id: `new-${Date.now()}`,
        rating: userRating,
        comment: ratingComment,
        reviewer: user.name || "You",
        date: new Date().toISOString(),
        isUserReview: true
      };
      
      if (hasRatedSeller) {
        setReviews(prev => 
          prev.map(review => 
            review.isUserReview ? 
              { ...review, rating: userRating, comment: ratingComment, date: new Date().toISOString() } : 
              review
          )
        );
      } else {
        setReviews(prev => [newReview, ...prev]);
      }
      
      setHasRatedSeller(true);
      setShowRatingForm(false);
    } catch (error) {
      console.error("Error in handleRatingSubmit:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteRating = async () => {
    if (!user || !deleteReviewId || !sellerUserId) {
      toast({
        title: "Error",
        description: "Unable to delete review at this time.",
        variant: "destructive"
      });
      return;
    }
    
    setIsDeleting(true);
    
    try {
      const { error } = await supabase
        .from('ratings')
        .delete()
        .eq('id', deleteReviewId)
        .eq('reviewer_id', user.id);
        
      if (error) {
        console.error("Error deleting rating:", error);
        toast({
          title: "Error deleting review",
          description: "There was a problem deleting your review.",
          variant: "destructive"
        });
        return;
      }
      
      setReviews(reviews.filter(review => review.id !== deleteReviewId));
      setHasRatedSeller(false);
      setUserRating(0);
      setRatingComment("");
      
      const { data: ratingData, error: ratingError } = await supabase
        .rpc('get_seller_rating', { seller_uuid: sellerUserId });
        
      if (!ratingError && ratingData && ratingData.length > 0) {
        const averageRating = parseFloat(ratingData[0].average_rating.toString()) || 0;
        const reviewCount = typeof ratingData[0].review_count === 'string' 
          ? parseInt(ratingData[0].review_count) 
          : Number(ratingData[0].review_count) || 0;
        
        setSellerData(prev => ({
          ...prev,
          rating: averageRating,
          reviewCount: reviewCount
        }));
      } else {
        setSellerData(prev => ({
          ...prev,
          rating: 0,
          reviewCount: 0
        }));
      }
      
      toast({
        title: "Review deleted",
        description: "Your review has been successfully deleted.",
      });
      
    } catch (error) {
      console.error("Error in handleDeleteRating:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setDeleteReviewId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Seller Profile</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-4">
                <Avatar className="h-16 w-16">
                  {sellerUserData?.avatar_url ? (
                    <AvatarImage 
                      src={sellerUserData.avatar_url} 
                      alt={sellerData.name}
                      className="object-cover"
                    />
                  ) : null}
                  <AvatarFallback className="text-xl font-semibold">
                    {seller.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <h2 className="text-xl font-semibold">{sellerData.name}</h2>
                  
                  <div className="flex items-center mt-1 text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>Member {formatJoinDate(sellerData.joinedDate)}</span>
                  </div>
                  
                  <div className="flex items-center mt-1 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>{sellerData.location}</span>
                  </div>
                  
                  {sellerUserData && (
                    <>
                      {sellerUserData.program && (
                        <div className="flex items-center mt-1 text-sm text-gray-600">
                          <GraduationCap className="w-4 h-4 mr-1" />
                          <span>Program: {sellerUserData.program}</span>
                        </div>
                      )}
                      
                      {sellerUserData.year && (
                        <div className="flex items-center mt-1 text-sm text-gray-600">
                          <CalendarDays className="w-4 h-4 mr-1" />
                          <span>Year: {sellerUserData.year}</span>
                        </div>
                      )}
                    </>
                  )}
                  
                  <div className="flex items-center mt-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className="w-4 h-4" 
                          fill={i < Math.round(sellerData.rating) ? "gold" : "none"} 
                          stroke={i < Math.round(sellerData.rating) ? "gold" : "currentColor"}
                        />
                      ))}
                    </div>
                    <span className="ml-2 text-sm font-medium">
                      {sellerData.rating > 0 
                        ? `${sellerData.rating.toFixed(1)} stars (${sellerData.reviewCount} ${sellerData.reviewCount === 1 ? 'review' : 'reviews'})` 
                        : 'No reviews yet'}
                    </span>
                  </div>
                  
                  {sellerData.verified && (
                    <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <Shield className="w-3 h-3 mr-1" />
                      Verified UofT Seller
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {sellerUserData && sellerUserData.bio && (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <h3 className="text-sm font-medium mb-2">About Me</h3>
                <p className="text-sm text-gray-700">{sellerUserData.bio}</p>
              </CardContent>
            </Card>
          )}
          
          <div className="flex space-x-2 mb-6">
            <Button 
              variant={activeTab === "listings" ? "default" : "outline"}
              onClick={() => setActiveTab("listings")}
              className="flex-1 sm:flex-none"
            >
              Listings ({sellerListings.length})
            </Button>
            <Button 
              variant={activeTab === "reviews" ? "default" : "outline"}
              onClick={() => setActiveTab("reviews")}
              className="flex-1 sm:flex-none"
            >
              Reviews ({sellerData.reviewCount})
            </Button>
          </div>
          
          <div className="space-y-4">
            {activeTab === "listings" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Seller's Listings</h3>
                </div>
                
                {sellerListings.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sellerListings.map((listing) => (
                      <ProductCard 
                        key={listing.id}
                        id={listing.id}
                        title={listing.title}
                        price={listing.price}
                        image={listing.image}
                        seller={listing.seller}
                        category={listing.category || "miscellaneous"}
                        condition={listing.condition || "Not specified"}
                        postedTime={listing.postedTime}
                        location={listing.location || "University of Toronto"}
                      />
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-gray-500">This seller has no active listings.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
            
            {activeTab === "reviews" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Reviews ({sellerData.reviewCount})</h3>
                  {hasInteractedWithSeller && !showRatingForm && user && (
                    <Button onClick={() => setShowRatingForm(true)}>
                      {hasRatedSeller ? "Update Your Rating" : "Rate this Seller"}
                    </Button>
                  )}
                  {!user && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button>Rate this Seller</Button>
                      </PopoverTrigger>
                      <PopoverContent>
                        <p className="text-sm">Please sign in to rate sellers.</p>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
                
                {showRatingForm && (
                  <Card className="mb-6">
                    <CardContent className="pt-6">
                      <h4 className="font-medium mb-3">Rate Your Experience</h4>
                      
                      <div className="flex mb-3">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <Star 
                            key={rating}
                            className="w-8 h-8 cursor-pointer mr-1"
                            onClick={() => setUserRating(rating)}
                            onMouseEnter={() => setHoveredRating(rating)}
                            onMouseLeave={() => setHoveredRating(0)}
                            fill={(hoveredRating || userRating) >= rating ? "gold" : "none"}
                            stroke={(hoveredRating || userRating) >= rating ? "gold" : "currentColor"}
                          />
                        ))}
                      </div>
                      
                      <Textarea 
                        placeholder="Share your experience with this seller..." 
                        className="mb-3 resize-none"
                        value={ratingComment}
                        onChange={(e) => setRatingComment(e.target.value)}
                        rows={4}
                      />
                      
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowRatingForm(false)}>Cancel</Button>
                        <Button onClick={handleRatingSubmit}>Submit Rating</Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {isLoadingReviews ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-2 border-primary rounded-full border-t-transparent"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {paginatedReviews.length > 0 ? (
                      paginatedReviews.map((review) => (
                        <Card key={review.id}>
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center mb-2">
                                  <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                      <Star 
                                        key={i} 
                                        className="w-4 h-4" 
                                        fill={i < review.rating ? "gold" : "none"} 
                                        stroke={i < review.rating ? "gold" : "currentColor"}
                                      />
                                    ))}
                                  </div>
                                  <span className="ml-2 text-sm font-medium">
                                    {review.reviewer}
                                    {review.isUserReview && (
                                      <span className="ml-1 text-xs text-muted-foreground">(You)</span>
                                    )}
                                  </span>
                                </div>
                                <p className="text-sm">{review.comment}</p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500">
                                  {formatDistanceToNow(new Date(review.date), { addSuffix: true })}
                                </span>
                                
                                {review.isUserReview && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-destructive hover:text-destructive/80"
                                        onClick={() => setDeleteReviewId(review.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Review</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete your review? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel onClick={() => setDeleteReviewId(null)}>
                                          Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction 
                                          onClick={handleDeleteRating}
                                          disabled={isDeleting}
                                        >
                                          {isDeleting ? (
                                            <>
                                              <span className="animate-spin mr-2">⏳</span>
                                              Deleting...
                                            </>
                                          ) : 'Delete'}
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <Card>
                        <CardContent className="pt-6 text-center">
                          <p className="text-gray-500">This seller has no reviews yet.</p>
                          {hasInteractedWithSeller && user && !showRatingForm && (
                            <Button 
                              variant="outline" 
                              className="mt-2"
                              onClick={() => setShowRatingForm(true)}
                            >
                              Be the first to leave a review
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
                
                {totalPages > 1 && (
                  <Pagination className="mt-6">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      
                      {[...Array(totalPages)].map((_, i) => (
                        <PaginationItem key={i}>
                          <PaginationLink 
                            isActive={currentPage === i + 1}
                            onClick={() => setCurrentPage(i + 1)}
                          >
                            {i + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SellerProfile;
