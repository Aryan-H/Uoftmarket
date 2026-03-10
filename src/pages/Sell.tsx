import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useListings } from "@/contexts/ListingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { uploadImagePreservingFormat } from "@/utils/imageUtils";
import ImageUpload from "@/components/ImageUpload";
import { supabase } from "@/lib/supabase";

const CATEGORIES = [
  { id: 'textbooks', name: 'Textbooks' },
  { id: 'electronics', name: 'Electronics' },
  { id: 'housing', name: 'Housing' },
  { id: 'furniture', name: 'Furniture' },
  { id: 'transportation', name: 'Transportation' },
  { id: 'academic-services', name: 'Academic Services' },
  { id: 'miscellaneous', name: 'Miscellaneous' }
];

const Sell = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addListing } = useListings();
  const { user, isAuthenticated } = useAuth();
  console.log(user);

  const searchParams = new URLSearchParams(location.search);
  const isRequestMode = searchParams.get('request') === 'true';
  const fulfillRequestId = searchParams.get('fulfillRequest');

  // Local state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);

  // Form fields
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [description, setDescription] = useState("");
  const [meetupLocation, setMeetupLocation] = useState("");
  const [contactMethod, setContactMethod] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [shipping, setShipping] = useState(false);

  // Used to display the request owner’s name when fulfilling a request
  const [requestOwner, setRequestOwner] = useState<string | null>(null);

  // Page title and initial data load
  useEffect(() => {
    if (isRequestMode) {
      document.title = "Create Request | UofT Market";
    } else if (fulfillRequestId) {
      document.title = "Fulfill Request | UofT Market";
      fetchRequestDetails(fulfillRequestId);
    } else {
      document.title = "Sell Item | UofT Market";
    }
  }, [isRequestMode, fulfillRequestId]);

  // If we have a fulfillRequestId, fetch the request info (title, description, etc.)
  const fetchRequestDetails = async (requestId: string) => {
    try {
      const { data: requestData, error: requestError } = await supabase
        .from('requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (requestError) {
        throw requestError;
      }

      console.log(requestData);
      if (requestData) {
        // Populate fields if any data is present
        setTitle(requestData.title || "");
        setDescription(requestData.description || "");
        setCategory(requestData.category || "");
        setPrice(requestData.budget ? String(requestData.budget) : "");

        // Optionally fetch request owner
        if (requestData.user_id) {
          const { data: profileData, error: profileError } = await supabase
            .from('public_profiles')
            .select('name')
            .eq('id', requestData.user_id)
            .single();

          if (!profileError && profileData) {
            setRequestOwner(profileData.name);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching request details:', error);
    }
  };

  // Payment methods toggle
  const handlePaymentMethodChange = (method: string) => {
    setPaymentMethods(prev => {
      if (prev.includes(method)) {
        return prev.filter(m => m !== method);
      } else {
        return [...prev, method];
      }
    });
  };

  // Upload all images and return their URLs
  const uploadImages = async () => {
    if (!user || images.length === 0) return [];

    setUploadingImages(true);
    const uploadedImageUrls: string[] = [];

    try {
      for (const image of images) {
        if (!image.file) continue;

        const imageUrl = await uploadImagePreservingFormat('listing-images', user.id, image.file);
        if (!imageUrl) {
          console.error('Failed to upload image:', image.file.name);
          throw new Error(`Failed to upload image: ${image.file.name}`);
        }
        uploadedImageUrls.push(imageUrl);
      }
      return uploadedImageUrls;
    } catch (error) {
      console.error('Error in uploadImages:', error);
      toast.error("Image upload failed", {
        description: error instanceof Error ? error.message : "Unknown error during upload"
      });
      throw error;
    } finally {
      setUploadingImages(false);
    }
  };

  // Main form submit: either create a new request or create a new listing
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Check authentication
    if (!user || !isAuthenticated) {
      toast.error("Authentication required", {
        description: "You need to be logged in to continue."
      });
      navigate('/auth');
      return;
    }

    const priceValue = parseFloat(price);

    // Basic validation
    if (!isRequestMode) {
      // Payment methods required for listings
      if (paymentMethods.length === 0) {
        toast.error("Payment methods required", {
          description: "Please select at least one payment method."
        });
        return;
      }

      if (!price || isNaN(priceValue) || priceValue < 0) {
        toast.error("Invalid Price", {
          description: "Please enter a valid price (a non-negative number).",
        });
        return;
      }

      // At least one image is required for listings
      if (images.length === 0) {
        toast.error("Images required", {
          description: "Please add at least one image of your item."
        });
        return;
      }
    }

    setIsSubmitting(true);
    console.log(isRequestMode)
    try {
      let newRecordId;

      // ============= CREATE REQUEST MODE =============
      if (isRequestMode) {
        if (price && (isNaN(priceValue) || priceValue < 0)) {
          toast.error("Invalid Budget", {
            description: "Please enter a valid budget (a non-negative number).",
          });
          return;
        }

        // Insert into the requests table
        const { data, error } = await supabase
          .from('requests')
          .insert([
            {
              title,
              description,
              budget: price ? parseFloat(price) : null,
              category,
              user_id: user.id,
              status: 'open'
            }
          ])
          .select();

        if (error) {
          console.error("Error creating request:", error);
          throw error;
        }

        if (data && data.length > 0) {
          console.log("bruh2")
          newRecordId = data[0].id;
        }
        else{
          console.log("bruh")
        }

        // ============= CREATE LISTING MODE =============
      } else {
        // Upload images and create new listing
        const imageUrls = await uploadImages();
        if (imageUrls.length === 0) {
          // Some error already shown to user
          setIsSubmitting(false);
          return;
        }

        const mainImageUrl = imageUrls[0];
        const additionalImages = imageUrls.slice(1);

        console.log("1", user.id);
        console.log("2", supabase);

        const { data: { user: authUser } } = await supabase.auth.getUser();
        // then use authUser.id in your insert call
        console.log(authUser.id)

        newRecordId = await addListing({
          title,
          price: parseFloat(price),
          image: mainImageUrl,
          seller: user.name,
          seller_id: user.id,
          category,
          condition,
          description,
          location: meetupLocation,
          contactMethod,
          contactInfo,
          paymentMethods,
          shipping,
          additionalImages
        });

        if (fulfillRequestId) {
          const { error: updateError } = await supabase
            .from('requests')
            .update({ 
              status: 'pending',                
              fulfilled_listing_id: newRecordId,
              fulfilled_by: user.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', fulfillRequestId);

          if (updateError) {
            console.error('Error updating request to pending:', updateError);
            // Even if this fails, the listing is created, so we proceed
          } else {
            toast.success("Request fulfillment started!", {
              description: requestOwner 
                ? `You have started fulfilling ${requestOwner}'s request. They will be notified to review your listing.`
                : "You have successfully started fulfilling the request."
            });
          }
        }
      }

      // Final success handling
      if (newRecordId) {
        const successMessage = isRequestMode ? "Request created!" : "Listing created!";
        const successDescription = isRequestMode 
          ? "Your request has been successfully posted on UofT Market."
          : "Your item has been successfully listed on UofT Market.";

        if(!fulfillRequestId){
          toast.success(successMessage, { description: successDescription });
        }

        // Navigate to requests page if it was a request; otherwise to product detail
        navigate(isRequestMode ? '/requests' : `/product/${newRecordId}`);
      } else {
        // If we get here with no ID, there's a submission problem
        toast.error(isRequestMode ? "Error creating request" : "Error creating listing", {
          description: "There was a problem with your submission. Please try again."
        });
      }
    } catch (error) {
      console.error("Error creating listing/request:", error);
      toast.error(isRequestMode ? "Error creating request" : "Error creating listing", {
        description: "There was a problem with your submission. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow py-12 my-[40px]">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-2">
              {isRequestMode
                ? "Create a Request"
                : fulfillRequestId
                  ? "Fulfill Request"
                  : "Sell Your Item"}
            </h1>
            <p className="text-gray-600 mb-8">
              {isRequestMode 
                ? "Post a request for an item or service you're looking for."
                : fulfillRequestId 
                  ? requestOwner 
                    ? `Fill out the form below to fulfill ${requestOwner}'s request.`
                    : "Fill out the form below to fulfill this request."
                  : "Fill out the form below to list your item on UofT Market."
              }{" "}
              All fields marked with an asterisk (*) are required.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Item/Request Details */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h2 className="text-xl font-semibold mb-4">
                  {isRequestMode ? "Request Details" : "Item Details"}
                </h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input 
                      id="title" 
                      placeholder={isRequestMode ? "What are you looking for?" : "Enter a descriptive title for your item"} 
                      required 
                      value={title} 
                      onChange={e => setTitle(e.target.value)} 
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price">
                        {isRequestMode ? "Budget ($)" : "Price ($) *"}
                      </Label>
                      <Input 
                        id="price" 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        placeholder="0.00" 
                        required={!isRequestMode} 
                        value={price} 
                        onChange={e => setPrice(e.target.value)} 
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Select required value={category} onValueChange={setCategory}>
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Condition field only applies to listings */}
                  {!isRequestMode && (
                    <div>
                      <Label htmlFor="condition">Condition *</Label>
                      <Select required value={condition} onValueChange={setCondition}>
                        <SelectTrigger id="condition">
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="like-new">Like New</SelectItem>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="fair">Fair</SelectItem>
                          <SelectItem value="poor">Poor</SelectItem>
                          <SelectItem value="not-applicable">Not Applicable</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea 
                      id="description" 
                      placeholder={
                        isRequestMode 
                          ? "Describe what you're looking for in detail" 
                          : "Provide details about your item, including any defects or special features"
                      } 
                      rows={5} 
                      required 
                      value={description} 
                      onChange={e => setDescription(e.target.value)} 
                    />
                  </div>

                  {/* Images, shipping, etc. only for listings */}
                  {!isRequestMode && (
                    <>
                      <div className="flex items-center space-x-2">
                        <Switch id="shipping" checked={shipping} onCheckedChange={setShipping} />
                        <Label htmlFor="shipping">Offer Shipping</Label>
                      </div>
                      <div>
                        <Label>Photos (max 5) *</Label>
                        <div className="mt-2">
                          <ImageUpload images={images} setImages={setImages} maxImages={5} />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Meeting Preferences - only for listings */}
              {!isRequestMode && (
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h2 className="text-xl font-semibold mb-4">Meeting Preferences</h2>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="location">Preferred Meet-up Location *</Label>
                      <Select required value={meetupLocation} onValueChange={setMeetupLocation}>
                        <SelectTrigger id="location">
                          <SelectValue placeholder="Select a location" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="st-george">St. George Campus</SelectItem>
                          <SelectItem value="utm">UTM Campus</SelectItem>
                          <SelectItem value="utsc">UTSC Campus</SelectItem>
                          <SelectItem value="robarts">Robarts Library</SelectItem>
                          <SelectItem value="bahen">Bahen Centre</SelectItem>
                          <SelectItem value="sid-smith">Sidney Smith Hall</SelectItem>
                          <SelectItem value="other">Other (specify in description)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Payment Methods Accepted *</Label>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            id="cash" 
                            className="h-4 w-4" 
                            checked={paymentMethods.includes("cash")} 
                            onChange={() => handlePaymentMethodChange("cash")} 
                          />
                          <label htmlFor="cash">Cash</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            id="e-transfer" 
                            className="h-4 w-4" 
                            checked={paymentMethods.includes("e-transfer")} 
                            onChange={() => handlePaymentMethodChange("e-transfer")} 
                          />
                          <label htmlFor="e-transfer">E-Transfer</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            id="paypal" 
                            className="h-4 w-4" 
                            checked={paymentMethods.includes("paypal")} 
                            onChange={() => handlePaymentMethodChange("paypal")} 
                          />
                          <label htmlFor="paypal">PayPal</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            id="other-payment" 
                            className="h-4 w-4" 
                            checked={paymentMethods.includes("other")} 
                            onChange={() => handlePaymentMethodChange("other")} 
                          />
                          <label htmlFor="other-payment">Other (specify in description)</label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Information - only for listings */}
              {!isRequestMode && (
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="contact-method">Preferred Contact Method *</Label>
                        <Select required value={contactMethod} onValueChange={setContactMethod}>
                          <SelectTrigger id="contact-method">
                            <SelectValue placeholder="Select contact method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="phone">Phone</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="contact-info">Contact Information *</Label>
                        <Input 
                          id="contact-info" 
                          placeholder="Email address or phone number" 
                          required 
                          value={contactInfo} 
                          onChange={e => setContactInfo(e.target.value)} 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Terms confirmation & submission */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-start space-x-3 mb-6">
                  <input type="checkbox" id="terms" className="h-4 w-4 mt-1" required />
                  <label htmlFor="terms" className="text-sm text-gray-600">
                    I confirm that my {isRequestMode ? "request" : "listing"} complies with the{" "}
                    <a href="/terms" className="text-toronto-blue hover:underline">UofT Market Terms of Service</a>{" "}
                    and that I am a current University of Toronto student.
                  </label>
                </div>

                <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting || uploadingImages}>
                  {isSubmitting || uploadingImages ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {uploadingImages
                        ? "Uploading Images..."
                        : isRequestMode
                          ? "Creating Request..."
                          : "Creating Listing..."}
                    </>
                  ) : isRequestMode
                    ? "Create Request"
                    : "Create Listing"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Sell;
