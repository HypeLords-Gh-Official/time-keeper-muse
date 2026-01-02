-- Create login_activity table to track login events
CREATE TABLE public.login_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  login_method TEXT NOT NULL, -- 'email', 'qr', 'staff_number'
  ip_address TEXT,
  user_agent TEXT,
  device_info TEXT,
  login_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  success BOOLEAN NOT NULL DEFAULT true,
  failure_reason TEXT
);

-- Enable RLS
ALTER TABLE public.login_activity ENABLE ROW LEVEL SECURITY;

-- Users can view their own login activity
CREATE POLICY "Users can view their own login activity"
ON public.login_activity
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own login activity
CREATE POLICY "Users can insert their own login activity"
ON public.login_activity
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins and supervisors can view all login activity
CREATE POLICY "Admins and supervisors can view all login activity"
ON public.login_activity
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'supervisor'::app_role));

-- Create index for faster queries
CREATE INDEX idx_login_activity_user_id ON public.login_activity(user_id);
CREATE INDEX idx_login_activity_login_at ON public.login_activity(login_at DESC);