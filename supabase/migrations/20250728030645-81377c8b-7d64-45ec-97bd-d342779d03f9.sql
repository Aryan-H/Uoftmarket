-- Turn off email notifications for all users
UPDATE public.notification_preferences 
SET new_listings_email = false, 
    updated_at = now();