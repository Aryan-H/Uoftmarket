
-- Create the missing trigger for listing notifications
DROP TRIGGER IF EXISTS notify_new_listing_trigger ON public.listings;

CREATE TRIGGER notify_new_listing_trigger
  AFTER INSERT ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_listing();
