-- AquaWatch Ghana — reporter confirms (or disputes) a resolution
-- Run after 013_admin_response_length.sql (paste into Supabase Studio SQL
-- Editor; RESET ROLE first if you hit ownership errors)
--
-- Like "confirm received" in online shopping: once an admin marks a report
-- resolved, the person who submitted it can confirm the fix (optional note +
-- photo) or say it's still a problem, which reopens the report for review.
--
-- All writes go through confirm_report_resolution() (SECURITY DEFINER) so the
-- rules — only the reporter, only while resolved, only once per resolution —
-- are enforced in the database rather than trusted from the client.

RESET ROLE;

-- When the reporter confirmed the current resolution (NULL = not confirmed)
ALTER TABLE public.water_reports ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;

-- ============================================================
-- REPORT CONFIRMATIONS (history of reporter confirm/dispute actions)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.report_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.water_reports(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  confirmed BOOLEAN NOT NULL,
  note TEXT CHECK (note IS NULL OR char_length(note) <= 500),
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.report_confirmations ENABLE ROW LEVEL SECURITY;

-- Visible to anyone who can see the report (public data). No INSERT policy:
-- rows are only created through confirm_report_resolution() below.
DROP POLICY IF EXISTS "confirmations_public_select" ON public.report_confirmations;
CREATE POLICY "confirmations_public_select" ON public.report_confirmations FOR SELECT USING (TRUE);

-- ============================================================
-- Any status change invalidates an earlier confirmation — e.g. an admin
-- reopens then re-resolves a report, the reporter must confirm again.
-- ============================================================
CREATE OR REPLACE FUNCTION public.reset_confirmation_on_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.confirmed_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_water_report_status_reset_confirmation ON public.water_reports;
CREATE TRIGGER on_water_report_status_reset_confirmation
  BEFORE UPDATE ON public.water_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.reset_confirmation_on_status_change();

-- ============================================================
-- CONFIRM / DISPUTE RPC
-- ============================================================
CREATE OR REPLACE FUNCTION public.confirm_report_resolution(
  p_report_id UUID,
  p_confirmed BOOLEAN,
  p_note TEXT DEFAULT NULL,
  p_image_url TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r public.water_reports%ROWTYPE;
  v_note TEXT := NULLIF(btrim(p_note), '');
BEGIN
  SELECT * INTO r FROM public.water_reports WHERE id = p_report_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Report not found.';
  END IF;
  IF auth.uid() IS NULL OR r.user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Only the person who submitted this report can confirm its resolution.'
      USING ERRCODE = '42501';
  END IF;
  IF r.status <> 'resolved' THEN
    RAISE EXCEPTION 'This report is not currently marked as resolved.';
  END IF;
  IF r.confirmed_at IS NOT NULL THEN
    RAISE EXCEPTION 'You have already confirmed this resolution.';
  END IF;
  IF v_note IS NOT NULL AND char_length(v_note) > 500 THEN
    RAISE EXCEPTION 'Note must be 500 characters or fewer.';
  END IF;
  IF NOT p_confirmed AND v_note IS NULL THEN
    RAISE EXCEPTION 'Please describe what is still wrong.';
  END IF;
  -- Photo must be one the reporter uploaded to their own folder
  IF p_image_url IS NOT NULL
     AND position('/report-images/' || auth.uid()::text || '/' IN p_image_url) = 0 THEN
    RAISE EXCEPTION 'Invalid photo.';
  END IF;

  INSERT INTO public.report_confirmations (report_id, user_id, confirmed, note, image_url)
  VALUES (p_report_id, auth.uid(), p_confirmed, v_note, p_image_url);

  IF p_confirmed THEN
    UPDATE public.water_reports
      SET confirmed_at = NOW(), updated_at = NOW()
      WHERE id = p_report_id;
  ELSE
    -- Reopen for review (the trigger above clears confirmed_at)
    UPDATE public.water_reports
      SET status = 'under_review', resolved_at = NULL, updated_at = NOW()
      WHERE id = p_report_id;
  END IF;

  -- Let the admins who responded on this report know the outcome
  INSERT INTO public.report_notifications (user_id, report_id, message)
  SELECT DISTINCT ar.admin_id, p_report_id,
    CASE WHEN p_confirmed
      THEN 'The reporter confirmed "' || r.title || '" is resolved.'
      ELSE 'The reporter says "' || r.title || '" is not resolved — it has been reopened for review.'
    END
  FROM public.admin_responses ar
  WHERE ar.report_id = p_report_id AND ar.admin_id IS NOT NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.confirm_report_resolution(UUID, BOOLEAN, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.confirm_report_resolution(UUID, BOOLEAN, TEXT, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';
