-- AquaWatch Ghana — let the app embed the reporter's name on non-anonymous reports
-- Run after 010_report_images_storage.sql (paste into Supabase Studio SQL
-- Editor; RESET ROLE first if you hit ownership errors)
--
-- water_reports.user_id references auth.users, but the app needs to embed
-- `reporter:profiles(full_name)` to show a non-anonymous reporter's name on
-- report cards — same PostgREST embedding requirement we hit with
-- admin_responses.admin_id (needs a direct FK to profiles, not a transitive
-- one through auth.users).

RESET ROLE;

ALTER TABLE public.water_reports DROP CONSTRAINT IF EXISTS water_reports_user_id_fkey;
ALTER TABLE public.water_reports ADD CONSTRAINT water_reports_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

NOTIFY pgrst, 'reload schema';
