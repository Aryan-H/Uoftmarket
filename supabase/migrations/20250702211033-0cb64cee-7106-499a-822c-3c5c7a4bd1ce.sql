
-- Create notification preferences table
CREATE TABLE public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  new_listings_email BOOLEAN DEFAULT true,
  categories TEXT[] DEFAULT '{}',
  location_filter TEXT,
  max_price NUMERIC,
  frequency TEXT DEFAULT 'immediate' CHECK (frequency IN ('immediate', 'daily', 'weekly')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Create email logs table for tracking
CREATE TABLE public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  email_type TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'bounced')),
  error_message TEXT
);

-- Enable RLS on both tables
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for notification_preferences
CREATE POLICY "Users can view their own notification preferences"
  ON public.notification_preferences
  FOR SELECT
  USING (auth.uid() = user_id AND NOT is_token_revoked());

CREATE POLICY "Users can insert their own notification preferences"
  ON public.notification_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id AND NOT is_token_revoked());

CREATE POLICY "Users can update their own notification preferences"
  ON public.notification_preferences
  FOR UPDATE
  USING (auth.uid() = user_id AND NOT is_token_revoked());

-- RLS policies for email_logs (admin access only for now)
CREATE POLICY "Only system can insert email logs"
  ON public.email_logs
  FOR INSERT
  WITH CHECK (true);

-- Function to automatically create notification preferences for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_notification_prefs()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger to create notification preferences when a new profile is created
CREATE TRIGGER on_profile_created_notification_prefs
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_notification_prefs();

-- Function to send listing notification (will call edge function)
CREATE OR REPLACE FUNCTION public.notify_new_listing()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result RECORD;
BEGIN
  -- Call the edge function to send notifications
  SELECT net.http_post(
    url := 'https://zumvhtmqbwxkcbhlqjyl.supabase.co/functions/v1/send-listing-notification',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || 
               current_setting('app.settings.service_role_key', true) || '"}',
    body := json_build_object(
      'listing_id', NEW.id,
      'title', NEW.title,
      'price', NEW.price,
      'seller_id', NEW.seller_id,
      'category', NEW.category,
      'location', NEW.location,
      'image_url', NEW.image_url
    )::text
  ) INTO result;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't prevent listing creation
    RAISE WARNING 'Failed to send listing notification: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Trigger to send notifications when new listings are created
CREATE TRIGGER on_listing_created_send_notification
  AFTER INSERT ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_listing();
