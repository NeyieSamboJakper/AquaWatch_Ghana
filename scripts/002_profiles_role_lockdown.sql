-- AquaWatch Ghana — Profiles role lockdown
-- Run this after 001_create_schema.sql (paste into Supabase Studio SQL Editor)
--
-- If you hit "must be owner of relation profiles", your SQL Editor session is
-- likely stuck impersonating a non-admin role (Studio's RLS-testing feature).
-- RESET ROLE below clears that; if it still fails, open a brand-new query tab.
RESET ROLE;
--
-- Fixes: profiles_update_own (001, line 20) has no WITH CHECK restricting which
-- columns change, so any authenticated user could self-promote via
-- `supabase.from('profiles').update({ role: 'admin' })`. This adds an admin-only
-- update path plus a trigger that blocks role changes from anyone but an admin.
--
-- Bootstrap (first admin): after signing up normally through the app, run once:
--   UPDATE public.profiles SET role = 'admin' WHERE id = '<your-auth-uid>';
-- Studio's SQL Editor runs as a superuser connection with no JWT context, so
-- auth.uid() is NULL there — the trigger below explicitly allows role changes
-- in that case (RLS bypass only skips policies, never triggers, so the trigger
-- must account for this itself). Every admin after that is created through the
-- app's admin Users tab.

-- Admins can update any profile (mirrors reports_admin_update on water_reports)
DROP POLICY IF EXISTS "profiles_admin_update" ON public.profiles;
CREATE POLICY "profiles_admin_update" ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- RLS is row-level, not column-level — this trigger blocks role changes from
-- anyone who isn't already an admin, regardless of which policy allowed the UPDATE.
-- auth.uid() IS NULL means the request isn't going through PostgREST/the app at
-- all (e.g. Studio SQL Editor, a migration script, the service role key) — those
-- are already fully trusted, so only enforce the admin check when there IS an
-- authenticated app user making the change.
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF auth.uid() IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    ) THEN
      NEW.role := OLD.role;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_role_change ON public.profiles;
CREATE TRIGGER on_profile_role_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_role();
