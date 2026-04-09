CREATE TABLE public.order_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_type text NOT NULL,
  message text NOT NULL,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.order_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order messages" ON public.order_messages
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM orders WHERE orders.id = order_messages.order_id AND orders.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own order messages" ON public.order_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_type = 'client' AND user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_messages.order_id AND orders.user_id = auth.uid())
  );

CREATE POLICY "Users can mark messages as read" ON public.order_messages
  FOR UPDATE TO authenticated
  USING (
    sender_type = 'admin' AND
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_messages.order_id AND orders.user_id = auth.uid())
  );

CREATE POLICY "Admins full access on order_messages" ON public.order_messages
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

ALTER PUBLICATION supabase_realtime ADD TABLE public.order_messages;