ALTER TABLE scooter_models ADD COLUMN IF NOT EXISTS max_speed_private_kmh integer;
ALTER TABLE scooter_models ADD COLUMN IF NOT EXISTS price_eur numeric(10,2);
