-- Create a table to track login activity
CREATE TABLE public.login_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('login', 'logout')),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.login_activity ENABLE ROW LEVEL SECURITY;

-- Users can view their own login activity
CREATE POLICY "Users can view own login activity"
  ON public.login_activity
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all login activity
CREATE POLICY "Admins can view all login activity"
  ON public.login_activity
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Allow inserts for authenticated users (for their own activity)
CREATE POLICY "Users can insert own login activity"
  ON public.login_activity
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_login_activity_user_id ON public.login_activity(user_id);
CREATE INDEX idx_login_activity_created_at ON public.login_activity(created_at DESC);