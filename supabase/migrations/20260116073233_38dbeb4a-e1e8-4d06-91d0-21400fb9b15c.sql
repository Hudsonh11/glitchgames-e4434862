-- Create bug_reports table for user feedback
CREATE TABLE public.bug_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  page_url TEXT,
  browser_info TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;

-- Users can submit bug reports (even without logging in via email)
CREATE POLICY "Anyone can submit bug reports"
ON public.bug_reports
FOR INSERT
WITH CHECK (true);

-- Users can view their own bug reports
CREATE POLICY "Users can view their own bug reports"
ON public.bug_reports
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can manage all bug reports
CREATE POLICY "Admins can manage all bug reports"
ON public.bug_reports
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));