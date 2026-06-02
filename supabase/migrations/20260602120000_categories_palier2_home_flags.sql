ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS show_on_home boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS display_order_home integer;

UPDATE categories
  SET display_order_home = display_order
  WHERE display_order_home IS NULL;
