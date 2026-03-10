-- Recreate the notification function and trigger from scratch
CREATE OR REPLACE FUNCTION public.notify_new_request()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  result RECORD;
  service_key TEXT;
BEGIN
  -- Get the service role key from vault
  SELECT decrypted_secret INTO service_key 
  FROM vault.decrypted_secrets 
  WHERE name = 'SUPABASE_SERVICE_ROLE_KEY';
  
  -- If we can't get the key from vault, use a fallback approach
  IF service_key IS NULL THEN
    service_key := 'REDACTED';
  END IF;

  -- Call the edge function to send notifications
  SELECT net.http_post(
    url := 'https://zumvhtmqbwxkcbhlqjyl.supabase.co/functions/v1/send-request-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := jsonb_build_object(
      'request_id', NEW.id,
      'title', NEW.title,
      'description', NEW.description,
      'budget', NEW.budget,
      'requester_id', NEW.user_id,
      'category', NEW.category
    )
  ) INTO result;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't prevent request creation
    RAISE WARNING 'Failed to send request notification: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- Now create the trigger
DROP TRIGGER IF EXISTS notify_new_request_trigger ON public.requests;

CREATE TRIGGER notify_new_request_trigger
  AFTER INSERT ON public.requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_request();