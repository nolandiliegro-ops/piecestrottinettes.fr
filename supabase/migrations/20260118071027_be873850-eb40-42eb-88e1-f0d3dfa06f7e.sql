-- =============================================
-- SECURITY FIX: Replace permissive INSERT policies with service_role only
-- This prevents client-side price manipulation
-- =============================================

-- 1. Drop the overly permissive INSERT policies
DROP POLICY IF EXISTS "Authenticated users can insert orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users can insert order items" ON order_items;
DROP POLICY IF EXISTS "Anyone can insert orders" ON orders;
DROP POLICY IF EXISTS "Anyone can insert order items" ON order_items;

-- 2. Create restrictive INSERT policies (service_role only = Edge Functions)
-- Only the create-order Edge Function can insert orders
DROP POLICY IF EXISTS "Only service role can insert orders" ON orders;
CREATE POLICY "Only service role can insert orders" 
ON orders FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Only service role can insert order items" ON order_items;
CREATE POLICY "Only service role can insert order items" 
ON order_items FOR INSERT 
WITH CHECK (auth.role() = 'service_role');