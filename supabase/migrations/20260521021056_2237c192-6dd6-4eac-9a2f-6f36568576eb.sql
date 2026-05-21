
-- Make order-messages-images bucket private and replace public read with authenticated-only read
UPDATE storage.buckets SET public = false WHERE id = 'order-messages-images';

DROP POLICY IF EXISTS "Public can view message images" ON storage.objects;

CREATE POLICY "Authenticated users can view message images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'order-messages-images');
