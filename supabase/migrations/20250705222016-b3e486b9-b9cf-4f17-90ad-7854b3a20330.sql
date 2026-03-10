
-- First, let's create default notification preferences for all existing users who don't have any
INSERT INTO public.notification_preferences (user_id, new_listings_email, categories, location_filter, max_price, frequency)
SELECT 
    p.id,
    true,  -- Enable email notifications by default
    '{}',  -- Empty array means all categories
    null,  -- No location filter by default
    null,  -- No price limit by default
    'immediate'  -- Immediate notifications by default
FROM public.profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM public.notification_preferences np 
    WHERE np.user_id = p.id
);

-- Update the trigger function to create notification preferences with better defaults
CREATE OR REPLACE FUNCTION public.handle_new_user_notification_prefs()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.notification_preferences (
    user_id, 
    new_listings_email, 
    categories, 
    location_filter, 
    max_price, 
    frequency
  )
  VALUES (
    NEW.id,
    true,        -- Enable notifications by default
    '{}',        -- All categories by default (empty array)
    null,        -- No location filter
    null,        -- No price limit
    'immediate'  -- Immediate notifications
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;
