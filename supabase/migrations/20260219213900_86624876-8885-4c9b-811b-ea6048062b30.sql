
-- 1. Fix orders: restrict INSERT to authenticated users only
DROP POLICY IF EXISTS "Anyone can insert orders" ON public.orders;
CREATE POLICY "Authenticated users can insert own orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 2. Fix orders: remove guest exposure from SELECT
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

-- 3. Fix order_items: restrict INSERT to authenticated users
DROP POLICY IF EXISTS "Anyone can insert order items" ON public.order_items;
CREATE POLICY "Authenticated users can insert order items"
  ON public.order_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
  ));

-- 4. Fix order_items: remove guest exposure from SELECT
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
CREATE POLICY "Users can view own order items"
  ON public.order_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
  ));

-- 5. Storage cleanup: drop duplicate/conflicting scooter-photos policies
DROP POLICY IF EXISTS "Admin upload scooter photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload scooter photos" ON storage.objects;
