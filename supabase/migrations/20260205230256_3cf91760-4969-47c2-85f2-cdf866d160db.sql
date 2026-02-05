-- Table to track parts installed on user scooters with XP rewards
CREATE TABLE garage_modifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_garage_id UUID NOT NULL REFERENCES user_garage(id) ON DELETE CASCADE,
  part_id UUID NOT NULL REFERENCES parts(id),
  order_item_id UUID REFERENCES order_items(id),
  installed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
  notes TEXT,
  xp_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_garage_modifications_user_garage ON garage_modifications(user_garage_id);
CREATE INDEX idx_garage_modifications_installed_at ON garage_modifications(installed_at DESC);

-- Enable Row Level Security
ALTER TABLE garage_modifications ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own modifications (via user_garage ownership)
CREATE POLICY "Users can view own modifications"
  ON garage_modifications FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM user_garage 
    WHERE user_garage.id = garage_modifications.user_garage_id 
    AND user_garage.user_id = auth.uid()
  ));

-- RLS Policy: Users can insert modifications to their own garage items
CREATE POLICY "Users can insert own modifications"
  ON garage_modifications FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_garage 
    WHERE user_garage.id = garage_modifications.user_garage_id 
    AND user_garage.user_id = auth.uid()
  ));

-- RLS Policy: Users can update their own modifications
CREATE POLICY "Users can update own modifications"
  ON garage_modifications FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM user_garage 
    WHERE user_garage.id = garage_modifications.user_garage_id 
    AND user_garage.user_id = auth.uid()
  ));

-- RLS Policy: Users can delete their own modifications
CREATE POLICY "Users can delete own modifications"
  ON garage_modifications FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM user_garage 
    WHERE user_garage.id = garage_modifications.user_garage_id 
    AND user_garage.user_id = auth.uid()
  ));

-- Admin access policies
CREATE POLICY "Admins can view all modifications"
  ON garage_modifications FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all modifications"
  ON garage_modifications FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- XP Calculation Function
CREATE OR REPLACE FUNCTION calculate_modification_xp(
  p_difficulty_level INTEGER,
  p_category_name TEXT,
  p_is_first_in_category BOOLEAN
) RETURNS INTEGER AS $$
DECLARE
  base_xp INTEGER := 10;
  category_multiplier DECIMAL := 1.0;
BEGIN
  -- Base XP by difficulty (1-5 scale)
  CASE p_difficulty_level
    WHEN 1 THEN base_xp := 10;   -- Très facile
    WHEN 2 THEN base_xp := 15;   -- Facile
    WHEN 3 THEN base_xp := 25;   -- Moyen
    WHEN 4 THEN base_xp := 40;   -- Difficile
    WHEN 5 THEN base_xp := 60;   -- Expert
    ELSE base_xp := 10;
  END CASE;
  
  -- Category multiplier (rewards critical work)
  CASE p_category_name
    WHEN 'Batteries' THEN category_multiplier := 2.0;
    WHEN 'Freinage' THEN category_multiplier := 1.5;
    WHEN 'Pneus' THEN category_multiplier := 1.3;
    WHEN 'Chambres à Air' THEN category_multiplier := 1.2;
    ELSE category_multiplier := 1.0;
  END CASE;
  
  base_xp := ROUND(base_xp * category_multiplier);
  
  -- First in category bonus (+20 XP)
  IF p_is_first_in_category THEN
    base_xp := base_xp + 20;
  END IF;
  
  -- Anti-abuse limit (max 100 XP per modification)
  IF base_xp > 100 THEN
    base_xp := 100;
  END IF;
  
  RETURN base_xp;
END;
$$ LANGUAGE plpgsql SET search_path = public;

COMMENT ON TABLE garage_modifications IS 'Tracks parts installed on user scooters with XP rewards';
COMMENT ON FUNCTION calculate_modification_xp IS 'Calculates XP earned for installing a part based on difficulty and category';