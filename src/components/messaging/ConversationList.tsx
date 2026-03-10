import React from 'react';
import { ConversationWithDetails } from '@/types/messages';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { MessageCircle, Package, Clock } from 'lucide-react';

interface ConversationListProps {
  conversations: ConversationWithDetails[];
  activeConversationId?: string;
  onSelectConversation: (conversation: ConversationWithDetails) => void;
  loading?: boolean;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center space-x-3 animate-pulse">
            <div className="w-12 h-12 bg-muted rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-6">
        <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">
          No conversations yet
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Start a conversation by messaging someone from a listing or fulfill a request to connect with users.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {conversations.map((conversation) => {
        const otherUser = conversation.other_participant;
        const isActive = conversation.id === activeConversationId;
        const hasUnread = conversation.unread_count > 0;

        return (
          <Button
            key={conversation.id}
            variant="ghost"
            className={cn(
              "w-full h-auto p-4 justify-start hover:bg-muted/50 rounded-none",
              isActive && "bg-muted",
              hasUnread && "bg-blue-50/50 hover:bg-blue-50/70"
            )}
            onClick={() => onSelectConversation(conversation)}
          >
            <div className="flex items-start gap-3 w-full">
              {/* Avatar */}
              <div className="relative">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={otherUser?.avatar_url} />
                  <AvatarFallback>
                    {otherUser?.name?.charAt(0)?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                {hasUnread && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-background" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 text-left">
                {/* Header */}
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "font-medium truncate",
                      hasUnread ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {otherUser?.name || 'Unknown User'}
                    </span>
                    {conversation.listing && (
                      <Package className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {hasUnread && (
                      <Badge variant="secondary" className="h-5 w-5 p-0 text-xs">
                        {conversation.unread_count}
                      </Badge>
                    )}
                    <Clock className="h-3 w-3 text-muted-foreground" />
                  </div>
                </div>

                {/* Listing info */}
                {conversation.listing && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      ${conversation.listing.price}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {conversation.listing.title}
                    </span>
                  </div>
                )}

                {/* Last message */}
                <div className="flex items-center justify-between">
                  <p className={cn(
                    "text-sm truncate flex-1",
                    hasUnread ? "font-medium text-foreground" : "text-muted-foreground"
                  )}>
                    {conversation.last_message?.content || 'No messages yet'}
                  </p>
                  <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                    {conversation.last_message_at && 
                      formatDistanceToNow(new Date(conversation.last_message_at), { 
                        addSuffix: false 
                      })}
                  </span>
                </div>
              </div>
            </div>
          </Button>
        );
      })}
    </div>
  );
}; 