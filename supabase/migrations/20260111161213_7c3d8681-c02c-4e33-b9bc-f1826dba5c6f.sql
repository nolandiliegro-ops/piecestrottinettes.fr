-- Migration: Add torque_nm column to parts table
-- Created: 2026-01-11 16:12:13
-- Purpose: Add torque specification in Newton-meters for technical parts display

-- Add torque_nm column as decimal type
ALTER TABLE parts 
ADD COLUMN IF NOT EXISTS torque_nm DECIMAL(6,2);

-- Add comment for documentation
COMMENT ON COLUMN parts.torque_nm IS 'Torque specification in Newton-meters (Nm) for parts that have torque ratings';

-- Create index for performance optimization on torque queries
CREATE INDEX IF NOT EXISTS idx_parts_torque_nm ON parts(torque_nm) WHERE torque_nm IS NOT NULL;

-- Update existing parts with sample torque data (optional - can be removed if not needed)
-- This is just for demonstration purposes
UPDATE parts 
SET torque_nm = 
  CASE 
    WHEN name ILIKE '%moteur%' OR name ILIKE '%motor%' THEN 
      ROUND((RANDOM() * 10 + 5)::numeric, 2) -- Motors: 5-15 Nm
    WHEN name ILIKE '%frein%' OR name ILIKE '%brake%' THEN 
      ROUND((RANDOM() * 3 + 2)::numeric, 2) -- Brakes: 2-5 Nm
    WHEN name ILIKE '%roue%' OR name ILIKE '%wheel%' THEN 
      ROUND((RANDOM() * 8 + 3)::numeric, 2) -- Wheels: 3-11 Nm
    ELSE NULL
  END
WHERE torque_nm IS NULL;
