-- Add a secure QR token column for passwordless login
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS qr_token TEXT UNIQUE;

-- Create index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_profiles_qr_token ON public.profiles(qr_token);