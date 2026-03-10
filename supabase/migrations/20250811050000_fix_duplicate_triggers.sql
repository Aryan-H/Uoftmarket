-- Clean up duplicate notification triggers and ensure only one per table

-- Requests: drop any duplicate/legacy triggers then recreate a single trigger
DROP TRIGGER IF EXISTS new_request_notification ON public.requests;
DROP TRIGGER IF EXISTS notify_new_request_trigger ON public.requests;

CREATE TRIGGER notify_new_request_trigger
  AFTER INSERT ON public.requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_request();

-- Listings: drop any duplicate/legacy triggers then recreate a single trigger
DROP TRIGGER IF EXISTS on_listing_created_send_notification ON public.listings;
DROP TRIGGER IF EXISTS notify_new_listing_trigger ON public.listings;

CREATE TRIGGER notify_new_listing_trigger
  AFTER INSERT ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_listing();


