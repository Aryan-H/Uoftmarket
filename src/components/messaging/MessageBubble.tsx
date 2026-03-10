import React from 'react';
import { Message } from '@/types/messages';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  message: Message;
  senderName?: string;
  senderAvatar?: string;
  showAvatar?: boolean;
  isConsecutive?: boolean;
  isLastInGroup?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  senderName,
  senderAvatar,
  showAvatar = true,
  isConsecutive = false,
  isLastInGroup = false
}) => {
  const { user } = useAuth();
  const isOwnMessage = message.sender_id === user?.id;

  return (
    <div className={cn(
      "flex gap-3",
      isOwnMessage ? "justify-end" : "justify-start",
      // Only add bottom margin after the last message in a group
      isLastInGroup ? "mb-4" : "mb-1"
    )}>
      {/* Avatar for other users - only show for non-consecutive messages */}
      {!isOwnMessage && showAvatar && !isConsecutive && (
        <Avatar className="w-8 h-8 mt-1">
          <AvatarImage src={senderAvatar} />
          <AvatarFallback className="text-xs">
            {senderName?.charAt(0)?.toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
      )}
      
      {/* Spacer for consecutive messages from other users */}
      {!isOwnMessage && isConsecutive && (
        <div className="w-8" />
      )}

      <div className={cn(
        "flex flex-col",
        isOwnMessage ? "items-end" : "items-start",
        "max-w-[70%]"
      )}>
        {/* Sender name and timestamp for other users - only non-consecutive messages */}
        {!isOwnMessage && !isConsecutive && senderName && (
          <div className="flex items-center gap-2 mb-1 px-1">
            <span className="text-xs text-muted-foreground">
              {senderName}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
            </span>
          </div>
        )}

        {/* Message content */}
        <div className={cn(
          "rounded-2xl px-4 py-2 break-words",
          isOwnMessage 
            ? "bg-primary text-primary-foreground" 
            : "bg-muted",
          // Adjust border radius for consecutive messages
          isOwnMessage ? (
            isConsecutive ? "rounded-br-md" : "rounded-br-md"
          ) : (
            isConsecutive ? "rounded-bl-md" : "rounded-bl-md"
          )
        )}>
          {message.message_type === 'system' ? (
            <span className="italic text-sm text-muted-foreground">
              {message.content}
            </span>
          ) : (
            <span className="text-sm whitespace-pre-wrap">
              {message.content}
            </span>
          )}
        </div>

        {/* Timestamp - show under last message in group for own messages only */}
        {isLastInGroup && isOwnMessage && (
          <span className="text-xs text-muted-foreground mt-1 px-1">
            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
          </span>
        )}
      </div>
    </div>
  );
}; 