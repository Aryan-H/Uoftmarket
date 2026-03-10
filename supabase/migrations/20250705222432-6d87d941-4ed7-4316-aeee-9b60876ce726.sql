
-- Enable the pg_net extension for HTTP requests from database functions
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Verify the extension is working by checking if the function exists
-- This will help us confirm the extension loaded properly
SELECT EXISTS (
    SELECT 1 
    FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'net' AND p.proname = 'http_post'
) as http_post_function_exists;
