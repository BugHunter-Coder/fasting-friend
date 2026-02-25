
-- Add HealthKit related columns to public.profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS healthkit_connected BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS healthkit_last_sync TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS health_data JSONB DEFAULT '{}'::jsonb;
