ALTER TABLE public.mesas
  ADD COLUMN IF NOT EXISTS end_at timestamptz,
  ADD COLUMN IF NOT EXISTS cover_image_url text;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('mesa-covers', 'mesa-covers', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view mesa covers"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'mesa-covers');

CREATE POLICY "Authenticated users can upload mesa covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'mesa-covers');

CREATE POLICY "Users can update own mesa covers"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'mesa-covers');

CREATE POLICY "Users can delete own mesa covers"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'mesa-covers');