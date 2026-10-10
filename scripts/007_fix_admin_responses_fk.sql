-- AquaWatch Ghana — fix admin_responses.admin_id foreign key
-- Run after 006_admin_responses_and_notifications.sql (paste into Supabase
-- Studio SQL Editor; RESET ROLE first if you hit ownership errors)
--
-- The admin_responses table already existed from an earlier partial run of
-- 006 before admin_id was corrected to reference profiles instead of
-- auth.users. `CREATE TABLE IF NOT EXISTS` is a no-op on an existing table,
-- so it never applied that fix — PostgREST still can't find a relationship
-- between admin_responses and profiles for the `admin:profiles(full_name)`
-- embed used when sending/loading official responses.

RESET ROLE;

ALTER TABLE public.admin_responses DROP CONSTRAINT IF EXISTS admin_responses_admin_id_fkey;
ALTER TABLE public.admin_responses ADD CONSTRAINT admin_responses_admin_id_fkey
  FOREIGN KEY (admin_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

NOTIFY pgrst, 'reload schema';
