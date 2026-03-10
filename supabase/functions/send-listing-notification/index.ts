
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import React from "npm:react@18.3.1";
import { NewListingEmail } from "./_templates/new-listing.tsx";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ListingData {
  listing_id: string;
  title: string;
  price: number;
  seller_id: string;
  category?: string;
  location?: string;
  image_url?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing new listing notification request');
    
    const listingData: ListingData = await req.json();
    console.log('Listing data received:', listingData);

    // Get all users who want new listing notifications (excluding the seller)
    const { data: preferences, error: prefsError } = await supabase
      .from('notification_preferences')
      .select(`
        user_id,
        new_listings_email,
        categories,
        location_filter,
        max_price
      `)
      .eq('new_listings_email', true)
      .neq('user_id', listingData.seller_id);

    if (prefsError) {
      console.error('Error fetching notification preferences:', prefsError);
      throw prefsError;
    }

    if (!preferences || preferences.length === 0) {
      console.log('No users found who want notifications');
      return new Response(JSON.stringify({ message: 'No recipients found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${preferences.length} potential recipients`);

    // Filter users based on their preferences
    const filteredRecipients = preferences.filter(pref => {
      // Check category filter
      if (pref.categories && pref.categories.length > 0 && listingData.category) {
        if (!pref.categories.includes(listingData.category)) {
          return false;
        }
      }

      // Check location filter
      if (pref.location_filter && listingData.location) {
        if (!listingData.location.toLowerCase().includes(pref.location_filter.toLowerCase())) {
          return false;
        }
      }

      // Check price filter
      if (pref.max_price && listingData.price > pref.max_price) {
        return false;
      }

      return true;
    });

    console.log(`${filteredRecipients.length} recipients after filtering`);

    if (filteredRecipients.length === 0) {
      return new Response(JSON.stringify({ message: 'No recipients match criteria' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get profile information for filtered recipients
    const userIds = filteredRecipients.map(r => r.user_id);
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, name')
      .in('id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    // Create a map for quick profile lookup
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Get seller information
    const { data: sellerData, error: sellerError } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', listingData.seller_id)
      .maybeSingle();

    if (sellerError) {
      console.error('Error fetching seller data:', sellerError);
    }

    const sellerName = sellerData?.name || 'Someone';

    // Render email template
    const emailHtml = await renderAsync(
      React.createElement(NewListingEmail, {
        listingTitle: listingData.title,
        listingPrice: listingData.price,
        sellerName,
        category: listingData.category || 'Uncategorized',
        location: listingData.location || 'Location not specified',
        imageUrl: listingData.image_url,
        listingUrl: `${Deno.env.get('SITE_URL') || 'https://uoftmarket.com'}/product/${listingData.listing_id}`
      })
    );

    // Send emails to all recipients
    const emailPromises = filteredRecipients.map(async (recipient) => {
      const profile = profileMap.get(recipient.user_id);
      if (!profile || !profile.email) {
        console.error(`No profile found for user ${recipient.user_id}`);
        return { success: false, email: 'unknown', error: 'Profile not found' };
      }

      try {
        const { data: emailResult, error: emailError } = await resend.emails.send({
          from: 'UofT Market <notifications@uoftmarket.com>',
          to: [profile.email],
          subject: `New listing: ${listingData.title}`,
          html: emailHtml,
        });

        // Log email result
        await supabase
          .from('email_logs')
          .insert({
            listing_id: listingData.listing_id,
            recipient_email: profile.email,
            email_type: 'new_listing_notification',
            status: emailError ? 'failed' : 'sent',
            error_message: emailError?.message || null
          });

        if (emailError) {
          console.error(`Failed to send email to ${profile.email}:`, emailError);
          return { success: false, email: profile.email, error: emailError.message };
        }

        console.log(`Email sent successfully to ${profile.email}`);
        return { success: true, email: profile.email, messageId: emailResult?.id };
      } catch (error) {
        console.error(`Error sending email to ${profile.email}:`, error);
        return { success: false, email: profile.email, error: error.message };
      }
    });

    const results = await Promise.all(emailPromises);
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`Email sending complete: ${successCount} sent, ${failureCount} failed`);

    return new Response(JSON.stringify({ 
      message: 'Notification emails processed',
      sent: successCount,
      failed: failureCount,
      results 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in send-listing-notification function:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to send notifications',
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
