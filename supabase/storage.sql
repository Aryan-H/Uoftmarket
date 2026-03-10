
-- Create the Listing Images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES 
  ('listing-images', 'listing-images', true, false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- UPDATED RLS POLICIES WITH SIMPLER, MORE PERMISSIVE STRUCTURE
-- Allow all authenticated users to upload any file to listing-images bucket
CREATE POLICY "Allow authenticated users to upload" 
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'listing-images');

-- Allow authenticated users to update their own files
CREATE POLICY "Allow users to update their own files" 
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'listing-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow everyone to view images in the listing-images bucket
CREATE POLICY "Allow public to view images" 
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'listing-images');

-- Allow users to delete files where the first folder segment matches their user ID
CREATE POLICY "Allow users to delete their own images" 
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'listing-images' AND auth.uid()::text = (storage.foldername(name))[1]);
