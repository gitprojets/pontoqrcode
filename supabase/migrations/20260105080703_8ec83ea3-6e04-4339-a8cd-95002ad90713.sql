-- Add onboarding_completed field to user_settings
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

-- Add onboarding_completed_at field
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamp with time zone;