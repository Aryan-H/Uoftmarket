-- Check if the function really exists and create trigger
DO $$
BEGIN
    -- Check if the function exists
    IF EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'notify_new_request' 
        AND routine_schema = 'public'
    ) THEN
        -- Drop and recreate the trigger
        DROP TRIGGER IF EXISTS notify_new_request_trigger ON public.requests;
        
        CREATE TRIGGER notify_new_request_trigger
            AFTER INSERT ON public.requests
            FOR EACH ROW
            EXECUTE FUNCTION public.notify_new_request();
            
        RAISE NOTICE 'Trigger created successfully';
    ELSE
        RAISE NOTICE 'Function notify_new_request does not exist';
    END IF;
END $$;