-- First verify the function exists, then recreate the trigger
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'notify_new_request' AND routine_schema = 'public';

-- Create the trigger (even if it exists, it will replace it)
DROP TRIGGER IF EXISTS notify_new_request_trigger ON public.requests;

CREATE TRIGGER notify_new_request_trigger
  AFTER INSERT ON public.requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_request();