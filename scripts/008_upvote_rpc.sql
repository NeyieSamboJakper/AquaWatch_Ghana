-- AquaWatch Ghana — fix upvote counter for non-owners
-- Run after 007_fix_admin_responses_fk.sql (paste into Supabase Studio SQL
-- Editor; RESET ROLE first if you hit ownership errors)
--
-- UpvoteButton updates water_reports.upvotes directly, but the only UPDATE
-- policies on water_reports are for the report's owner or an admin — so
-- upvoting someone else's report (the normal case) silently fails to persist
-- the count, even though the report_upvotes row itself gets recorded fine.
-- Fix: a SECURITY DEFINER function that only touches the upvotes counter,
-- callable by any authenticated user, without opening up full row UPDATE
-- access to water_reports.

RESET ROLE;

CREATE OR REPLACE FUNCTION public.increment_report_upvotes(p_report_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.water_reports SET upvotes = upvotes + 1 WHERE id = p_report_id;
$$;

CREATE OR REPLACE FUNCTION public.decrement_report_upvotes(p_report_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.water_reports SET upvotes = GREATEST(upvotes - 1, 0) WHERE id = p_report_id;
$$;

GRANT EXECUTE ON FUNCTION public.increment_report_upvotes(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_report_upvotes(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';
