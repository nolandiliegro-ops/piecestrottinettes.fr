-- Permettre aux admins d'uploader des photos de scooters
CREATE POLICY "Admins can upload scooter photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'scooter-photos' 
  AND has_role(auth.uid(), 'admin')
);