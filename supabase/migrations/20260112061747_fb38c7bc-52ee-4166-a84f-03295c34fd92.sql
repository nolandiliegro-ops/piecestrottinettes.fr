-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Only admins can upload scooter photos" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can update scooter photos" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can delete scooter photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can read scooter photos" ON storage.objects;

DROP POLICY IF EXISTS "Only admins can upload category images" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can update category images" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can delete category images" ON storage.objects;
DROP POLICY IF EXISTS "Public can read category images" ON storage.objects;

DROP POLICY IF EXISTS "Only admins can upload part images" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can update part images" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can delete part images" ON storage.objects;
DROP POLICY IF EXISTS "Public can read part images" ON storage.objects;

-- Recreate all storage policies for scooter-photos bucket
CREATE POLICY "Only admins can upload scooter photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'scooter-photos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update scooter photos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'scooter-photos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete scooter photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'scooter-photos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can read scooter photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'scooter-photos');

-- Storage policies for category-images bucket
CREATE POLICY "Only admins can upload category images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'category-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update category images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'category-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete category images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'category-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can read category images"
ON storage.objects FOR SELECT
USING (bucket_id = 'category-images');

-- Storage policies for part-images bucket
CREATE POLICY "Only admins can upload part images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'part-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update part images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'part-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete part images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'part-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can read part images"
ON storage.objects FOR SELECT
USING (bucket_id = 'part-images');