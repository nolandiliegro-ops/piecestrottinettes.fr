CREATE OR REPLACE FUNCTION public.calculate_modification_xp(p_difficulty_level integer, p_category_name text, p_is_first_in_category boolean)
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  base_xp INTEGER := 10;
  category_multiplier DECIMAL := 1.0;
BEGIN
  CASE p_difficulty_level
    WHEN 1 THEN base_xp := 10;
    WHEN 2 THEN base_xp := 15;
    WHEN 3 THEN base_xp := 25;
    WHEN 4 THEN base_xp := 40;
    WHEN 5 THEN base_xp := 60;
    ELSE base_xp := 10;
  END CASE;
  
  CASE p_category_name
    WHEN 'Batteries' THEN category_multiplier := 2.0;
    WHEN 'Disques & Plaquettes' THEN category_multiplier := 1.5;
    WHEN 'Freinage' THEN category_multiplier := 1.5;
    WHEN 'Pneus' THEN category_multiplier := 1.3;
    WHEN 'Chambres à Air' THEN category_multiplier := 1.2;
    ELSE category_multiplier := 1.0;
  END CASE;
  
  base_xp := ROUND(base_xp * category_multiplier);
  
  IF p_is_first_in_category THEN
    base_xp := base_xp + 20;
  END IF;
  
  IF base_xp > 100 THEN
    base_xp := 100;
  END IF;
  
  RETURN base_xp;
END;
$function$;