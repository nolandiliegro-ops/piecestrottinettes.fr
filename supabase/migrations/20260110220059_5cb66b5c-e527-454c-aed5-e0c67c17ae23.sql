-- Create storage bucket for part images
INSERT INTO storage.buckets (id, name, public)
VALUES ('part-images', 'part-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to part images
CREATE POLICY "Public can view part images"
ON storage.objects FOR SELECT
USING (bucket_id = 'part-images');

-- Allow authenticated users to upload part images (admin)
CREATE POLICY "Authenticated users can upload part images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'part-images' AND auth.role() = 'authenticated');

-- Allow authenticated users to update part images
CREATE POLICY "Authenticated users can update part images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'part-images' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete part images
CREATE POLICY "Authenticated users can delete part images"
ON storage.objects FOR DELETE
USING (bucket_id = 'part-images' AND auth.role() = 'authenticated');