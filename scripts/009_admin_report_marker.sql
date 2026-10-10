-- AquaWatch Ghana — mark reports submitted by an admin
-- Run after 008_upvote_rpc.sql (paste into Supabase Studio SQL Editor;
-- RESET ROLE first if you hit ownership errors)

RESET ROLE;

ALTER TABLE public.water_reports ADD COLUMN IF NOT EXISTS is_admin_report BOOLEAN NOT NULL DEFAULT FALSE;

-- Stamp the flag at insert time based on the submitter's role, not whatever
-- the client sends — avoids trusting client input for a trust-signal field.
CREATE OR REPLACE FUNCTION public.stamp_admin_report()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.is_admin_report := public.is_admin();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_water_report_stamp_admin ON public.water_reports;
CREATE TRIGGER on_water_report_stamp_admin
  BEFORE INSERT ON public.water_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.stamp_admin_report();
