
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export const deleteProfileImage = async (supabaseAdmin, userId) => {
  try {
    // Get the profile data to check for avatar_url
    const { data: profileData } = await supabaseAdmin
      .from("profiles")
      .select("avatar_url")
      .eq("id", userId)
      .single();
    
    if (profileData?.avatar_url) {
      try {
        const imageUrl = profileData.avatar_url;
        const urlParts = imageUrl.match(/\/storage\/v1\/object\/public\/([^\/]+)\/(.+?)(\?.*)?$/);
        
        if (urlParts && urlParts.length >= 3) {
          const bucket = urlParts[1];
          const path = urlParts[2].split('?')[0];
          
          await supabaseAdmin.storage
            .from(bucket)
            .remove([path]);
            
          console.log(`Deleted profile image: ${path}`);
          return true;
        } else {
          console.warn("Could not parse profile image URL:", imageUrl);
          return false;
        }
      } catch (imageError) {
        console.warn("Error deleting profile image:", imageError);
        return false;
      }
    }
    return true; // No image to delete
  } catch (error) {
    console.warn("Error in deleteProfileImage:", error);
    return false;
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the Admin key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get the JWT token from the request headers
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "No authorization header" }),
        { 
          status: 401, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Verify the token and get the user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: userError?.message || "Invalid user token" 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const userId = user.id;
    console.log(`Processing account deletion for user: ${userId}`);

    // 1. Check if user has listings and attempt to delete them
    const { data: listings, error: listingsError } = await supabaseAdmin
      .from("listings")
      .select("id, image_url, additional_images")
      .eq("seller_id", userId);

    if (listingsError) {
      console.error("Error fetching user listings:", listingsError);
    } else if (listings && listings.length > 0) {
      console.log(`User has ${listings.length} listings to delete`);
      
      // Delete all images associated with listings
      for (const listing of listings) {
        // Delete main image if exists
        if (listing.image_url) {
          try {
            const imageUrl = listing.image_url;
            const urlParts = imageUrl.match(/\/storage\/v1\/object\/public\/([^\/]+)\/(.+?)(\?.*)?$/);
            
            if (urlParts && urlParts.length >= 3) {
              const bucket = urlParts[1];
              const path = urlParts[2].split('?')[0];
              
              await supabaseAdmin.storage
                .from(bucket)
                .remove([path]);
                
              console.log(`Deleted main image: ${path}`);
            }
          } catch (imageError) {
            console.warn("Error deleting listing image:", imageError);
          }
        }
        
        // Delete additional images if they exist
        if (listing.additional_images && listing.additional_images.length > 0) {
          for (const imgUrl of listing.additional_images) {
            if (imgUrl) {
              try {
                const urlParts = imgUrl.match(/\/storage\/v1\/object\/public\/([^\/]+)\/(.+?)(\?.*)?$/);
                
                if (urlParts && urlParts.length >= 3) {
                  const bucket = urlParts[1];
                  const path = urlParts[2].split('?')[0];
                  
                  await supabaseAdmin.storage
                    .from(bucket)
                    .remove([path]);
                    
                  console.log(`Deleted additional image: ${path}`);
                }
              } catch (imageError) {
                console.warn("Error deleting additional image:", imageError);
              }
            }
          }
        }
      }
      
      // Delete all listings
      const { error: deleteListingsError } = await supabaseAdmin
        .from("listings")
        .delete()
        .eq("seller_id", userId);
        
      if (deleteListingsError) {
        console.error("Error deleting user listings:", deleteListingsError);
        return new Response(
          JSON.stringify({
            success: false,
            error: "Failed to delete listings. " + deleteListingsError.message
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
      
      console.log(`Successfully deleted all listings for user ${userId}`);
    }

    // 2. Delete saved items
    await supabaseAdmin
      .from("saved_items")
      .delete()
      .eq("user_id", userId);
      
    // 3. Delete ratings given by the user
    await supabaseAdmin
      .from("ratings")
      .delete()
      .eq("reviewer_id", userId);
      
    // 4. IMPORTANT FIX: Delete ratings where the user is the seller
    const { error: sellerRatingsError } = await supabaseAdmin
      .from("ratings")
      .delete()
      .eq("seller_id", userId);
      
    if (sellerRatingsError) {
      console.error("Error deleting ratings received by the user:", sellerRatingsError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to delete ratings received by the user. " + sellerRatingsError.message
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    console.log(`Successfully deleted ratings received by user ${userId}`);
      
    // 5. Delete flagged listings by the user
    await supabaseAdmin
      .from("flagged_listings")
      .delete()
      .eq("flagger_id", userId);
    
    // 6. Delete profile image if it exists
    await deleteProfileImage(supabaseAdmin, userId);

    // 7. Finally, delete the user account
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteUserError) {
      console.error("Error deleting user account:", deleteUserError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: deleteUserError.message 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log(`Successfully deleted account for user ${userId}`);
    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (err) {
    console.error("Unexpected error in delete-account function:", err);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: err instanceof Error ? err.message : "Unknown error" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
