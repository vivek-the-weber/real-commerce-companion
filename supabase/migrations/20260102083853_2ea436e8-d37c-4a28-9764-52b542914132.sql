-- Create storage bucket for hero videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('hero-videos', 'hero-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to hero videos
CREATE POLICY "Hero videos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'hero-videos');

-- Allow authenticated users (admins) to upload hero videos
CREATE POLICY "Admins can upload hero videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'hero-videos' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Allow admins to update hero videos
CREATE POLICY "Admins can update hero videos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'hero-videos' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Allow admins to delete hero videos
CREATE POLICY "Admins can delete hero videos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'hero-videos' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);