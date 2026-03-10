
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from '@/contexts/AuthContext';
import { Request } from '@/types/requests';
import { Trash2, RefreshCw } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { getUserActiveRequests, getUserExpiredRequests, isRequestExpired, relistRequest } from '@/utils/requestUtils';

export default function Requests() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { user, isAuthenticated } = useAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<Request | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRelistDialogOpen, setIsRelistDialogOpen] = useState(false);
  const [requestToRelist, setRequestToRelist] = useState<Request | null>(null);
  const [isRelisting, setIsRelisting] = useState(false);
  
  useEffect(() => {
    document.title = "Requests | UofT Market";
  }, []);
  
  useEffect(() => {
    fetchRequests();
  }, [activeTab]);
  
  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      console.log("Requests page - Auth status:", {
        isAuthenticated,
        user: user?.id
      });
      
      let query = supabase.from('requests').select(`*`);
      
      if (activeTab === 'mine' && user) {
        query = query.eq('user_id', user.id);
      } else {
        // For the "all" tab, only show non-expired open requests
        query = query.eq('status', 'open');
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      console.log('Fetched requests:', data);
      
      // Process the data to mark expired requests
      const processedData = (data as any[]).map(request => {
        // Ensure the status is one of the allowed values in our Request type
        let status: Request['status'] = request.status;
        
        // Check if it's open but should be expired
        if (status === 'open' && isRequestExpired(request as Request)) {
          status = 'expired';
        }
        
        // Return request with properly typed status
        return { ...request, status } as Request;
      });
      
      // Update expired requests in the database
      const expiredRequests = processedData.filter(r => 
        r.status === 'expired' && 
        (data as any[]).find(origR => origR.id === r.id)?.status === 'open'
      );
      
      if (expiredRequests.length > 0) {
        console.log(`Updating ${expiredRequests.length} expired requests in the database`);
        
        // Update each expired request in the database
        for (const expiredReq of expiredRequests) {
          await supabase
            .from('requests')
            .update({ status: 'expired' as Request['status'] })
            .eq('id', expiredReq.id);
        }
      }
      
      setRequests(processedData);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error("Error", {
        description: "Failed to load requests. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter requests based on search term
  const filteredRequests = requests.filter(request => 
    request.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    request.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Get active and expired requests when on "mine" tab
  const activeUserRequests = user ? getUserActiveRequests(requests, user.id) : [];
  const expiredUserRequests = user ? getUserExpiredRequests(requests, user.id) : [];
  
  const handleDeleteClick = (request: Request, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setRequestToDelete(request);
    setDeleteDialogOpen(true);
  };
  
  const handleRelistClick = (request: Request, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setRequestToRelist(request);
    setIsRelistDialogOpen(true);
  };
  
  const handleDeleteRequest = async () => {
    if (!requestToDelete || !user) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('requests')
        .delete()
        .eq('id', requestToDelete.id)
        .eq('user_id', user.id);
        
      if (error) {
        throw error;
      }
      
      setRequests(prevRequests => prevRequests.filter(r => r.id !== requestToDelete.id));
      toast.success("Request deleted", {
        description: "Your request has been permanently deleted."
      });
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting request:', error);
      toast.error("Error", {
        description: "Failed to delete the request. Please try again."
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleConfirmRelist = async () => {
    if (!requestToRelist || !user) return;
    setIsRelisting(true);
    
    try {
      const updateData = relistRequest(requestToRelist);
      
      const { error } = await supabase
        .from('requests')
        .update(updateData)
        .eq('id', requestToRelist.id)
        .eq('user_id', user.id);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setRequests(prevRequests => 
        prevRequests.map(r => 
          r.id === requestToRelist.id 
            ? { ...r, ...updateData } as Request
            : r
        )
      );
      
      toast.success("Request relisted", {
        description: "Your request is now active for another 30 days."
      });
      
      // Refresh the data
      await fetchRequests();
      
      setIsRelistDialogOpen(false);
    } catch (error) {
      console.error('Error relisting request:', error);
      toast.error("Error", {
        description: "Failed to relist the request. Please try again."
      });
    } finally {
      setIsRelisting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow py-12 my-[40px]">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Requests</h1>
            <p className="text-muted-foreground mt-2">Can't find what you're looking for in the listings? Post a request and let others know what you need — someone might just have it!</p>
          </div>
          
          <div className="flex justify-between items-center mb-6">
            <div className="max-w-md w-full">
              <Input placeholder="Search requests..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <Link to="/sell?request=true" state={{ preserveAuth: true }}>
              <Button>Create Request</Button>
            </Link>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All Requests</TabsTrigger>
              {user && <TabsTrigger value="mine">My Requests</TabsTrigger>}
            </TabsList>
            
            <TabsContent value="all" className="space-y-6">
              {isLoading ? (
                <div className="text-center py-10">Loading requests...</div>
              ) : filteredRequests.filter(r => r.status === 'open').length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredRequests
                    .filter(r => r.status === 'open')
                    .map(request => (
                      <RequestCard 
                        key={request.id} 
                        request={request} 
                        isOwner={request.user_id === user?.id} 
                        onDeleteClick={handleDeleteClick}
                      />
                    ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  No open requests found. <Link to="/sell?request=true" className="text-blue-600 hover:underline">Create one</Link>?
                </div>
              )}
            </TabsContent>
            
            {user && (
              <TabsContent value="mine" className="space-y-8">
                {isLoading ? (
                  <div className="text-center py-10">Loading your requests...</div>
                ) : (
                  <>
                    {/* Active Requests */}
                    {activeUserRequests.length > 0 && (
                      <div>
                        <h2 className="text-xl font-semibold mb-4">Active Requests ({activeUserRequests.length})</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {activeUserRequests.map(request => (
                            <RequestCard 
                              key={request.id} 
                              request={request} 
                              isOwner={true} 
                              onDeleteClick={handleDeleteClick}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Expired Requests */}
                    {expiredUserRequests.length > 0 && (
                      <div>
                        <h2 className="text-xl font-semibold mb-2">Expired Requests ({expiredUserRequests.length})</h2>
                        <p className="text-sm text-muted-foreground mb-4">
                          These requests are more than 30 days old and no longer visible to others. You can relist them to make them active again.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {expiredUserRequests.map(request => (
                            <ExpiredRequestCard 
                              key={request.id} 
                              request={request} 
                              onDeleteClick={handleDeleteClick}
                              onRelistClick={handleRelistClick}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {activeUserRequests.length === 0 && expiredUserRequests.length === 0 && (
                      <div className="text-center py-10">
                        You haven't created any requests yet. <Link to="/sell?request=true" className="text-blue-600 hover:underline">Create one now</Link>?
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Request</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your request "{requestToDelete?.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteRequest} 
              className="bg-red-500 hover:bg-red-600" 
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Request"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Relist Dialog */}
      <AlertDialog open={isRelistDialogOpen} onOpenChange={setIsRelistDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Relist Request</AlertDialogTitle>
            <AlertDialogDescription>
              This will make your request active and visible to others for another 30 days. Would you like to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRelisting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmRelist} 
              className="bg-green-600 hover:bg-green-700" 
              disabled={isRelisting}
            >
              {isRelisting ? "Relisting..." : "Relist Request"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Footer />
    </div>
  );
}

interface RequestCardProps {
  request: Request;
  isOwner: boolean;
  onDeleteClick: (request: Request, e: React.MouseEvent) => void;
}

function RequestCard({ request, isOwner, onDeleteClick }: RequestCardProps) {
  return (
    <div className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow relative">
      {request.status !== 'open' && (
        <div className="absolute top-0 right-0 bg-gray-500 text-white px-2 py-1 text-xs">
          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
        </div>
      )}
      
      <div className="p-5">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">{request.title}</h3>
        
        <div className="mb-4 text-sm text-gray-600">
          <span className="inline-block bg-gray-100 rounded-full px-3 py-1 text-xs font-semibold mr-2">
            {request.category}
          </span>
          {request.budget && (
            <span className="inline-block bg-gray-100 rounded-full px-3 py-1 text-xs font-semibold">
              Budget: ${request.budget}
            </span>
          )}
        </div>
        
        <p className="text-gray-600 text-sm line-clamp-3 mb-4">
          {request.description}
        </p>
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">
            {new Date(request.created_at).toLocaleDateString()}
          </span>
          <div className="flex gap-2">
            {isOwner && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" 
                onClick={e => onDeleteClick(request, e)}
              >
                <Trash2 size={16} />
              </Button>
            )}
            <Link to={`/request/${request.id}`}>
              <Button variant="outline" size="sm">View Details</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ExpiredRequestCardProps {
  request: Request;
  onDeleteClick: (request: Request, e: React.MouseEvent) => void;
  onRelistClick: (request: Request, e: React.MouseEvent) => void;
}

function ExpiredRequestCard({ request, onDeleteClick, onRelistClick }: ExpiredRequestCardProps) {
  return (
    <div className="bg-gray-50 border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow relative border-gray-200">
      <div className="absolute top-0 right-0 bg-amber-500 text-white px-2 py-1 text-xs">
        Expired
      </div>
      
      <div className="p-5">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2 text-gray-600">{request.title}</h3>
        
        <div className="mb-4 text-sm text-gray-500">
          <span className="inline-block bg-gray-100 rounded-full px-3 py-1 text-xs font-semibold mr-2">
            {request.category}
          </span>
          {request.budget && (
            <span className="inline-block bg-gray-100 rounded-full px-3 py-1 text-xs font-semibold">
              Budget: ${request.budget}
            </span>
          )}
        </div>
        
        <p className="text-gray-500 text-sm line-clamp-3 mb-4">
          {request.description}
        </p>
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">
            Posted {new Date(request.created_at).toLocaleDateString()}
          </span>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
              onClick={e => onRelistClick(request, e)}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              <span>Relist</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
              onClick={e => onDeleteClick(request, e)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              <span>Delete</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
