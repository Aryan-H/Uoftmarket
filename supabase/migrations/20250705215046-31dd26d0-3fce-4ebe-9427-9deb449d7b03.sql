
-- Enable the pg_net extension for HTTP requests from database functions
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Update the notify_new_listing function to use the correct HTTP method
CREATE OR REPLACE FUNCTION public.notify_new_listing()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result RECORD;
BEGIN
  -- Call the edge function to send notifications
  SELECT net.http_post(
    url := 'https://zumvhtmqbwxkcbhlqjyl.supabase.co/functions/v1/send-listing-notification',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || 
               current_setting('app.settings.service_role_key', true) || '"}',
    body := json_build_object(
      'listing_id', NEW.id,
      'title', NEW.title,
      'price', NEW.price,
      'seller_id', NEW.seller_id,
      'category', NEW.category,
      'location', NEW.location,
      'image_url', NEW.image_url
    )::text
  ) INTO result;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't prevent listing creation
    RAISE WARNING 'Failed to send listing notification: %', SQLERRM;
    RETURN NEW;
END;
$$;
