-- Create storage bucket for category images
INSERT INTO storage.buckets (id, name, public)
VALUES ('category-images', 'category-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy for public read access
CREATE POLICY "Anyone can view category images"
ON storage.objects FOR SELECT
USING (bucket_id = 'category-images');

-- Create policy for authenticated uploads (for edge function service role)
CREATE POLICY "Service role can upload category images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'category-images');

-- Create category_images table
CREATE TABLE public.category_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.categories(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  prompt text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(category_id)
);

-- Enable RLS
ALTER TABLE public.category_images ENABLE ROW LEVEL SECURITY;

-- Anyone can view category images
CREATE POLICY "Anyone can view category images"
ON public.category_images FOR SELECT
USING (true);