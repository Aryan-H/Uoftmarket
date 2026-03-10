
import { Request } from "@/types/requests";

/**
 * Check if a request is expired (more than 30 days old)
 */
export const isRequestExpired = (request: Request): boolean => {
  const createdAt = new Date(request.created_at);
  const now = new Date();
  const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
  return now.getTime() - createdAt.getTime() > thirtyDaysInMs;
};

/**
 * Get user's active (non-expired) requests
 */
export const getUserActiveRequests = (requests: Request[], userId: string): Request[] => {
  return requests.filter(request => 
    request.user_id === userId && 
    request.status !== 'expired' &&
    !isRequestExpired(request)
  );
};

/**
 * Get user's expired requests
 */
export const getUserExpiredRequests = (requests: Request[], userId: string): Request[] => {
  return requests.filter(request => 
    request.user_id === userId && 
    (request.status === 'expired' || isRequestExpired(request))
  );
};

/**
 * Create data for relisting a request
 */
export const relistRequest = (request: Request): Partial<Request> => {
  // Create a new timestamp for the current time
  const now = new Date().toISOString();
  
  return {
    status: 'open' as const,
    created_at: now,
    updated_at: now
  };
};
