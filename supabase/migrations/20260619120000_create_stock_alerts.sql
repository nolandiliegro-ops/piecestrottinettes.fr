-- SB4a — Table stock_alerts : capture des demandes "Me prévenir du retour" (alerte retour stock).
-- Trace repo. SQL appliqué à la main dans le SQL editor Lovable (jamais via CLI).

-- 1. Table
CREATE TABLE public.stock_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id uuid NOT NULL REFERENCES public.parts(id) ON DELETE CASCADE,
  email text NOT NULL,
  user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  notified_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT stock_alerts_email_format CHECK (email ~* '^[^@]+@[^@]+\.[^@]+$')
);

-- 2. RLS
ALTER TABLE public.stock_alerts ENABLE ROW LEVEL SECURITY;

-- 3. Policies (calquées sur les policies orders existantes)
-- Insertion publique (capture front anon, comme le guest checkout des orders)
CREATE POLICY "Anyone can insert stock alerts"
ON public.stock_alerts
FOR INSERT
WITH CHECK (true);

-- Lecture réservée aux admins
CREATE POLICY "Admins can view stock alerts"
ON public.stock_alerts
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Mise à jour réservée aux admins (ex. notified_at par le cron via service role / admin)
CREATE POLICY "Admins can update stock alerts"
ON public.stock_alerts
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Suppression réservée aux admins
CREATE POLICY "Admins can delete stock alerts"
ON public.stock_alerts
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Index
-- Index PLEIN (part_id, email) — surtout PAS lower(email) : onConflict supabase-js ne cible pas
-- un index fonctionnel. L'email sera lowercasé côté front avant upsert ignoreDuplicates.
CREATE UNIQUE INDEX stock_alerts_part_email_key ON public.stock_alerts (part_id, email);

-- Scan cron des alertes en attente d'envoi
CREATE INDEX stock_alerts_pending_idx ON public.stock_alerts (part_id) WHERE notified_at IS NULL;
