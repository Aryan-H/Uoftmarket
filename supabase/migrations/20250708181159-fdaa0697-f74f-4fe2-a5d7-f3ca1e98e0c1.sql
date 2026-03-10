-- Remove the restrictive check constraint and add a more flexible one
ALTER TABLE public.requests DROP CONSTRAINT IF EXISTS requests_status_check;

-- Add a new check constraint that allows all valid status values
ALTER TABLE public.requests ADD CONSTRAINT requests_status_check 
CHECK (status IN ('open', 'pending', 'fulfilled', 'closed', 'expired'));