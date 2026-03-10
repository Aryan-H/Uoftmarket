import React, { useEffect, useRef } from 'react';
import { ConversationWithDetails, Message } from '@/types/messages';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowLeft, MoreVertical, Package, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatWindowProps {
  conversation: ConversationWithDetails;
  messages: Message[];
  onSendMessage: (content: string) => void;
  onBack?: () => void;
  onDeleteConversation?: (conversationId: string) => void;
  defaultMessage?: string;
  loading?: boolean;
  className?: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  messages,
  onSendMessage,
  onBack,
  onDeleteConversation,
  defaultMessage,
  loading = false,
  className
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const otherUser = conversation.other_participant;
  const prevMessageCountRef = useRef(0);
  const prevConversationIdRef = useRef<string | null>(null);

  // Auto-scroll messages container to bottom when new messages are added
  useEffect(() => {
    // Only scroll if messages were added (count increased)
    if (messages.length > prevMessageCountRef.current && prevMessageCountRef.current > 0) {
      // Scroll only within the messages container, not the entire page
      messagesEndRef.current?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end',
        inline: 'nearest'
      });
    }
    prevMessageCountRef.current = messages.length;
  }, [messages]);

  // Scroll to bottom when conversation changes (user clicks on different conversation)
  useEffect(() => {
    if (conversation.id !== prevConversationIdRef.current) {
      // This is a new conversation, scroll to bottom immediately
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ 
          behavior: 'instant',
          block: 'end',
          inline: 'nearest'
        });
      }, 100); // Small delay to ensure messages are rendered
      
      prevConversationIdRef.current = conversation.id;
      prevMessageCountRef.current = messages.length; // Reset message count for new conversation
    }
  }, [conversation.id, messages.length]);

  // Group consecutive messages from the same sender
  const groupedMessages = messages.reduce((groups: Message[][], message, index) => {
    const prevMessage = messages[index - 1];
    const isConsecutive = prevMessage && 
      prevMessage.sender_id === message.sender_id &&
      new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime() < 60000; // Within 1 minute

    if (isConsecutive) {
      const lastGroup = groups[groups.length - 1];
      lastGroup.push(message);
    } else {
      groups.push([message]);
    }

    return groups;
  }, []);

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Header */}
      <div className="border-b p-4 bg-background/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onBack}
                className="lg:hidden"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherUser?.avatar_url} />
              <AvatarFallback>
                {otherUser?.name?.charAt(0)?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate">
                {otherUser?.name || 'Unknown User'}
              </h3>
              {conversation.listing && (
                <div className="flex items-center gap-2 mt-1">
                  <Package className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground truncate">
                    {conversation.listing.title}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    ${conversation.listing.price}
                  </Badge>
                </div>
              )}
              {conversation.request && (
                <div className="flex items-center gap-2 mt-1">
                  <Package className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground truncate">
                    Request: {conversation.request.title}
                  </span>
                  {conversation.request.budget && (
                    <Badge variant="outline" className="text-xs">
                      Budget: ${conversation.request.budget}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onDeleteConversation?.(conversation.id)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Conversation
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Listing card if conversation is related to a listing */}
        {conversation.listing && (
          <div className="mt-3 p-3 bg-muted/50 rounded-lg border">
            <div className="flex items-center gap-3">
              {conversation.listing.image_url && (
                <img 
                  src={conversation.listing.image_url} 
                  alt={conversation.listing.title}
                  className="w-12 h-12 object-cover rounded"
                />
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">
                  {conversation.listing.title}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg font-bold text-green-600">
                    ${conversation.listing.price}
                  </span>
                  <Badge 
                    variant="default"
                    className="text-xs"
                  >
                    Available
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <p className="text-muted-foreground mb-2">No messages yet</p>
            <p className="text-sm text-muted-foreground">
              Start the conversation by sending a message below
            </p>
          </div>
        ) : (
          groupedMessages.map((group, groupIndex) => (
            <div key={groupIndex}>
              {group.map((message, messageIndex) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  senderName={otherUser?.name}
                  senderAvatar={otherUser?.avatar_url}
                  isConsecutive={messageIndex > 0}
                  isLastInGroup={messageIndex === group.length - 1}
                />
              ))}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <MessageInput 
        onSendMessage={onSendMessage}
        disabled={loading}
        placeholder={`Message ${otherUser?.name || 'user'}...`}
        defaultValue={defaultMessage}
      />
    </div>
  );
}; 