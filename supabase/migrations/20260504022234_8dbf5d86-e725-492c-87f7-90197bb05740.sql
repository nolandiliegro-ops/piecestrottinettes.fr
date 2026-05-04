-- Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('rider-avatars','rider-avatars',true,5242880,
  ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public=EXCLUDED.public,
  file_size_limit=EXCLUDED.file_size_limit,
  allowed_mime_types=EXCLUDED.allowed_mime_types;

-- Storage policies
DROP POLICY IF EXISTS "Public read rider avatars" ON storage.objects;
CREATE POLICY "Public read rider avatars" ON storage.objects
  FOR SELECT USING (bucket_id='rider-avatars');

DROP POLICY IF EXISTS "Owners insert rider avatars" ON storage.objects;
CREATE POLICY "Owners insert rider avatars" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id='rider-avatars'
    AND auth.uid()::text=(storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Owners update rider avatars" ON storage.objects;
CREATE POLICY "Owners update rider avatars" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id='rider-avatars'
    AND auth.uid()::text=(storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Owners delete rider avatars" ON storage.objects;
CREATE POLICY "Owners delete rider avatars" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id='rider-avatars'
    AND auth.uid()::text=(storage.foldername(name))[1]);

-- Profile columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS rider_location text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='profiles_bio_length_chk') THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_bio_length_chk
      CHECK (bio IS NULL OR char_length(bio) <= 150);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='profiles_rider_location_length_chk') THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_rider_location_length_chk
      CHECK (rider_location IS NULL OR char_length(rider_location) <= 60);
  END IF;
END $$;