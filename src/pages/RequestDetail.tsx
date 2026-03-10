import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trash2, MessageCircle } from 'lucide-react';
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Request } from '@/types/requests';
import { useAuth } from '@/contexts/AuthContext';
import { useMessaging } from '@/contexts/MessagingContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Avatar,
  AvatarImage,
  AvatarFallback
} from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";


// Possible statuses: "open", "pending", "closed", "fulfilled"
export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<Request | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [requestOwner, setRequestOwner] = useState<{
    name: string;
    avatar_url: string | null;
    program?: string;
    year?: string;
    bio?: string;
  } | null>(null);

  // Auth context
  const { user } = useAuth();
  const { createConversation, getDefaultMessageForListing } = useMessaging();
  const isOwner = user?.id === request?.user_id;

  // Dialog states
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const [isReopenDialogOpen, setIsReopenDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Optional: If you want a dialog for accept/reject:
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isAcceptDialogOpen, setIsAcceptDialogOpen] = useState(false);

  const [fulfillerProfile, setFulfillerProfile] = useState<{
    name: string;
    avatar_url: string | null;
  } | null>(null);

  useEffect(() => {
    document.title = request
      ? `${request.title} | Request | UofT Market`
      : "Request Details | UofT Market";
  }, [request]);

  useEffect(() => {
    fetchRequestDetails();
  }, [id]);

  const fetchRequestDetails = async () => {
    setIsLoading(true);
    try {
      if (!id) {
        throw new Error("Request ID is required");
      }
      
      const { data: requestData, error: requestError } = await supabase
        .from('requests')
        .select('*')
        .eq('id', id)
        .single();
      
      if (requestError) {
        throw requestError;
      }
      
      console.log('Fetched request details:', requestData);
      setRequest(requestData as Request);
      
      if (requestData.user_id) {
        const { data: profileData, error: profileError } = await supabase
          .from('public_profiles')
          .select('name, avatar_url, program, year, bio')
          .eq('id', requestData.user_id)
          .single();
        
        if (!profileError && profileData) {
          setRequestOwner(profileData);
        }
      }
      if (requestData.fulfilled_by) {
        const { data: fulfillerData, error: fulfillerError } = await supabase
          .from('public_profiles')
          .select('name, avatar_url')
          .eq('id', requestData.fulfilled_by)
          .single();
        
        if (!fulfillerError && fulfillerData) {
          setFulfillerProfile(fulfillerData);
        }
      }

    } catch (error) {
      console.error('Error fetching request details:', error);
      toast.error("Error", {
        description: "Failed to load request details. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  // =========================
  // Status management
  // =========================

  const handleCloseRequest = async () => {
    setIsActionLoading(true);
    try {
      if (!id || !isOwner) return;

      const { error } = await supabase
        .from('requests')
        .update({
          status: 'closed',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) {
        throw error;
      }

      toast.success("Request closed", {
        description: "Your request has been marked as closed."
      });
      
      if (request) {
        setRequest({
          ...request,
          status: 'closed',
          updated_at: new Date().toISOString()
        });
      }
      
      setIsCloseDialogOpen(false);
    } catch (error) {
      console.error('Error closing request:', error);
      toast.error("Error", {
        description: "Failed to close the request. Please try again."
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReopenRequest = async () => {
    setIsActionLoading(true);
    try {
      if (!id || !isOwner) return;

      const { error } = await supabase
        .from('requests')
        .update({
          status: 'open',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) {
        throw error;
      }

      toast.success("Request reopened", {
        description: "Your request has been reopened and is now visible to others."
      });
      
      if (request) {
        setRequest({
          ...request,
          status: 'open',
          updated_at: new Date().toISOString()
        });
      }
      
      setIsReopenDialogOpen(false);
    } catch (error) {
      console.error('Error reopening request:', error);
      toast.error("Error", {
        description: "Failed to reopen the request. Please try again."
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteRequest = async () => {
    setIsActionLoading(true);
    try {
      if (!id || !isOwner) return;
      
      const { error } = await supabase
        .from('requests')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);
        
      if (error) {
        throw error;
      }
      
      toast.success("Request deleted", {
        description: "Your request has been permanently deleted."
      });
      
      navigate('/requests');
    } catch (error) {
      console.error('Error deleting request:', error);
      toast.error("Error", {
        description: "Failed to delete the request. Please try again."
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  // =========================
  // Pending Acceptance/Rejection
  // =========================

  const handleAcceptFulfillment = async () => {
    setIsActionLoading(true);
    try {
      if (!id || !isOwner) return;

      // Mark request as fulfilled, set fulfilled_at
      const { error } = await supabase
        .from('requests')
        .update({
          status: 'fulfilled',
          fulfilled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) {
        throw error;
      }

      toast.success("Fulfillment accepted", {
        description: "You have accepted the listing created for your request."
      });

      setRequest(prev => prev ? {
        ...prev,
        status: 'fulfilled',
        fulfilled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } : null);

      setIsAcceptDialogOpen(false);
    } catch (error) {
      console.error('Error accepting fulfillment:', error);
      toast.error("Error", {
        description: "Could not accept this fulfillment. Please try again."
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRejectFulfillment = async () => {
    setIsActionLoading(true);
    try {
      if (!id || !isOwner) return;

      // Mark request as open again, clear the fulfilled_listing_id, and fulfilled_by if you’re storing that
      const { error } = await supabase
        .from('requests')
        .update({
          status: 'open',
          fulfilled_listing_id: null,
          fulfilled_by: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) {
        throw error;
      }

      toast("Fulfillment rejected; request re-opened", {
        description: "You have rejected the proposed listing and your request is open again."
      });

      setRequest(prev => prev ? {
        ...prev,
        status: 'open',
        fulfilled_listing_id: null,
        fulfilled_by: null,
        updated_at: new Date().toISOString()
      } : null);

      setIsRejectDialogOpen(false);
    } catch (error) {
      console.error('Error rejecting fulfillment:', error);
      toast.error("Error", {
        description: "Could not reject this fulfillment. Please try again."
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  // =========================
  // Fulfill This Request
  // =========================
  const handleFulfillRequest = () => {
    if (!id) return;
    
    // This navigates the user to the Sell page with query param
    // which will create a new listing and update the request to "pending"
    navigate(`/sell?fulfillRequest=${id}`, {
      state: {
        preserveAuth: true,
        requestTitle: request?.title,
        requestDescription: request?.description,
        requestCategory: request?.category,
        requestBudget: request?.budget
      }
    });
  };

  const handleMessageOwner = async () => {
    if (!user) {
      toast.error("Please sign in to message users");
      navigate("/auth");
      return;
    }

    if (!request || !request.user_id) {
      toast.error("Unable to message request owner");
      return;
    }

    if (user.id === request.user_id) {
      toast.error("You cannot message yourself");
      return;
    }

    // Check if conversation already exists using the new schema
    // Find conversations for this request between these two users
    const { data: existingConversations, error } = await supabase
      .from('conversations')
      .select('id')
      .eq('request_id', request.id)
      .or(`and(user1_id.eq.${user.id},user2_id.eq.${request.user_id}),and(user1_id.eq.${request.user_id},user2_id.eq.${user.id})`);

    if (error) {
      console.error('Error checking for existing conversation:', error);
      // Fall back to creating new conversation
    } else if (existingConversations && existingConversations.length > 0) {
      const conversation = existingConversations[0]; // Should only be one conversation between two users for a request
      
      // Found existing conversation - navigate directly to it
      toast.success("Opening existing conversation...");
      
      navigate("/messages", {
        state: {
          conversationId: conversation.id,
          requestTitle: request.title
        }
      });
      return;
    }

    // No existing conversation found - create new one via pending conversation
    const defaultMessage = `Hi! I'm interested in your "${request.title}" request.`;
    
    navigate("/messages", {
      state: {
        pendingConversation: {
          sellerId: request.user_id,
          sellerName: request.profiles?.name || 'User',
          sellerAvatar: request.profiles?.avatar_url,
          requestId: request.id,
          requestTitle: request.title,
          defaultMessage
        }
      }
    });
  };

  // =========================
  // Helpers
  // =========================

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // =========================
  // Rendering
  // =========================

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow py-12 my-[40px]">
        <div className="container mx-auto px-4">
          <Link
            to="/requests"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Requests
          </Link>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : request ? (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                {/* Title and Quick Badges */}
                <div className="flex justify-between items-start flex-wrap gap-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{request.title}</h1>
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      {/* Category badge */}
                      <Badge variant="outline" className="bg-blue-50">
                        {request.category}
                      </Badge>

                      {/* Budget (optional) */}
                      {request.budget && (
                        <Badge variant="outline" className="bg-green-50">
                          Budget: ${request.budget}
                        </Badge>
                      )}

                      {/* Status badge */}
                      {request.status === 'open' && (
                        <Badge variant="default">Open</Badge>
                      )}
                      {request.status === 'pending' && (
                        <Badge variant="outline" className="bg-yellow-50">
                          Pending
                        </Badge>
                      )}
                      {request.status === 'closed' && (
                        <Badge variant="secondary">Closed</Badge>
                      )}
                      {request.status === 'fulfilled' && (
                        <Badge variant="outline" className="bg-green-200">
                          Fulfilled
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Action buttons - only if not owner, status is open */}
                  {!isOwner && request.status === 'open' && (
                    <div className="flex gap-3">
                      <Button onClick={handleFulfillRequest}>
                        Fulfill This Request
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={handleMessageOwner}
                        className="flex items-center gap-2"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Message
                      </Button>
                    </div>
                  )}
                </div>
                
                <Separator className="my-6" />
                
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="md:col-span-2">
                    {/* Description */}
                    <h2 className="text-xl font-semibold mb-4">Description</h2>
                    <div className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap">
                      {request.description}
                    </div>
                    
                    {/* Optional attached image */}
                    {request.image_url && (
                      <div className="mt-6">
                        <h2 className="text-xl font-semibold mb-4">
                          Attached Image
                        </h2>
                        <img
                          src={request.image_url}
                          alt="Request image"
                          className="max-w-full h-auto rounded-md"
                        />
                      </div>
                    )}

                    {/* If there's a listing fulfilling this request */}
                    {request.fulfilled_listing_id && (
                      <div className="mt-6 bg-blue-50 p-4 rounded-md">
                        <h2 className="text-xl font-semibold mb-2">
                          Fulfillment Information
                        </h2>
                        {request.status === 'pending' ? (
                          <p className="mb-2">
                            A seller has created a listing to fulfill your request.
                            {isOwner && " Please review the listing to accept or reject."}
                          </p>
                        ) : (
                          <p className="mb-2">
                            This request has a related listing. 
                            {isOwner && request.status === 'fulfilled' && " You accepted this fulfillment."}
                          </p>
                        )}
                        <Link to={`/product/${request.fulfilled_listing_id}`}>
                          <Button variant="outline" className="mt-2">
                            View Listing
                          </Button>
                        </Link>

                        {/* If pending and you're the owner, show accept/reject controls */}
                        {request.status === 'pending' && isOwner && (
                          <div className="flex gap-4 mt-4">
                            <Button
                              variant="default"
                              onClick={() => setIsAcceptDialogOpen(true)}
                            >
                              Accept Fulfillment
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setIsRejectDialogOpen(true)}
                            >
                              Reject Fulfillment
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Sidebar */}
                  <div>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h2 className="text-xl font-semibold mb-4">Request Info</h2>
                      
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm text-gray-500">Posted On</h3>
                          <p>{formatDate(request.created_at)}</p>
                        </div>
                        
                        {/* Owner info */}
                        {requestOwner && (
                          <div className="border rounded-md p-3 bg-white">
                            <h3 className="text-sm text-gray-500 mb-2">Posted By</h3>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                {requestOwner.avatar_url ? (
                                  <AvatarImage
                                    src={requestOwner.avatar_url}
                                    alt={requestOwner.name}
                                  />
                                ) : (
                                  <AvatarFallback>
                                    {getInitials(requestOwner.name)}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <div>
                                <p className="font-medium">{requestOwner.name}</p>
                                {(requestOwner.program || requestOwner.year) && (
                                  <p className="text-xs text-gray-500">
                                    {requestOwner.program}
                                    {requestOwner.year &&
                                      ` • ${requestOwner.year}`}
                                  </p>
                                )}
                              </div>
                            </div>
                            {requestOwner.bio && (
                              <p className="text-sm mt-2 text-gray-600 line-clamp-3">
                                {requestOwner.bio}
                              </p>
                            )}
                            
                            {/* Message button if not the owner */}
                            {!isOwner && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={handleMessageOwner}
                                className="w-full mt-3 flex items-center gap-2"
                              >
                                <MessageCircle className="w-4 h-4" />
                                Message
                              </Button>
                            )}
                          </div>
                        )}
                        
                        {/* If fulfilled, show fulfilled date/by */}
                        {request.status === 'fulfilled' && (
                          <>
                            <div>
                              <h3 className="text-sm text-gray-500">Fulfilled On</h3>
                              <p>
                                {request.fulfilled_at
                                  ? formatDate(request.fulfilled_at)
                                  : 'N/A'}
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                {fulfillerProfile && fulfillerProfile.avatar_url ? (
                                  <AvatarImage
                                    src={fulfillerProfile.avatar_url}
                                    alt={fulfillerProfile.name}
                                  />
                                ) : (
                                  <AvatarFallback>
                                    {fulfillerProfile ? getInitials(fulfillerProfile.name) : 'N/A'}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <div>
                                <h3 className="text-sm text-gray-500">Fulfilled By</h3>
                                <p>{fulfillerProfile ? fulfillerProfile.name : 'N/A'}</p>
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Owner-only actions */}
                      {isOwner && (
                        <div className="mt-6 space-y-2">
                          {/* Mark as closed if open or pending */}
                          {(request.status === 'open' || request.status === 'pending') && (
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => setIsCloseDialogOpen(true)}
                            >
                              Mark as Closed
                            </Button>
                          )}

                          {/* Reopen if closed */}
                          {request.status === 'closed' && (
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => setIsReopenDialogOpen(true)}
                            >
                              Reopen Request
                            </Button>
                          )}

                          {/* Delete request */}
                          <Button
                            variant="destructive"
                            className="w-full flex items-center justify-center gap-2"
                            onClick={() => setIsDeleteDialogOpen(true)}
                          >
                            <Trash2 size={16} />
                            Delete Request
                          </Button>
                        </div>
                      )}

                      {/* If you want them to "review fulfillment" specifically 
                          while open, you can show an extra button (already above) */}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <h2 className="text-2xl font-semibold mb-2">Request Not Found</h2>
              <p className="mb-6">
                The request you're looking for doesn't exist or has been removed.
              </p>
              <Link to="/requests">
                <Button>Go Back to Requests</Button>
              </Link>
            </div>
          )}
        </div>
      </main>
      
      {/* Close dialog */}
      <Dialog open={isCloseDialogOpen} onOpenChange={setIsCloseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Request</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to mark this request as closed? This will prevent others from fulfilling it.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCloseDialogOpen(false)}
              disabled={isActionLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleCloseRequest} disabled={isActionLoading}>
              {isActionLoading ? "Processing..." : "Close Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reopen dialog */}
      <Dialog open={isReopenDialogOpen} onOpenChange={setIsReopenDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reopen Request</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to reopen this request? This will make it visible to others again.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsReopenDialogOpen(false)}
              disabled={isActionLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleReopenRequest} disabled={isActionLoading}>
              {isActionLoading ? "Processing..." : "Reopen Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete alert dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Request</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your request.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRequest}
              className="bg-red-500 hover:bg-red-600"
              disabled={isActionLoading}
            >
              {isActionLoading ? "Processing..." : "Delete Request"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Accept Fulfillment Dialog (Optional) */}
      <Dialog open={isAcceptDialogOpen} onOpenChange={setIsAcceptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept Fulfillment</DialogTitle>
          </DialogHeader>
          <p>
            Accepting this fulfillment will mark your request as fulfilled. Are you sure?
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAcceptDialogOpen(false)}
              disabled={isActionLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleAcceptFulfillment} disabled={isActionLoading}>
              {isActionLoading ? "Processing..." : "Accept Fulfillment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Fulfillment Dialog (Optional) */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Fulfillment</DialogTitle>
          </DialogHeader>
          <p>
            Rejecting this fulfillment will remove the listing link and reopen your request. Continue?
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRejectDialogOpen(false)}
              disabled={isActionLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleRejectFulfillment} disabled={isActionLoading}>
              {isActionLoading ? "Processing..." : "Reject Fulfillment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
