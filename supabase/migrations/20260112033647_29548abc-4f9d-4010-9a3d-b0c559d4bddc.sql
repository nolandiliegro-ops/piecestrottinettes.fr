-- Add INSERT policy for part_compatibility (admin can add compatibility)
CREATE POLICY "Authenticated users can insert part_compatibility"
ON public.part_compatibility
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Add UPDATE policy for part_compatibility
CREATE POLICY "Authenticated users can update part_compatibility"
ON public.part_compatibility
FOR UPDATE
TO authenticated
USING (true);

-- Add DELETE policy for part_compatibility
CREATE POLICY "Authenticated users can delete part_compatibility"
ON public.part_compatibility
FOR DELETE
TO authenticated
USING (true);

-- Add INSERT policy for categories
CREATE POLICY "Authenticated users can insert categories"
ON public.categories
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Add UPDATE policy for categories
CREATE POLICY "Authenticated users can update categories"
ON public.categories
FOR UPDATE
TO authenticated
USING (true);

-- Add INSERT policy for brands
CREATE POLICY "Authenticated users can insert brands"
ON public.brands
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Add UPDATE policy for brands
CREATE POLICY "Authenticated users can update brands"
ON public.brands
FOR UPDATE
TO authenticated
USING (true);