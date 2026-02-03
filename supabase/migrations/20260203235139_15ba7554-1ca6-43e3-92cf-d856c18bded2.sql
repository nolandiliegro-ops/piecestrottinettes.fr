-- Update handle_new_user trigger to give 200 XP instead of 100 for new signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, performance_points)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data ->> 'display_name', 'Rider'),
    200  -- Increased from 100 to 200 XP for new signups
  );
  RETURN new;
END;
$$;