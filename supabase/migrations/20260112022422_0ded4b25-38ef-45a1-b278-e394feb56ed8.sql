-- Add last_maintenance_date to user_garage for tracking maintenance history
ALTER TABLE public.user_garage 
ADD COLUMN last_maintenance_date timestamp with time zone;