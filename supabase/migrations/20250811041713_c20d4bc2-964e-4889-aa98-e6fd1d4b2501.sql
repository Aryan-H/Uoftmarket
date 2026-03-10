-- Check current triggers and create missing request trigger
SELECT 
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name LIKE '%notify%';

-- Create the missing trigger for request notifications
DROP TRIGGER IF EXISTS notify_new_request_trigger ON public.requests;

CREATE TRIGGER notify_new_request_trigger
  AFTER INSERT ON public.requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_request();