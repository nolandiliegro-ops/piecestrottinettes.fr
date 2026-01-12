-- Phase 1: Fix Amazon image URLs format (.AC_SL → ._AC_SL_)
UPDATE parts
SET image_url = REPLACE(
  REPLACE(image_url, '.AC_SL1000.jpg', '._AC_SL1000_.jpg'),
  '.AC_SL1500.jpg', '._AC_SL1500_.jpg'
)
WHERE image_url LIKE '%amazon%'
  AND image_url LIKE '%.AC_SL%'
  AND image_url NOT LIKE '%._AC_%';

-- Phase 4: RLS Policies for INSERT and UPDATE on parts and scooter_models

-- Allow authenticated users to insert parts
CREATE POLICY "Authenticated users can insert parts"
  ON parts FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update parts
CREATE POLICY "Authenticated users can update parts"
  ON parts FOR UPDATE
  TO authenticated
  USING (true);

-- Allow authenticated users to insert scooter_models
CREATE POLICY "Authenticated users can insert scooter_models"
  ON scooter_models FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update scooter_models
CREATE POLICY "Authenticated users can update scooter_models"
  ON scooter_models FOR UPDATE
  TO authenticated
  USING (true);