CREATE POLICY "Admins can view all garages"
ON public.user_garage FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));