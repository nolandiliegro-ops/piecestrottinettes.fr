
-- Make order_id nullable to allow direct messages without an order
ALTER TABLE public.order_messages ALTER COLUMN order_id DROP NOT NULL;

-- Client: view own direct messages (no order linked)
CREATE POLICY "Users can view own direct messages" ON public.order_messages
  FOR SELECT TO authenticated
  USING (order_id IS NULL AND user_id = auth.uid());

-- Client: insert direct messages (no order linked)
CREATE POLICY "Users can insert direct messages" ON public.order_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_type = 'client' AND user_id = auth.uid() AND order_id IS NULL
  );
