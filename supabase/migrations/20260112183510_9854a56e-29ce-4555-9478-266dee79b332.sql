-- 1. Sous-catégories : parent_id pour hiérarchie
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

-- 2. SEO pour categories
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS meta_title TEXT,
ADD COLUMN IF NOT EXISTS meta_description TEXT;

-- 3. SEO pour parts
ALTER TABLE public.parts 
ADD COLUMN IF NOT EXISTS meta_title TEXT,
ADD COLUMN IF NOT EXISTS meta_description TEXT;

-- 4. Logistique pour parts
ALTER TABLE public.parts 
ADD COLUMN IF NOT EXISTS sku TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS min_stock_alert INTEGER DEFAULT 5;

-- 5. Index pour performance
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_parts_sku ON public.parts(sku);