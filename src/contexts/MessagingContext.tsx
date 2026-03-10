// @ts-nocheck
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';
import { 
  Conversation, 
  ConversationWithDetails, 
  Message, 
  CreateConversationRequest, 
  SendMessageRequest 
} from '@/types/messages';
import { toast } from 'sonner';

interface MessagingContextType {
  conversations: ConversationWithDetails[];
  activeConversation: ConversationWithDetails | null;
  messages: Message[];
  loading: boolean;
  unreadCount: number;
  
  // Actions
  loadConversations: (newConversationFromMessage?: { conversationId: string, senderId: string }) => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;
  sendMessage: (request: SendMessageRequest) => Promise<void>;
  createConversation: (request: CreateConversationRequest) => Promise<string | null>;
  setActiveConversation: (conversation: ConversationWithDetails | null) => void;
  markAsRead: (conversationId: string) => Promise<void>;
  startConversationFromListing: (listingId: string, sellerId: string) => Promise<string | null>;
  deleteConversation: (conversationId: string) => Promise<void>;
  getDefaultMessageForListing: (listingTitle: string) => string;
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined);

export const useMessaging = () => {
  const context = useContext(MessagingContext);
  if (!context) {
    throw new Error('useMessaging must be used within a MessagingProvider');
  }
  return context;
};

interface MessagingProviderProps {
  children: React.ReactNode;
}

export const MessagingProvider: React.FC<MessagingProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [activeConversation, setActiveConversation] = useState<ConversationWithDetails | null>(null);
  const activeConversationRef = useRef<ConversationWithDetails | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Keep ref in sync with state
  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  // Load user's conversations
  const loadConversations = async (newConversationFromMessage?: { conversationId: string, senderId: string }) => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get conversations where user is either user1 or user2 (using the new structure)
      const { data, error } = await (supabase as any)
        .from('conversations')
        .select(`
          *,
          listing:listings (
            id,
            title,
            price,
            image_url
          ),
          request:requests (
            id,
            title,
            budget,
            category
          )
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        setConversations([]);
        setUnreadCount(0);
        setLoading(false);
        return;
      }

      const conversationIds = data.map(conv => conv.id);

      // Get last messages for each conversation
      const { data: lastMessages, error: messagesError } = await (supabase as any)
        .from('messages')
        .select('*')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      // Get public profiles for all other participants
      const otherUserIds = data.map(conv => {
        // Determine who the other user is
        return conv.user1_id === user.id ? conv.user2_id : conv.user1_id;
      }).filter(Boolean);

      const { data: profiles, error: profilesError } = await (supabase as any)
        .from('public_profiles')
        .select('id, name, avatar_url')
        .in('id', otherUserIds);

      if (profilesError) throw profilesError;

      // Get user's own participation records for last_read_at
      const { data: userParticipations, error: userParticipationError } = await (supabase as any)
        .from('conversation_participants')
        .select('conversation_id, last_read_at')
        .eq('user_id', user.id)
        .in('conversation_id', conversationIds);

      if (userParticipationError) throw userParticipationError;

      const formattedConversations: ConversationWithDetails[] = data.filter((conv: any) => {
        // Only include conversation if it's active for current user
        const isUser1 = conv.user1_id === user.id;
        const isUser2 = conv.user2_id === user.id;
        return (isUser1 && conv.is_active_user1) || (isUser2 && conv.is_active_user2);
      }).map((conv: any) => {
        // Determine who the other user is
        const otherUserId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id;
        const otherUserProfile = profiles?.find((p: any) => p.id === otherUserId);
        
        // Find last message for this conversation
        const lastMessage = lastMessages?.find((m: any) => m.conversation_id === conv.id);
        
        // Find user's participation record for last_read_at
        const userParticipation = userParticipations?.find((up: any) => up.conversation_id === conv.id);
        
        // Calculate unread count
        const unread = lastMessage && lastMessage.sender_id !== user.id ? (
          userParticipation?.last_read_at 
            ? new Date(lastMessage.created_at) > new Date(userParticipation.last_read_at) ? 1 : 0
            : 1 // If last_read_at is null and there's a message from someone else, it's unread
        ) : 0;

        return {
          ...conv,
          participants: [], // We don't need this anymore with the new structure
          other_participant: otherUserProfile ? {
            id: otherUserId,
            name: otherUserProfile.name || 'Unknown User',
            avatar_url: otherUserProfile.avatar_url
          } : {
            id: otherUserId,
            name: 'Unknown User',
            avatar_url: undefined
          },
          last_message: lastMessage,
          unread_count: unread
        };
      }) || [];

      setConversations(formattedConversations);
      
      // Calculate unread conversations count (not total messages)
      let unreadConversations = formattedConversations.filter(conv => conv.unread_count > 0).length;
      
      // If this was called for a new conversation from real-time message, check if we need to increment
      if (newConversationFromMessage && newConversationFromMessage.senderId !== user.id) {
        const newConversation = formattedConversations.find(conv => conv.id === newConversationFromMessage.conversationId);
        if (newConversation && newConversation.unread_count > 0) {
          // The conversation is already counted in unreadConversations, so we're good
        } else {
          // This shouldn't happen, but just in case
          unreadConversations += 1;
        }
      }
      
      setUnreadCount(unreadConversations);
      
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  // Load messages for a conversation
  const loadMessages = async (conversationId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  // Send a message
  const sendMessage = async (request: SendMessageRequest) => {
    if (!user) return;

    try {
      // Reactivate conversation for both users (sender can reactivate for both)
      const { data: reactivateData, error: reactivateError } = await supabase
        .from('conversations')
        .update({ 
          is_active_user1: true,
          is_active_user2: true 
        })
        .eq('id', request.conversation_id)
        .select();

      if (reactivateError) {
        console.error('Error reactivating conversation:', reactivateError);
      } else {
      }

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: request.conversation_id,
          sender_id: user.id,
          content: request.content,
          message_type: request.message_type || 'text',
          reply_to_id: request.reply_to_id
        })
        .select()
        .single();

      if (error) throw error;

      // Update conversation's last_message_at
      await supabase
        .from('conversations')
        .update({ 
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', request.conversation_id);

      // Add the message to local state immediately (don't wait for real-time)
      setMessages(prev => [...prev, data]);

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  // Create a new conversation
  const createConversation = async (request: CreateConversationRequest): Promise<string | null> => {
    if (!user) return null;

    try {
      // Check if conversation already exists (including soft-deleted ones)
      // Use the same logic as ProductDetail and RequestDetail
      let existingConversations;
      
      if (request.listing_id) {
        // For listings
        const { data, error } = await supabase
          .from('conversations')
          .select('id, is_active_user1, is_active_user2, user1_id, user2_id')
          .eq('listing_id', request.listing_id)
          .or(`and(user1_id.eq.${user.id},user2_id.eq.${request.participant_id}),and(user1_id.eq.${request.participant_id},user2_id.eq.${user.id})`);
        
        if (error) throw error;
        existingConversations = data;
      } else if (request.request_id) {
        // For requests
        const { data, error } = await supabase
          .from('conversations')
          .select('id, is_active_user1, is_active_user2, user1_id, user2_id')
          .eq('request_id', request.request_id)
          .or(`and(user1_id.eq.${user.id},user2_id.eq.${request.participant_id}),and(user1_id.eq.${request.participant_id},user2_id.eq.${user.id})`);
        
        if (error) throw error;
        existingConversations = data;
      }

      if (existingConversations && existingConversations.length > 0) {
        // Conversation already exists - reactivate it for both users
        const conversationId = existingConversations[0].id;
        
        // Reactivate conversation for both users
        const { error: reactivateError } = await supabase
          .from('conversations')
          .update({ 
            is_active_user1: true,
            is_active_user2: true 
          })
          .eq('id', conversationId);
        
        if (reactivateError) throw reactivateError;
        
        return conversationId;
      }

      // Create new conversation
      // Determine user1 and user2 based on alphabetical order for consistency
      const sortedUserIds = [user.id, request.participant_id].sort();
      const user1_id = sortedUserIds[0];
      const user2_id = sortedUserIds[1];
      
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          user1_id,
          user2_id,
          listing_id: request.listing_id,
          request_id: request.request_id,
          last_message_at: new Date().toISOString(),
          is_active_user1: true,
          is_active_user2: true
        })
        .select()
        .single();

      if (convError) throw convError;

      // Add participants (still needed for last_read_at tracking)
      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert([
          {
            conversation_id: conversation.id,
            user_id: user.id,
            joined_at: new Date().toISOString()
          },
          {
            conversation_id: conversation.id,
            user_id: request.participant_id,
            joined_at: new Date().toISOString()
          }
        ]);

      if (participantsError) {
        console.error('Error creating conversation participants:', participantsError);
        throw new Error('Failed to create conversation participants');
      }

      return conversation.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  };

  // Start conversation from listing
  const startConversationFromListing = async (listingId: string, sellerId: string): Promise<string | null> => {
    if (!user || user.id === sellerId) return null;

    const conversationId = await createConversation({
      participant_id: sellerId,
      listing_id: listingId
    });

    return conversationId;
  };

  // Mark conversation as read
  const markAsRead = async (conversationId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('conversation_participants')
        .update({ 
          last_read_at: new Date().toISOString() 
        })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id);

      // Update local state
      setConversations(prev => {
        const updatedConversations = prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unread_count: 0 }
            : conv
        );
        
        // Recalculate unread conversations count
        const unreadConversations = updatedConversations.filter(conv => conv.unread_count > 0).length;
        setUnreadCount(unreadConversations);
        
        return updatedConversations;
      });

    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  // Delete a conversation (soft delete - hide from user)
  const deleteConversation = async (conversationId: string) => {
    if (!user) return;

    try {
      // Get the conversation to determine if user is user1 or user2
      const { data: conversation, error: getError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (getError) throw getError;

      // Determine if current user is user1 or user2
      const isUser1 = conversation.user1_id === user.id;
      const isUser2 = conversation.user2_id === user.id;

      if (!isUser1 && !isUser2) {
        throw new Error('User is not a participant in this conversation');
      }

      // Update the appropriate is_active column
      const updateData = isUser1 
        ? { is_active_user1: false } 
        : { is_active_user2: false };

      const { error: updateError } = await supabase
        .from('conversations')
        .update(updateData)
        .eq('id', conversationId);

      if (updateError) {
        console.error('Error soft deleting conversation:', updateError);
        throw updateError;
      }

      // Reload conversations to remove it from the list
      loadConversations();
      toast.success('Conversation deleted');
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error('Failed to delete conversation');
    }
  };

  // Get default message for a listing
  const getDefaultMessageForListing = (listingTitle: string | undefined): string => {
    if (!listingTitle) {
      return "Hi! I'm interested in your item.";
    }
    
    if (listingTitle.startsWith('Request: ')) {
      const requestTitle = listingTitle.replace('Request: ', '');
      return `Hi! I can help with your "${requestTitle}" request.`;
    }
    return `Hi! I'm interested in your "${listingTitle}" listing.`;
  };

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    // Add visibility change listener to mark active conversation as read when tab becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden && activeConversation && window.location.pathname === '/messages') {
        // Tab became visible and there's an active conversation on Messages page - mark it as read
        markAsRead(activeConversation.id);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Subscribe to new messages for conversations user participates in
    if (user) {
      // Subscription 1: Update active conversation messages
      const messagesSubscription = supabase
        .channel('messages')
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages'
            // No filter - listen to all messages, then check if user is participant
          }, 
          async (payload) => {
            const newMessage = payload.new as Message;
            
            // Check if this message is for a conversation the user participates in
            const { data: conversation } = await supabase
              .from('conversations')
              .select('user1_id, user2_id')
              .eq('id', newMessage.conversation_id)
              .single();
            
            if (!conversation || (conversation.user1_id !== user.id && conversation.user2_id !== user.id)) {
              return; // User doesn't participate in this conversation
            }
            
            // Add message if it's for the active conversation
            if (activeConversationRef.current?.id === newMessage.conversation_id) {
              setMessages(prev => {
                // Check if message already exists (avoid duplicates)
                const exists = prev.some(m => m.id === newMessage.id);
                if (exists) return prev;
                return [...prev, newMessage];
              });
              
              // Auto mark as read ONLY if:
              // 1. Message is from someone else (not your own message)
              // 2. Tab is visible (user can see the message)
              // 3. User is on the Messages page (not on another page)
              // 4. This conversation is actively selected (matches activeConversation)
              const shouldAutoMarkAsRead = (
                newMessage.sender_id !== user.id && 
                !document.hidden && 
                window.location.pathname === '/messages' &&
                activeConversationRef.current?.id === newMessage.conversation_id
              );
              
              if (shouldAutoMarkAsRead) {
                markAsRead(newMessage.conversation_id);
              }
            }
          }
        )
        .subscribe();

      // Subscription 2: Update conversations list for any new messages
      const conversationsSubscription = supabase
        .channel('conversation_updates')
        .on('postgres_changes',
          {
            event: 'INSERT',
            schema: 'public', 
            table: 'messages'
            // No filter - listen to all messages, then check if user is participant
          },
          async (payload) => {
            const newMessage = payload.new as Message;
            
            // Check if this message is for a conversation the user participates in
            const { data: conversation } = await supabase
              .from('conversations')
              .select('user1_id, user2_id')
              .eq('id', newMessage.conversation_id)
              .single();
            
            if (!conversation || (conversation.user1_id !== user.id && conversation.user2_id !== user.id)) {
              return; // User doesn't participate in this conversation
            }
            
            // Update the conversations list to show new last message and unread count
            setConversations(prev => {
              const conversationExists = prev.some(conv => conv.id === newMessage.conversation_id);
              
              // If conversation doesn't exist in current list, reload conversations
              if (!conversationExists) {
                // For new conversations, immediately update unread count and then reload
                loadConversations({
                  conversationId: newMessage.conversation_id,
                  senderId: newMessage.sender_id
                });
                return prev;
              }
              
              const updatedConversations = prev.map(conv => {
                if (conv.id === newMessage.conversation_id) {
                  return {
                    ...conv,
                    last_message: {
                      content: newMessage.content,
                      sender_id: newMessage.sender_id,
                      created_at: newMessage.created_at
                    },
                    last_message_at: newMessage.created_at,
                    unread_count: newMessage.sender_id !== user.id ? conv.unread_count + 1 : conv.unread_count
                  };
                }
                return conv;
              });
              
              // Sort conversations by last_message_at (most recent first)
              const sortedConversations = updatedConversations.sort((a, b) => 
                new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
              );
              
              // Update unread conversations count
              const unreadConversations = sortedConversations.filter(conv => conv.unread_count > 0).length;
              setUnreadCount(unreadConversations);
              
              return sortedConversations;
            });
          }
        )
        .subscribe();

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        messagesSubscription.unsubscribe();
        conversationsSubscription.unsubscribe();
      };
    }
  }, [user]);

  // Load conversations on mount
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  const value: MessagingContextType = {
    conversations,
    activeConversation,
    messages,
    loading,
    unreadCount,
    loadConversations,
    loadMessages,
    sendMessage,
    createConversation,
    setActiveConversation,
    markAsRead,
    startConversationFromListing,
    deleteConversation,
    getDefaultMessageForListing
  };

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  );
}; 