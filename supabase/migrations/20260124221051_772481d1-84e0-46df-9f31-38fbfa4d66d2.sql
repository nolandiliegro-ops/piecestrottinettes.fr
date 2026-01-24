-- ============================================================
-- RESET COMPLET DES POLICIES SELECT POUR LE CATALOGUE
-- Garantit que 'anon' ET 'authenticated' peuvent lire les données
-- ============================================================

-- BRANDS
DROP POLICY IF EXISTS "Public can read brands" ON public.brands;
DROP POLICY IF EXISTS "anon_read_brands" ON public.brands;
DROP POLICY IF EXISTS "auth_read_brands" ON public.brands;

CREATE POLICY "anon_read_brands" ON public.brands FOR SELECT TO anon USING (true);
CREATE POLICY "auth_read_brands" ON public.brands FOR SELECT TO authenticated USING (true);

-- CATEGORIES
DROP POLICY IF EXISTS "Public can read categories" ON public.categories;
DROP POLICY IF EXISTS "anon_read_categories" ON public.categories;
DROP POLICY IF EXISTS "auth_read_categories" ON public.categories;

CREATE POLICY "anon_read_categories" ON public.categories FOR SELECT TO anon USING (true);
CREATE POLICY "auth_read_categories" ON public.categories FOR SELECT TO authenticated USING (true);

-- PARTS
DROP POLICY IF EXISTS "Public can read parts" ON public.parts;
DROP POLICY IF EXISTS "anon_read_parts" ON public.parts;
DROP POLICY IF EXISTS "auth_read_parts" ON public.parts;

CREATE POLICY "anon_read_parts" ON public.parts FOR SELECT TO anon USING (true);
CREATE POLICY "auth_read_parts" ON public.parts FOR SELECT TO authenticated USING (true);

-- SCOOTER_MODELS
DROP POLICY IF EXISTS "Public can read scooter_models" ON public.scooter_models;
DROP POLICY IF EXISTS "anon_read_scooter_models" ON public.scooter_models;
DROP POLICY IF EXISTS "auth_read_scooter_models" ON public.scooter_models;

CREATE POLICY "anon_read_scooter_models" ON public.scooter_models FOR SELECT TO anon USING (true);
CREATE POLICY "auth_read_scooter_models" ON public.scooter_models FOR SELECT TO authenticated USING (true);

-- PART_COMPATIBILITY
DROP POLICY IF EXISTS "Public can read part_compatibility" ON public.part_compatibility;
DROP POLICY IF EXISTS "anon_read_part_compatibility" ON public.part_compatibility;
DROP POLICY IF EXISTS "auth_read_part_compatibility" ON public.part_compatibility;

CREATE POLICY "anon_read_part_compatibility" ON public.part_compatibility FOR SELECT TO anon USING (true);
CREATE POLICY "auth_read_part_compatibility" ON public.part_compatibility FOR SELECT TO authenticated USING (true);