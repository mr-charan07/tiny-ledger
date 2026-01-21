-- Create performance_metrics table for storing application performance data
CREATE TABLE public.performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  metric_type TEXT NOT NULL, -- 'page_load', 'api_call', 'render', 'interaction'
  metric_name TEXT NOT NULL,
  value_ms NUMERIC NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_performance_metrics_type ON public.performance_metrics(metric_type);
CREATE INDEX idx_performance_metrics_created_at ON public.performance_metrics(created_at DESC);
CREATE INDEX idx_performance_metrics_user_id ON public.performance_metrics(user_id);

-- Enable RLS
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

-- Users can insert their own metrics
CREATE POLICY "Users can insert own metrics"
ON public.performance_metrics
FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users can view their own metrics
CREATE POLICY "Users can view own metrics"
ON public.performance_metrics
FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

-- Admins can view all metrics
CREATE POLICY "Admins can view all metrics"
ON public.performance_metrics
FOR SELECT
USING (is_admin(auth.uid()));

-- Admins can delete metrics for cleanup
CREATE POLICY "Admins can delete metrics"
ON public.performance_metrics
FOR DELETE
USING (is_admin(auth.uid()));