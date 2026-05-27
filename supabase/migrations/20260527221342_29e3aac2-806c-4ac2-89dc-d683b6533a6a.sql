CREATE POLICY "Public can read user_garage of public profiles"
ON user_garage FOR SELECT
TO anon, authenticated
USING (
  user_id IN (
    SELECT id FROM profiles WHERE is_public = true
  )
);