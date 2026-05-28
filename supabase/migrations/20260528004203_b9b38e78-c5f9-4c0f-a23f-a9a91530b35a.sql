
-- Table design_tokens
CREATE TABLE public.design_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  category text NOT NULL,
  label text,
  description text,
  type text NOT NULL DEFAULT 'color',
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.design_tokens TO anon;
GRANT SELECT ON public.design_tokens TO authenticated;
GRANT ALL ON public.design_tokens TO service_role;

ALTER TABLE public.design_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read design_tokens"
  ON public.design_tokens FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can insert design_tokens"
  ON public.design_tokens FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update design_tokens"
  ON public.design_tokens FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete design_tokens"
  ON public.design_tokens FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_design_tokens_updated_at
  BEFORE UPDATE ON public.design_tokens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Table design_tokens_history
CREATE TABLE public.design_tokens_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_key text NOT NULL,
  old_value text,
  new_value text,
  action text NOT NULL,
  changed_by uuid,
  changed_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.design_tokens_history TO authenticated;
GRANT ALL ON public.design_tokens_history TO service_role;

ALTER TABLE public.design_tokens_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read design_tokens_history"
  ON public.design_tokens_history FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger function for audit log
CREATE OR REPLACE FUNCTION public.log_design_token_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.design_tokens_history (token_key, old_value, new_value, action, changed_by)
    VALUES (NEW.key, NULL, NEW.value, 'INSERT', auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.value IS DISTINCT FROM NEW.value THEN
      INSERT INTO public.design_tokens_history (token_key, old_value, new_value, action, changed_by)
      VALUES (NEW.key, OLD.value, NEW.value, 'UPDATE', auth.uid());
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.design_tokens_history (token_key, old_value, new_value, action, changed_by)
    VALUES (OLD.key, OLD.value, NULL, 'DELETE', auth.uid());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER log_design_token_change
  AFTER INSERT OR UPDATE OR DELETE ON public.design_tokens
  FOR EACH ROW EXECUTE FUNCTION public.log_design_token_change();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.design_tokens;
