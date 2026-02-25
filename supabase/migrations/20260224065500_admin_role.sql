
-- Add role column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Create a view for admin to see all profiles with email (requires service_role or special policy)
-- Since we can't easily join with auth.users in RLS without complexity, 
-- we'll just allow admins to see all rows in the profiles table.

-- Update RLS policies for profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Update RLS for fasts
CREATE POLICY "Admins can view all fasts" ON public.fasts
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Update RLS for health_snapshots
CREATE POLICY "Admins can view all health snapshots" ON public.health_snapshots
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'
  )
);
