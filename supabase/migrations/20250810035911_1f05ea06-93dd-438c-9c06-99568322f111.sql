-- Drop trigger if it exists and recreate it
DROP TRIGGER IF EXISTS notify_new_request_trigger ON public.requests;

-- Create trigger for request notifications
CREATE TRIGGER notify_new_request_trigger
  AFTER INSERT ON public.requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_request();