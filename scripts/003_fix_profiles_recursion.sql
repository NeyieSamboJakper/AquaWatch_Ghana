-- AquaWatch Ghana — fix infinite recursion in profiles admin policies
-- Run after 002_profiles_role_lockdown.sql (paste into Supabase Studio SQL Editor)
--
-- profiles_admin_select (001) and profiles_admin_update (002) both check
-- admin status via `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND
-- role = 'admin')` directly inside a policy ON profiles. Evaluating that
-- inner SELECT requires applying profiles' own RLS policies again, which
-- re-triggers the same check — infinite recursion (error 42P17).
--
-- Fix: move the admin check into a SECURITY DEFINER function. Inside such a
-- function, the effective role becomes the function's owner (the table
-- owner here), and Postgres skips RLS for table owners by default — so the
-- query inside is_admin() never re-enters the policy, breaking the cycle.

RESET ROLE;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

DROP POLICY IF EXISTS "profiles_admin_select" ON public.profiles;
CREATE POLICY "profiles_admin_select" ON public.profiles FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "profiles_admin_update" ON public.profiles;
CREATE POLICY "profiles_admin_update" ON public.profiles FOR UPDATE
  USING (public.is_admin());
