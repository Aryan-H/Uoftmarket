import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, PencilIcon, Trash2Icon, PackageIcon, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useListings } from "@/contexts/ListingsContext";
import { Listing } from "@/types/listings";
import { useToast } from "@/hooks/use-toast";
import EditListingDialog from "./EditListingDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getUserActiveListings, getUserExpiredListings, truncateTitle, relistListing } from "@/utils/listingUtils";

const MyListings = () => {
  const { getUserListings, removeListing, editListing, refreshListings } = useListings();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRelistDialogOpen, setIsRelistDialogOpen] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<string | null>(null);
  const [listingToRelist, setListingToRelist] = useState<Listing | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRelisting, setIsRelisting] = useState(false);
  
  const allUserListings = getUserListings();
  const activeListings = getUserActiveListings(allUserListings, user?.id || '');
  const expiredListings = getUserExpiredListings(allUserListings, user?.id || '');

  const handleEditListing = (listing: Listing) => {
    setSelectedListing(listing);
    setIsEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setSelectedListing(null);
  };

  const handleDeletePrompt = (id: string) => {
    setListingToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleRelistPrompt = (listing: Listing) => {
    setListingToRelist(listing);
    setIsRelistDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (listingToDelete) {
      setIsDeleting(true);
      try {
        console.log(`Confirming delete for listing: ${listingToDelete}`);
        const success = await removeListing(listingToDelete);
        
        if (success) {
          toast({
            title: "Listing deleted",
            description: "Your listing has been permanently deleted.",
          });
          setIsDeleteDialogOpen(false);
          setListingToDelete(null);
        } else {
          toast({
            title: "Error",
            description: "There was a problem deleting your listing. Please ensure you're logged in.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error deleting listing:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred while deleting your listing.",
          variant: "destructive",
        });
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleConfirmRelist = async () => {
    if (listingToRelist) {
      setIsRelisting(true);
      try {
        console.log(`Attempting to relist listing: ${listingToRelist.id}`);
        
        // Use the relistListing utility function to get the update data
        const updateData = relistListing(listingToRelist);
        console.log("Update data for relisting:", updateData);
        
        // Call the editListing function with the update data
        const success = await editListing(listingToRelist.id, updateData);
        
        if (success) {
          toast({
            title: "Listing relisted",
            description: "Your listing has been successfully relisted and will be visible for another 30 days.",
          });
          
          // Force a refresh of the listings to update the UI
          await refreshListings();
          
          setIsRelistDialogOpen(false);
          setListingToRelist(null);
        } else {
          toast({
            title: "Error",
            description: "There was a problem relisting your item. Please ensure you're logged in.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error relisting item:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred while relisting your item.",
          variant: "destructive",
        });
      } finally {
        setIsRelisting(false);
      }
    }
  };

  const formatListingDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return 'Recently';
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <h3 className="text-lg font-medium">You need to log in to view your listings</h3>
        <Button asChild className="mt-4">
          <Link to="/auth">Sign In</Link>
        </Button>
      </div>
    );
  }

  if (allUserListings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="rounded-full bg-gray-100 p-3 mb-4">
          <Trash2Icon className="h-6 w-6 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium">No Listings Yet</h3>
        <p className="text-gray-500 mt-1 mb-4">You haven't created any listings yet.</p>
        <Button asChild>
          <Link to="/sell">Create Your First Listing</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">My Listings ({allUserListings.length})</h2>
        <Button asChild>
          <Link to="/sell">Create New Listing</Link>
        </Button>
      </div>
      
      {/* Active Listings Section */}
      {activeListings.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-4">Active Listings ({activeListings.length})</h3>
          <div className="space-y-4">
            {activeListings.map((listing) => (
              <div key={listing.id} className="flex flex-col sm:flex-row justify-between items-start bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                <div className="flex items-center space-x-4 w-full sm:w-auto mb-4 sm:mb-0">
                  <div className="relative h-16 w-16 flex-shrink-0 rounded-md overflow-hidden">
                    <img 
                      src={listing.image || 'https://via.placeholder.com/64'} 
                      alt={listing.title} 
                      className="h-full w-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <h3 className="font-medium text-base w-[180px] sm:w-[200px] md:w-[220px] lg:w-[250px] truncate">
                            {truncateTitle(listing.title)}
                          </h3>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p className="max-w-xs">{listing.title}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-toronto-blue font-medium">${listing.price.toFixed(2)}</span>
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-gray-500">{formatListingDate(listing.postedTime)}</span>
                      {listing.shipping && (
                        <>
                          <span className="text-sm text-gray-500">•</span>
                          <span className="text-sm text-green-600 flex items-center">
                            <PackageIcon className="h-3 w-3 mr-1" />
                            Shipping
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 sm:ml-auto mt-3 sm:mt-0 flex-shrink-0">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/product/${listing.id}`} className="flex items-center">
                      <span className="sr-only sm:not-sr-only sm:mr-1">View</span>
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleEditListing(listing)}
                    className="flex items-center"
                  >
                    <span className="sr-only sm:not-sr-only sm:mr-1">Edit</span>
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDeletePrompt(listing.id)}
                    className="flex items-center text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                  >
                    <span className="sr-only sm:not-sr-only sm:mr-1">Delete</span>
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expired Listings Section */}
      {expiredListings.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-4">Expired Listings ({expiredListings.length})</h3>
          <p className="text-sm text-gray-500 mb-4">
            These listings are more than 30 days old and no longer visible to buyers. You can relist them to make them active again.
          </p>
          <div className="space-y-4">
            {expiredListings.map((listing) => (
              <div key={listing.id} className="flex flex-col sm:flex-row justify-between items-start bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center space-x-4 w-full sm:w-auto mb-4 sm:mb-0">
                  <div className="relative h-16 w-16 flex-shrink-0 rounded-md overflow-hidden bg-gray-200">
                    <img 
                      src={listing.image || 'https://via.placeholder.com/64'} 
                      alt={listing.title} 
                      className="h-full w-full object-cover opacity-70"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <h3 className="font-medium text-base text-gray-600 w-[180px] sm:w-[200px] md:w-[220px] lg:w-[250px] truncate">
                            {truncateTitle(listing.title)}
                          </h3>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p className="max-w-xs">{listing.title}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-gray-500 font-medium">${listing.price.toFixed(2)}</span>
                      <span className="text-sm text-gray-400">•</span>
                      <span className="text-sm text-gray-400">Posted {formatListingDate(listing.postedTime)}</span>
                      <span className="text-sm text-gray-400">•</span>
                      <span className="text-sm text-amber-600">Expired</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 sm:ml-auto mt-3 sm:mt-0 flex-shrink-0">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleRelistPrompt(listing)}
                    className="flex items-center text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    <span>Relist</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDeletePrompt(listing.id)}
                    className="flex items-center text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2Icon className="h-4 w-4 mr-2" />
                    <span>Delete</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {selectedListing && (
        <EditListingDialog
          listing={selectedListing}
          isOpen={isEditDialogOpen}
          onClose={handleCloseEditDialog}
        />
      )}
      
      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={(open) => {
        if (!isDeleting) setIsDeleteDialogOpen(open);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Listing</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete this listing? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="sm:justify-between">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Permanently Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Relist Dialog */}
      <Dialog open={isRelistDialogOpen} onOpenChange={(open) => {
        if (!isRelisting) setIsRelistDialogOpen(open);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Relist Item</DialogTitle>
            <DialogDescription>
              This will make your listing active and visible to buyers for another 30 days. Would you like to proceed?
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="sm:justify-between">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsRelistDialogOpen(false)}
              disabled={isRelisting}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="default" 
              onClick={handleConfirmRelist}
              disabled={isRelisting}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isRelisting ? 'Relisting...' : 'Relist Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyListings;
