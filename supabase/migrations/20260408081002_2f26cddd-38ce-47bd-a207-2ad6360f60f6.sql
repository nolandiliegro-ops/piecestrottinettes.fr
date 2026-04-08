CREATE POLICY "Public read active promo codes" ON public.promo_codes
  FOR SELECT TO anon, authenticated
  USING (active = true);