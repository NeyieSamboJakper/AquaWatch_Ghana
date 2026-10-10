-- AquaWatch Ghana — simplify roles to community + admin only
-- Run after 003_fix_profiles_recursion.sql (paste into a FRESH Supabase Studio
-- SQL Editor tab)

RESET ROLE;

-- Migrate any existing ngo/government rows down to community before tightening
-- the constraint (ADD CONSTRAINT below fails if any row would violate it)
UPDATE public.profiles SET role = 'community' WHERE role IN ('ngo', 'government');

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('community', 'admin'));

-- Water quality metrics could previously be entered by 'government' too — admin only now
DROP POLICY IF EXISTS "metrics_admin_insert" ON public.water_quality_metrics;
CREATE POLICY "metrics_admin_insert" ON public.water_quality_metrics FOR INSERT
  WITH CHECK (public.is_admin());
