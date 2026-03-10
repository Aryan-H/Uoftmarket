-- Create the missing trigger that calls the notification function
CREATE TRIGGER on_listing_created_send_notification
  AFTER INSERT ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_listing();