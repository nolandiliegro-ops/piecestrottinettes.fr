-- Table pour gérer les configurations batteries multiples par modèle
CREATE TABLE public.scooter_battery_configs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  scooter_model_id uuid NOT NULL REFERENCES public.scooter_models(id) ON DELETE CASCADE,
  voltage integer NOT NULL,
  amperage integer NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(scooter_model_id, voltage, amperage)
);

-- Enable RLS
ALTER TABLE public.scooter_battery_configs ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public can read battery configs" 
ON public.scooter_battery_configs 
FOR SELECT 
USING (true);

-- Admin write access
CREATE POLICY "Only admins can insert battery configs" 
ON public.scooter_battery_configs 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update battery configs" 
ON public.scooter_battery_configs 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete battery configs" 
ON public.scooter_battery_configs 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Migrer les données existantes depuis scooter_models
INSERT INTO public.scooter_battery_configs (scooter_model_id, voltage, amperage, is_default)
SELECT id, COALESCE(voltage, 36), COALESCE(amperage, 12), true 
FROM public.scooter_models;

-- Ajouter des configurations alternatives pour modèles populaires
-- Kaabo Mantis Pro: 52V et 60V options
INSERT INTO public.scooter_battery_configs (scooter_model_id, voltage, amperage)
SELECT id, 52, 18 FROM public.scooter_models WHERE slug = 'mantis-pro'
ON CONFLICT DO NOTHING;

INSERT INTO public.scooter_battery_configs (scooter_model_id, voltage, amperage)
SELECT id, 52, 24 FROM public.scooter_models WHERE slug = 'mantis-pro'
ON CONFLICT DO NOTHING;

INSERT INTO public.scooter_battery_configs (scooter_model_id, voltage, amperage)
SELECT id, 60, 28 FROM public.scooter_models WHERE slug = 'mantis-pro'
ON CONFLICT DO NOTHING;

-- Kaabo Wolf Warrior: configurations haute puissance
INSERT INTO public.scooter_battery_configs (scooter_model_id, voltage, amperage)
SELECT id, 60, 28 FROM public.scooter_models WHERE slug = 'wolf-warrior'
ON CONFLICT DO NOTHING;

INSERT INTO public.scooter_battery_configs (scooter_model_id, voltage, amperage)
SELECT id, 72, 28 FROM public.scooter_models WHERE slug = 'wolf-warrior'
ON CONFLICT DO NOTHING;

INSERT INTO public.scooter_battery_configs (scooter_model_id, voltage, amperage)
SELECT id, 72, 35 FROM public.scooter_models WHERE slug = 'wolf-warrior'
ON CONFLICT DO NOTHING;

-- Dualtron Thunder: haute performance
INSERT INTO public.scooter_battery_configs (scooter_model_id, voltage, amperage)
SELECT id, 60, 35 FROM public.scooter_models WHERE slug = 'thunder'
ON CONFLICT DO NOTHING;

INSERT INTO public.scooter_battery_configs (scooter_model_id, voltage, amperage)
SELECT id, 72, 35 FROM public.scooter_models WHERE slug = 'thunder'
ON CONFLICT DO NOTHING;

INSERT INTO public.scooter_battery_configs (scooter_model_id, voltage, amperage)
SELECT id, 72, 40 FROM public.scooter_models WHERE slug = 'thunder'
ON CONFLICT DO NOTHING;

-- Dualtron Victor: options variées
INSERT INTO public.scooter_battery_configs (scooter_model_id, voltage, amperage)
SELECT id, 60, 24 FROM public.scooter_models WHERE slug = 'victor'
ON CONFLICT DO NOTHING;

INSERT INTO public.scooter_battery_configs (scooter_model_id, voltage, amperage)
SELECT id, 60, 30 FROM public.scooter_models WHERE slug = 'victor'
ON CONFLICT DO NOTHING;

-- Ninebot G30 Max: options batterie
INSERT INTO public.scooter_battery_configs (scooter_model_id, voltage, amperage)
SELECT id, 36, 15 FROM public.scooter_models WHERE slug = 'g30-max'
ON CONFLICT DO NOTHING;

INSERT INTO public.scooter_battery_configs (scooter_model_id, voltage, amperage)
SELECT id, 36, 18 FROM public.scooter_models WHERE slug = 'g30-max'
ON CONFLICT DO NOTHING;

-- Xiaomi Mi Pro 2: options
INSERT INTO public.scooter_battery_configs (scooter_model_id, voltage, amperage)
SELECT id, 36, 12 FROM public.scooter_models WHERE slug = 'mi-pro-2'
ON CONFLICT DO NOTHING;

INSERT INTO public.scooter_battery_configs (scooter_model_id, voltage, amperage)
SELECT id, 36, 15 FROM public.scooter_models WHERE slug = 'mi-pro-2'
ON CONFLICT DO NOTHING;