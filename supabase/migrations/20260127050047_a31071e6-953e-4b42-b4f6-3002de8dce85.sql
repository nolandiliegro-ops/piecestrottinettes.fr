-- Fix Orders Insert Bug
-- Date: 27/01/2026
-- Description: Ensure orders can be created by anyone (guest checkout support)

-- 1. Drop existing policies that might conflict
DROP POLICY IF EXISTS "Only service role can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Only service role can insert order items" ON public.order_items;

-- 2. Users can view their own orders (update existing)
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" 
ON public.orders 
FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

-- 3. Anyone can insert orders (guest checkout)
DROP POLICY IF EXISTS "Anyone can insert orders" ON public.orders;
CREATE POLICY "Anyone can insert orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (true);

-- 4. Users can view their own order items (update existing)
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
CREATE POLICY "Users can view own order items" 
ON public.order_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
  )
);

-- 5. Anyone can insert order items
DROP POLICY IF EXISTS "Anyone can insert order items" ON public.order_items;
CREATE POLICY "Anyone can insert order items" 
ON public.order_items 
FOR INSERT 
WITH CHECK (true);