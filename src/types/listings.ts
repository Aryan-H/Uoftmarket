
export interface Listing {
  id: string;
  title: string;
  price: number;
  image: string;
  seller: string;
  sellerId: string;
  seller_id?: string; // Match Supabase column names
  category?: string;
  condition?: string;
  location?: string;
  description?: string;
  postedTime: string;
  posted_at?: string; // Match Supabase column names
  contactMethod?: string;
  contactInfo?: string;
  paymentMethods?: string[];
  views?: number;
  shipping?: boolean;
  deleted?: boolean;
  image_url?: string; // Match Supabase column names
  additionalImages?: string[]; // For multiple images
  additional_images?: string[]; // Match Supabase column names
  sellerAvatar?: string; // Seller avatar URL
  isPublic?: boolean; // Flag to indicate if the listing can be viewed by unauthenticated users
}

export interface FlaggedListing {
  id: string;
  reason: string;
}
