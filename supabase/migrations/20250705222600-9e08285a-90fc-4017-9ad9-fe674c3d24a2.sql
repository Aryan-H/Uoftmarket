
-- First, let's create the missing trigger that calls the notification function
CREATE TRIGGER on_listing_created_send_notification
  AFTER INSERT ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_listing();

-- Update the notification function to use the correct service role key from secrets
CREATE OR REPLACE FUNCTION public.notify_new_listing()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result RECORD;
  service_key TEXT;
BEGIN
  -- Get the service role key from vault (where Supabase stores secrets)
  SELECT decrypted_secret INTO service_key 
  FROM vault.decrypted_secrets 
  WHERE name = 'SUPABASE_SERVICE_ROLE_KEY';
  
  -- If we can't get the key from vault, use a fallback approach
  IF service_key IS NULL THEN
    service_key := 'REDACTED';
  END IF;

  -- Call the edge function to send notifications
  SELECT net.http_post(
    url := 'https://zumvhtmqbwxkcbhlqjyl.supabase.co/functions/v1/send-listing-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := jsonb_build_object(
      'listing_id', NEW.id,
      'title', NEW.title,
      'price', NEW.price,
      'seller_id', NEW.seller_id,
      'category', NEW.category,
      'location', NEW.location,
      'image_url', NEW.image_url
    )
  ) INTO result;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't prevent listing creation
    RAISE WARNING 'Failed to send listing notification: %', SQLERRM;
    RETURN NEW;
END;
$$;
