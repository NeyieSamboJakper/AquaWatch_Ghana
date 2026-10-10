-- AquaWatch Ghana — let users mark their own notifications as read
-- Run after 011_water_reports_reporter_fk.sql (paste into Supabase Studio SQL
-- Editor; RESET ROLE first if you hit ownership errors)
--
-- Needed for the notification toast: once a toast is shown for a report
-- reply, the client marks it read so it doesn't show again on the next
-- page load.

RESET ROLE;

DROP POLICY IF EXISTS "notifications_update_own" ON public.report_notifications;
CREATE POLICY "notifications_update_own" ON public.report_notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
