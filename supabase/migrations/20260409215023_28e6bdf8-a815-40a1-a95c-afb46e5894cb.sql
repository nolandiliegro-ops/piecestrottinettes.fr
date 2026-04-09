-- Add image_url column to order_messages
ALTER TABLE public.order_messages ADD COLUMN image_url text;

-- Create storage bucket for message images
INSERT INTO storage.buckets (id, name, public)
VALUES ('order-messages-images', 'order-messages-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public can view all images
CREATE POLICY "Public can view message images"
ON storage.objects FOR SELECT
USING (bucket_id = 'order-messages-images');

-- Authenticated users can upload to their own folder
CREATE POLICY "Authenticated users can upload message images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'order-messages-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Admins can manage all message images
CREATE POLICY "Admins can manage message images"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'order-messages-images' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'order-messages-images' AND public.has_role(auth.uid(), 'admin'));