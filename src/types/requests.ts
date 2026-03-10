
// Define request-related types for the application
export interface Request {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string | null;
  budget: number | null;
  status: 'open' | 'pending' | 'fulfilled' | 'closed' | 'expired';
  created_at: string;
  updated_at: string;
  image_url?: string | null;
  fulfilled_at?: string | null;
  fulfilled_by?: string | null;
  fulfilled_listing_id?: string | null;
  profiles?: {
    name: string;
    avatar_url: string | null;
  };
}
