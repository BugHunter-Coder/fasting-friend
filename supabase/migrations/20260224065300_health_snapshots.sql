
-- Create health_snapshots table for time-series data
CREATE TABLE public.health_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  steps INTEGER DEFAULT 0,
  active_energy NUMERIC DEFAULT 0,
  weight NUMERIC,
  heart_rate INTEGER,
  source TEXT NOT NULL, -- 'Apple Health' or 'Google Fit'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date, source)
);

ALTER TABLE public.health_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own health snapshots" ON public.health_snapshots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own health snapshots" ON public.health_snapshots FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own health snapshots" ON public.health_snapshots FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own health snapshots" ON public.health_snapshots FOR DELETE USING (auth.uid() = user_id);
