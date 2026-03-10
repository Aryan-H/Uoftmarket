import React, { useState, useEffect, useCallback } from 'react';
import { useMessaging } from '@/contexts/MessagingContext';
import { useAuth } from '@/contexts/AuthContext';
import { ConversationList } from '@/components/messaging/ConversationList';
import { ChatWindow } from '@/components/messaging/ChatWindow';
import { ConversationWithDetails } from '@/types/messages';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, Search, Users, PlusCircle, ArrowLeft, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageInput } from '@/components/messaging/MessageInput';
import { supabase } from '@/lib/supabase';

const Messages: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    conversations,
    activeConversation,
    messages,
    loading,
    unreadCount,
    loadMessages,
    sendMessage,
    setActiveConversation,
    markAsRead,
    deleteConversation,
    getDefaultMessageForListing,
    loadConversations,
    createConversation
  } = useMessaging();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileView, setIsMobileView] = useState(false);
  const [hasAutoSelected, setHasAutoSelected] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false); // Prevent multiple reactivation attempts

  const [showConversationList, setShowConversationList] = useState(true);
  const [defaultMessage, setDefaultMessage] = useState<string>('');
  const [pendingConversation, setPendingConversation] = useState<{
    sellerId: string;
    listingId: string;
    listingTitle: string;
    requestId?: string; // Added requestId
  } | null>(null);
  const [pendingSellerProfile, setPendingSellerProfile] = useState<{
    name: string;
    avatar_url?: string;
  } | null>(null);
  // Removed pendingReactivation state as reactivation is now handled directly

  // Define handleSelectConversation function early to avoid hoisting issues
  const handleSelectConversation = useCallback(async (conversation: ConversationWithDetails) => {
    setActiveConversation(conversation);
    await loadMessages(conversation.id);
    await markAsRead(conversation.id);
    
    // Clear any default message when selecting a conversation
    setDefaultMessage('');
    
    // On mobile, hide conversation list when selecting a chat
    if (isMobileView) {
      setShowConversationList(false);
    }
  }, [setActiveConversation, loadMessages, markAsRead, isMobileView]);

  // Responsive handling
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobileView(window.innerWidth < 1024);
      if (window.innerWidth < 1024 && activeConversation) {
        setShowConversationList(false);
      } else {
        setShowConversationList(true);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [activeConversation]);

  // Handle navigation - existing conversation or pending
  useEffect(() => {
    const state = location.state as { 
      conversationId?: string; 
      listingTitle?: string;
      pendingConversation?: {
        sellerId: string;
        listingId: string;
        listingTitle: string;
        requestId?: string; // Added requestId
      };
    };
    
    if (!hasAutoSelected) {
      if (state?.conversationId && !isReactivating) {
        // Find and select the existing conversation directly
        const findAndSelectConversation = async () => {
          // Load conversations first if not loaded
          if (conversations.length === 0) {
            await loadConversations();
          }
          
          // Small delay to ensure state updates
          setTimeout(() => {
            const conversation = conversations.find(c => c.id === state.conversationId);
            if (conversation) {
              setHasAutoSelected(true);
              handleSelectConversation(conversation);
            } else {
              // Conversation not found in loaded conversations, try loading again
              loadConversations();
            }
          }, 100);
        };
        
        findAndSelectConversation();
      } else if (state?.pendingConversation) {
        // Pending conversation - set up for new chat
        setHasAutoSelected(true);
        setPendingConversation({ ...state.pendingConversation, requestId: state.pendingConversation.requestId }); // Pass requestId
        
        // Use appropriate title for default message
        const title = state.pendingConversation.listingTitle || state.pendingConversation.requestTitle;
        setDefaultMessage(getDefaultMessageForListing(title));
        
        // Fetch seller profile
        const fetchSellerProfile = async () => {
          try {
            const { data: profile } = await supabase
              .from('public_profiles')
              .select('name, avatar_url')
              .eq('id', state.pendingConversation.sellerId)
              .single();
            
            if (profile) {
              setPendingSellerProfile(profile);
            }
          } catch (error) {
            console.error('Error fetching seller profile:', error);
          }
        };
        
        fetchSellerProfile();
        
        // Clear active conversation and show conversation list
        setActiveConversation(null);
        if (isMobileView) {
          setShowConversationList(true);
        }
      }
    }
  }, [conversations, hasAutoSelected, isMobileView, isReactivating]);

  // Mark active conversation as read when entering Messages page
  useEffect(() => {
    if (activeConversation && !location.state && !hasAutoSelected) {
      // If there's an active conversation and we didn't navigate with specific state,
      // and no auto-selection happened, mark it as read (user is viewing it)
      markAsRead(activeConversation.id);
    }
  }, [activeConversation, location.state, hasAutoSelected, markAsRead]); // Trigger when activeConversation changes

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conversation => {
    const userName = (conversation.other_participant?.name || '').toLowerCase();
    const listingTitle = (conversation.listing?.title || '').toLowerCase();
    const requestTitle = (conversation.request?.title || '').toLowerCase();
    const lastMessage = (conversation.last_message?.content || '').toLowerCase();
    
    return userName.includes(searchTerm.toLowerCase()) ||
           listingTitle.includes(searchTerm.toLowerCase()) ||
           requestTitle.includes(searchTerm.toLowerCase()) ||
           lastMessage.includes(searchTerm.toLowerCase());
  });

  const handleSendMessage = async (content: string) => {
    // If there's a pending conversation, create it first
    if (pendingConversation) {
      // Create conversation first, then send message
      try {
        const conversationId = await createConversation({
          participant_id: pendingConversation.sellerId,
          listing_id: pendingConversation.listingId,
          request_id: pendingConversation.requestId
        });

        if (conversationId) {
          await sendMessage({
            conversation_id: conversationId,
            content: content
          });
          
          // Create a mock conversation for immediate UI update
          const mockConversation: ConversationWithDetails = {
            id: conversationId,
            listing_id: pendingConversation.listingId,
            request_id: pendingConversation.requestId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_message_at: new Date().toISOString(),
            participants: [],
            other_participant: pendingSellerProfile ? {
              id: pendingConversation.sellerId,
              name: pendingSellerProfile.name,
              avatar_url: pendingSellerProfile.avatar_url
            } : undefined,
            unread_count: 0,
            last_message: {
              id: 'temp',
              conversation_id: conversationId,
              user_id: user?.id || '',
              content: content,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          };

          setActiveConversation(mockConversation);
          await loadMessages(conversationId);
          
          // Clear pending conversation
          setPendingConversation(null);
          setPendingSellerProfile(null);
          setDefaultMessage('');
          
          // Background refresh of conversations list
          setTimeout(() => loadConversations(), 500);
        }
      } catch (error) {
        console.error('Error creating conversation:', error);
        toast.error('Failed to start conversation');
      }
    } else if (activeConversation) {
      // Normal message sending to existing conversation
      await sendMessage({
        conversation_id: activeConversation.id,
        content
      });
      // Messages will update automatically via real-time subscription
    }
    
    // Clear default message after sending
    setDefaultMessage('');
  };

  const handleBackToList = () => {
    setShowConversationList(true);
    setActiveConversation(null);
    setPendingConversation(null);
    setPendingSellerProfile(null);
    setDefaultMessage('');
    setIsReactivating(false); // Reset reactivation flag
  };

  const handleDeleteConversation = async (conversationId: string) => {
    await deleteConversation(conversationId);
    // If we just deleted the active conversation, go back to list
    if (activeConversation?.id === conversationId) {
      setActiveConversation(null);
      setShowConversationList(true);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="flex-grow pt-6 my-[60px]">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
              <p className="text-muted-foreground mt-2">Chat with buyers and sellers to arrange deals and ask questions about listings.</p>
              {unreadCount > 0 && (
                <p className="text-muted-foreground mt-2">
                  <span className="text-blue-600 font-medium">
                    ({unreadCount} unread)
                  </span>
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-220px)]">
            {/* Conversation List */}
            <Card className={cn(
              "lg:col-span-1 h-full overflow-hidden",
              isMobileView && !showConversationList && "hidden"
            )}>
              <div className="flex flex-col h-full">
                {/* Search */}
                <div className="p-4 border-b">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search conversations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Conversations */}
                <div className="flex-1 overflow-y-auto">
                  <ConversationList
                    conversations={filteredConversations}
                    activeConversationId={activeConversation?.id}
                    onSelectConversation={handleSelectConversation}
                    loading={loading}
                  />
                </div>
              </div>
            </Card>

            {/* Chat Area */}
            <Card className={cn(
              "lg:col-span-3 h-full overflow-hidden min-h-[500px]",
              isMobileView && showConversationList && "hidden"
            )}>
              {activeConversation ? (
                <ChatWindow
                  conversation={activeConversation}
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  onBack={isMobileView ? handleBackToList : undefined}
                  loading={loading}
                  className="h-full"
                  onDeleteConversation={handleDeleteConversation}
                  defaultMessage={defaultMessage}
                />
              ) : pendingConversation ? (
                <div className="flex flex-col h-full">
                  {/* Pending conversation header */}
                  <div className="border-b p-4 bg-background/95 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      {isMobileView && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={handleBackToList}
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={pendingSellerProfile?.avatar_url} />
                        <AvatarFallback>
                          {pendingSellerProfile?.name?.charAt(0)?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">
                          {pendingSellerProfile?.name || 'Seller'}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Package className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground truncate">
                            {pendingConversation.listingTitle}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Empty message area */}
                  <div className="flex-1 overflow-y-auto p-4">
                    <div className="flex flex-col items-center justify-center h-32 text-center">
                      <p className="text-muted-foreground mb-2">Start the conversation</p>
                      <p className="text-sm text-muted-foreground">
                        Your message will create this conversation
                      </p>
                    </div>
                  </div>

                  {/* Message Input */}
                  <MessageInput 
                    onSendMessage={handleSendMessage}
                    disabled={loading}
                    placeholder="Start the conversation..."
                    defaultValue={defaultMessage}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <MessageCircle className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-medium text-muted-foreground mb-2">
                    Welcome to Messages
                  </h3>
                  <p className="text-muted-foreground max-w-md mb-6">
                    Select a conversation from the sidebar to start chatting, or browse listings and requests to connect with other users.
                  </p>
                  
                  <div className="space-y-3 w-full max-w-sm">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => navigate('/products')}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Browse Listings
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => navigate('/requests')}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Fulfill a Request
                    </Button>
                  </div>

                  {/* Quick stats */}
                  <div className="mt-8 grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-muted-foreground">
                        {conversations.length}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Conversations
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {unreadCount}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Unread
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Messages; 