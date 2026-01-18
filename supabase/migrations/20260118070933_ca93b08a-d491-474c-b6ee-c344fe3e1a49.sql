-- =============================================
-- SECURITY FIX: Complete storage policies for scooter-photos
-- Only create INSERT policy (UPDATE and DELETE already exist)
-- =============================================

-- Drop any INSERT policies that might conflict
DROP POLICY IF EXISTS "Users can upload own scooter photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own scooter photos" ON storage.objects;

-- Create INSERT policy for user uploads
CREATE POLICY "Users can upload own scooter photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'scooter-photos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);