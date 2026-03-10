-- Create a function to reset views when a listing is deleted
CREATE OR REPLACE FUNCTION public.reset_views_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- If the listing is being marked as deleted, reset views to 0
  IF NEW.deleted = true AND OLD.deleted = false THEN
    NEW.views = 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to reset views when listing is deleted
DROP TRIGGER IF EXISTS reset_views_on_delete_trigger ON public.listings;
CREATE TRIGGER reset_views_on_delete_trigger
  BEFORE UPDATE ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.reset_views_on_delete();