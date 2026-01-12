-- Add technical specs columns to scooter_models
ALTER TABLE public.scooter_models 
ADD COLUMN IF NOT EXISTS amperage integer,
ADD COLUMN IF NOT EXISTS youtube_video_id text;

-- Update amperage values for existing models
UPDATE scooter_models SET amperage = 7 WHERE slug = 'mi-essential';
UPDATE scooter_models SET amperage = 12 WHERE slug = 'mi-3';
UPDATE scooter_models SET amperage = 12 WHERE slug = 'mi-pro-2';
UPDATE scooter_models SET amperage = 15 WHERE slug = 'g30-max';
UPDATE scooter_models SET amperage = 15 WHERE slug = 'ninebot-max-g2';
UPDATE scooter_models SET amperage = 10 WHERE slug = 'f40';
UPDATE scooter_models SET amperage = 23 WHERE slug = 'p100s';
UPDATE scooter_models SET amperage = 35 WHERE slug = 'thunder';
UPDATE scooter_models SET amperage = 30 WHERE slug = 'victor';
UPDATE scooter_models SET amperage = 24 WHERE slug = 'mantis-pro';
UPDATE scooter_models SET amperage = 35 WHERE slug = 'wolf-warrior';

-- Add custom photo URL to user_garage
ALTER TABLE public.user_garage 
ADD COLUMN IF NOT EXISTS custom_photo_url text;

-- Create storage bucket for scooter photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('scooter-photos', 'scooter-photos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS: Users can upload their own scooter photos
CREATE POLICY "Users can upload their own scooter photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'scooter-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- RLS: Public can view scooter photos
CREATE POLICY "Public can view scooter photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'scooter-photos');

-- RLS: Users can update their own photos
CREATE POLICY "Users can update own scooter photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'scooter-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- RLS: Users can delete their own photos
CREATE POLICY "Users can delete own scooter photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'scooter-photos' AND auth.uid()::text = (storage.foldername(name))[1]);