import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './client';

declare module '@supabase/supabase-js' {
  interface Database {
    public: {
      Tables: {
        flagged_listings: {
          Row: {
            flagged_at: string | null
            flagger_id: string
            id: string
            listing_id: string
            reason: string
            resolved: boolean | null
          }
          Insert: {
            flagged_at?: string | null
            flagger_id: string
            id?: string
            listing_id: string
            reason: string
            resolved?: boolean | null
          }
          Update: {
            flagged_at?: string | null
            flagger_id?: string
            id?: string
            listing_id?: string
            reason?: string
            resolved?: boolean | null
          }
          Relationships: [
            {
              foreignKeyName: "flagged_listings_flagger_id_fkey"
              columns: ["flagger_id"]
              isOneToOne: false
              referencedRelation: "profiles"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "flagged_listings_listing_id_fkey"
              columns: ["listing_id"]
              isOneToOne: false
              referencedRelation: "listings"
              referencedColumns: ["id"]
            },
          ]
        }
        listings: {
          Row: {
            additional_images: string[] | null
            category: string | null
            condition: string | null
            contact_info: string | null
            contact_method: string | null
            deleted: boolean | null
            description: string | null
            id: string
            image_url: string | null
            location: string | null
            payment_methods: string[] | null
            posted_at: string | null
            price: number
            seller_id: string
            shipping: boolean | null
            title: string
            updated_at: string | null
            views: number | null
          }
          Insert: {
            additional_images?: string[] | null
            category?: string | null
            condition?: string | null
            contact_info?: string | null
            contact_method?: string | null
            deleted?: boolean | null
            description?: string | null
            id?: string
            image_url?: string | null
            location?: string | null
            payment_methods?: string[] | null
            posted_at?: string | null
            price: number
            seller_id: string
            shipping?: boolean | null
            title: string
            updated_at?: string | null
            views?: number | null
          }
          Update: {
            additional_images?: string[] | null
            category?: string | null
            condition?: string | null
            contact_info?: string | null
            contact_method?: string | null
            deleted?: boolean | null
            description?: string | null
            id?: string
            image_url?: string | null
            location?: string | null
            payment_methods?: string[] | null
            posted_at?: string | null
            price?: number
            seller_id?: string
            shipping?: boolean | null
            title?: string
            updated_at?: string | null
            views?: number | null
          }
          Relationships: [
            {
              foreignKeyName: "listings_seller_id_fkey"
              columns: ["seller_id"]
              isOneToOne: false
              referencedRelation: "profiles"
              referencedColumns: ["id"]
            },
          ]
        }
        newsletter_subscribers: {
          Row: {
            email: string
            id: string
            is_active: boolean
            subscribed_at: string
          }
          Insert: {
            email: string
            id?: string
            is_active?: boolean
            subscribed_at?: string
          }
          Update: {
            email?: string
            id?: string
            is_active?: boolean
            subscribed_at?: string
          }
          Relationships: []
        }
        profiles: {
          Row: {
            avatar_url: string | null
            bio: string | null
            email: string
            id: string
            name: string
            phone: string | null
            program: string | null
            year: string | null
          }
          Insert: {
            avatar_url?: string | null
            bio?: string | null
            email: string
            id: string
            name: string
            phone?: string | null
            program?: string | null
            year?: string | null
          }
          Update: {
            avatar_url?: string | null
            bio?: string | null
            email?: string
            id?: string
            name?: string
            phone?: string | null
            program?: string | null
            year?: string | null
          }
          Relationships: []
        }
        public_profiles: {
          Row: {
            id: string;
            name: string;
            program: string | null;
            year: string | null;
            bio: string | null;
            avatar_url: string | null;
          };
          Insert: {
            id: string;
            name: string;
            program?: string | null;
            year?: string | null;
            bio?: string | null;
            avatar_url?: string | null;
          };
          Update: {
            id?: string;
            name?: string;
            program?: string | null;
            year?: string | null;
            bio?: string | null;
            avatar_url?: string | null;
          };
          Relationships: [
            {
              foreignKeyName: "fk_public_profiles_profiles";
              columns: ["id"];
              isOneToOne: true;
              referencedRelation: "profiles";
              referencedColumns: ["id"];
            }
          ];
        }
        ratings: {
          Row: {
            comment: string | null
            created_at: string | null
            id: string
            rating: number
            reviewer_id: string
            seller_id: string
          }
          Insert: {
            comment?: string | null
            created_at?: string | null
            id?: string
            rating: number
            reviewer_id: string
            seller_id: string
          }
          Update: {
            comment?: string | null
            created_at?: string | null
            id?: string
            rating?: number
            reviewer_id?: string
            seller_id?: string
          }
          Relationships: [
            {
              foreignKeyName: "ratings_reviewer_id_fkey"
              columns: ["reviewer_id"]
              isOneToOne: false
              referencedRelation: "profiles"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "ratings_seller_id_fkey"
              columns: ["seller_id"]
              isOneToOne: false
              referencedRelation: "profiles"
              referencedColumns: ["id"]
            },
          ]
        }
        requests: {
          Row: {
            budget: number | null
            category: string | null
            created_at: string
            description: string
            fulfilled_at: string | null
            fulfilled_by: string | null
            fulfilled_listing_id: string | null
            id: string
            image_url: string | null
            status: string
            title: string
            updated_at: string
            user_id: string
          }
          Insert: {
            budget?: number | null
            category?: string | null
            created_at?: string
            description: string
            fulfilled_at?: string | null
            fulfilled_by?: string | null
            fulfilled_listing_id?: string | null
            id?: string
            image_url?: string | null
            status?: string
            title: string
            updated_at?: string
            user_id: string
          }
          Update: {
            budget?: number | null
            category?: string | null
            created_at?: string
            description?: string
            fulfilled_at?: string | null
            fulfilled_by?: string | null
            fulfilled_listing_id?: string | null
            id?: string
            image_url?: string | null
            status?: string
            title?: string
            updated_at?: string
            user_id?: string
          }
          Relationships: [
            {
              foreignKeyName: "requests_user_id_fkey"
              columns: ["user_id"]
              isOneToOne: false
              referencedRelation: "profiles"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "requests_fulfilled_by_fkey"
              columns: ["fulfilled_by"]
              isOneToOne: false
              referencedRelation: "profiles"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "requests_fulfilled_listing_id_fkey"
              columns: ["fulfilled_listing_id"]
              isOneToOne: false
              referencedRelation: "listings"
              referencedColumns: ["id"]
            }
          ]
        }
        saved_items: {
          Row: {
            id: string
            listing_id: string
            saved_at: string | null
            user_id: string
          }
          Insert: {
            id?: string
            listing_id: string
            saved_at?: string | null
            user_id: string
          }
          Update: {
            id?: string
            listing_id?: string
            saved_at?: string | null
            user_id?: string
          }
          Relationships: [
            {
              foreignKeyName: "saved_items_listing_id_fkey"
              columns: ["listing_id"]
              isOneToOne: false
              referencedRelation: "listings"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "saved_items_user_id_fkey"
              columns: ["user_id"]
              isOneToOne: false
              referencedRelation: "profiles"
              referencedColumns: ["id"]
            },
          ]
        }
      }
      Views: {
        [_ in never]: never
      }
      Functions: {
        get_seller_rating: {
          Args: { seller_uuid: string }
          Returns: {
            average_rating: number
            review_count: number
          }[]
        }
        get_user_conversations: {
          Args: { user_uuid: string }
          Returns: {
            partner_id: string
            partner_name: string
            latest_message: string
            latest_timestamp: string
            unread_count: number
            listing_id: string
            listing_title: string
          }[]
        }
        increment_listing_views: {
          Args: { listing_uuid: string }
          Returns: undefined
        }
      }
      Enums: {
        [_ in never]: never
      }
      CompositeTypes: {
        [_ in never]: never
      }
    }
  }
}
