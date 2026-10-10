-- AquaWatch Ghana — allow admins to delete reports
-- Run after 004_simplify_roles.sql (paste into Supabase Studio SQL Editor;
-- RESET ROLE first if you hit "must be owner of relation" errors)

RESET ROLE;

CREATE POLICY "reports_admin_delete" ON public.water_reports FOR DELETE
  USING (public.is_admin());
