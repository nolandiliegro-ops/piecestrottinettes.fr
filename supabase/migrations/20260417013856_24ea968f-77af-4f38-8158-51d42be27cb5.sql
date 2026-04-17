ALTER TABLE public.contact_messages
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS matched_user_id uuid,
  ADD COLUMN IF NOT EXISTS last_reply_at timestamptz;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contact_messages_status_check'
  ) THEN
    ALTER TABLE public.contact_messages
      ADD CONSTRAINT contact_messages_status_check
      CHECK (status IN ('pending','replied','closed'));
  END IF;
END $$;

ALTER TABLE public.order_messages
  ADD COLUMN IF NOT EXISTS contact_message_id uuid;

CREATE INDEX IF NOT EXISTS idx_order_messages_contact_message_id
  ON public.order_messages(contact_message_id);

CREATE INDEX IF NOT EXISTS idx_contact_messages_status
  ON public.contact_messages(status);