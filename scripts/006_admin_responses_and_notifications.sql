-- AquaWatch Ghana — create the admin_responses and report_notifications tables
-- Run after 005_reports_admin_delete.sql (paste into Supabase Studio SQL Editor;
-- RESET ROLE first if you hit "must be owner of relation" errors)
--
-- These tables were referenced by the app (AdminResponseDialog, the report
-- detail page, lib/types.ts) but were never actually created in 001 — sending
-- an official response currently fails because public.admin_responses doesn't
-- exist.
--
-- admin_id references public.profiles (not auth.users) on purpose: the app
-- embeds the sender's name via `admin:profiles(full_name)`, and PostgREST can
-- only auto-join a table via a direct foreign key to it.

RESET ROLE;

-- ============================================================
-- ADMIN RESPONSES (official responses to a water report)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admin_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.water_reports(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  status_update TEXT CHECK (status_update IN ('pending', 'under_review', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.admin_responses ENABLE ROW LEVEL SECURITY;

-- Responses are visible to anyone who can see the report (public data)
DROP POLICY IF EXISTS "admin_responses_public_select" ON public.admin_responses;
CREATE POLICY "admin_responses_public_select" ON public.admin_responses FOR SELECT USING (TRUE);

-- Only admins can post an official response, and only as themselves
DROP POLICY IF EXISTS "admin_responses_admin_insert" ON public.admin_responses;
CREATE POLICY "admin_responses_admin_insert" ON public.admin_responses FOR INSERT
  WITH CHECK (public.is_admin() AND admin_id = auth.uid());

-- ============================================================
-- REPORT NOTIFICATIONS (per-user notice that their report got a response)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.report_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_id UUID NOT NULL REFERENCES public.water_reports(id) ON DELETE CASCADE,
  response_id UUID REFERENCES public.admin_responses(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.report_notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
DROP POLICY IF EXISTS "notifications_select_own" ON public.report_notifications;
CREATE POLICY "notifications_select_own" ON public.report_notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Only admins create notifications (as part of sending an official response)
DROP POLICY IF EXISTS "notifications_admin_insert" ON public.report_notifications;
CREATE POLICY "notifications_admin_insert" ON public.report_notifications FOR INSERT
  WITH CHECK (public.is_admin());
