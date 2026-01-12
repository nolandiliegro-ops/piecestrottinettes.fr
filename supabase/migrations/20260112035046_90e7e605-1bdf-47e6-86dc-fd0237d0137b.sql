-- =============================================
-- SECURITY FIX: Implement Role-Based Access Control
-- =============================================

-- 1. Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 2. Create user_roles table (separate from profiles to prevent privilege escalation)
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE (user_id, role)
);

-- 3. Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 5. RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Only admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- UPDATE ADMIN TABLE POLICIES: Restrict to admins only
-- =============================================

-- PARTS table: Drop old permissive policies, add admin-only
DROP POLICY IF EXISTS "Authenticated users can insert parts" ON public.parts;
DROP POLICY IF EXISTS "Authenticated users can update parts" ON public.parts;

CREATE POLICY "Only admins can insert parts"
ON public.parts
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update parts"
ON public.parts
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete parts"
ON public.parts
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- SCOOTER_MODELS table
DROP POLICY IF EXISTS "Authenticated users can insert scooter_models" ON public.scooter_models;
DROP POLICY IF EXISTS "Authenticated users can update scooter_models" ON public.scooter_models;

CREATE POLICY "Only admins can insert scooter_models"
ON public.scooter_models
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update scooter_models"
ON public.scooter_models
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete scooter_models"
ON public.scooter_models
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- CATEGORIES table
DROP POLICY IF EXISTS "Authenticated users can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated users can update categories" ON public.categories;

CREATE POLICY "Only admins can insert categories"
ON public.categories
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update categories"
ON public.categories
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete categories"
ON public.categories
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- BRANDS table
DROP POLICY IF EXISTS "Authenticated users can insert brands" ON public.brands;
DROP POLICY IF EXISTS "Authenticated users can update brands" ON public.brands;

CREATE POLICY "Only admins can insert brands"
ON public.brands
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update brands"
ON public.brands
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete brands"
ON public.brands
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- PART_COMPATIBILITY table
DROP POLICY IF EXISTS "Authenticated users can insert part_compatibility" ON public.part_compatibility;
DROP POLICY IF EXISTS "Authenticated users can update part_compatibility" ON public.part_compatibility;
DROP POLICY IF EXISTS "Authenticated users can delete part_compatibility" ON public.part_compatibility;

CREATE POLICY "Only admins can insert part_compatibility"
ON public.part_compatibility
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update part_compatibility"
ON public.part_compatibility
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete part_compatibility"
ON public.part_compatibility
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- STORAGE POLICIES: Restrict part-images to admins
-- =============================================

-- Drop existing overly permissive policies for part-images
DROP POLICY IF EXISTS "Authenticated users can upload part images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update part images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete part images" ON storage.objects;

-- Create admin-only policies for part-images bucket
CREATE POLICY "Only admins can upload part images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'part-images' AND
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Only admins can update part images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'part-images' AND
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Only admins can delete part images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'part-images' AND
  public.has_role(auth.uid(), 'admin')
);

-- =============================================
-- CATEGORY_IMAGES: Restrict to admins
-- =============================================

DROP POLICY IF EXISTS "Anyone can view category images" ON public.category_images;

CREATE POLICY "Public can view category images"
ON public.category_images
FOR SELECT
USING (true);

CREATE POLICY "Only admins can insert category images"
ON public.category_images
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update category images"
ON public.category_images
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete category images"
ON public.category_images
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));