-- Migration: Sécurisation des tables orders et order_items + bucket scooter-photos

-- 1. Sécuriser la table orders (authentification requise)
DROP POLICY IF EXISTS "Anyone can insert orders" ON orders;

CREATE POLICY "Authenticated users can insert orders" 
ON orders FOR INSERT 
TO authenticated
WITH CHECK (true);

-- 2. Sécuriser la table order_items (authentification requise)
DROP POLICY IF EXISTS "Anyone can insert order items" ON order_items;

CREATE POLICY "Authenticated users can insert order items" 
ON order_items FOR INSERT 
TO authenticated
WITH CHECK (true);

-- 3. Supprimer la restriction admin-only sur le bucket scooter-photos
DROP POLICY IF EXISTS "Only admins can upload scooter photos" ON storage.objects;