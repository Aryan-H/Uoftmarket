export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_read: boolean;
  message_type: 'text' | 'image' | 'system';
  reply_to_id?: string;
}

export interface Conversation {
  id: string;
  user1_id: string; // First user in the conversation (alphabetically sorted)
  user2_id: string; // Second user in the conversation (alphabetically sorted)
  listing_id?: string; // Optional - only for conversations started from a listing
  request_id?: string; // Optional - only for conversations started from a request
  created_at: string;
  updated_at: string;
  last_message_at: string;
  is_active_user1?: boolean;
  is_active_user2?: boolean;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
  last_read_at?: string;
  is_active: boolean;
  user?: {
    id: string;
    name?: string;
    avatar_url?: string;
  };
}

export interface ConversationWithDetails extends Conversation {
  listing?: {
    id: string;
    title: string;
    price: number;
    image_url?: string;
  };
  request?: {
    id: string;
    title: string;
    budget?: number;
    category: string;
  };
  participants: ConversationParticipant[];
  last_message?: Message;
  unread_count: number;
  other_participant?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

export interface CreateConversationRequest {
  participant_id: string;
  listing_id?: string;
  request_id?: string;
}

export interface SendMessageRequest {
  conversation_id: string;
  content: string;
  message_type?: 'text' | 'image';
  reply_to_id?: string;
} 