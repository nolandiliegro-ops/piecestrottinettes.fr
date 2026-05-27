-- =============================================
-- COPIE DE REFERENCE — lecture humaine uniquement.
--
-- Source de verite = Lovable (a appliquer via chat Lovable).
-- Commande Lovable :
--   ALTER TABLE home_bridge_settings ADD COLUMN IF NOT EXISTS dark_block_color text NOT NULL DEFAULT '#3A3A3A';
--
-- Cette colonne stocke la couleur de fond du bloc dark
-- (HomeBridge + ShopByCompatibility section). Editable depuis l'admin.
-- =============================================

ALTER TABLE public.home_bridge_settings
  ADD COLUMN IF NOT EXISTS dark_block_color text NOT NULL DEFAULT '#3A3A3A';

-- Verification (optionnel) :
-- SELECT id, dark_block_color FROM public.home_bridge_settings;
