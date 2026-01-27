-- Add Stripe payment columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS stripe_session_id text,
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
ADD COLUMN IF NOT EXISTS paid_at timestamp with time zone;

-- Add index for faster session lookups
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session_id ON public.orders(stripe_session_id);

-- Comment for documentation
COMMENT ON COLUMN public.orders.stripe_session_id IS 'Stripe Checkout Session ID';
COMMENT ON COLUMN public.orders.stripe_payment_intent_id IS 'Stripe PaymentIntent ID for refunds';
COMMENT ON COLUMN public.orders.paid_at IS 'Timestamp when payment was confirmed';