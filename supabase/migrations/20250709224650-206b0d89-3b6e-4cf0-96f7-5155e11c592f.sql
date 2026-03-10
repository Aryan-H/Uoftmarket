-- Update the RLS policy to allow unauthenticated users to view public listings
DROP POLICY IF EXISTS "Anyone can view non-deleted listings" ON public.listings;

-- Create a new policy that allows both authenticated and unauthenticated users to view non-deleted listings
CREATE POLICY "Public can view non-deleted listings" 
ON public.listings 
FOR SELECT 
USING (
  (NOT deleted) AND 
  (
    -- Allow unauthenticated access
    auth.uid() IS NULL 
    OR 
    -- Allow authenticated users with valid tokens
    (auth.uid() IS NOT NULL AND NOT is_token_revoked())
  )
);