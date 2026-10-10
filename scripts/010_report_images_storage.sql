-- AquaWatch Ghana — storage bucket for report photo uploads
-- Run after 009_admin_report_marker.sql (paste into Supabase Studio SQL
-- Editor; RESET ROLE first if you hit ownership errors)

RESET ROLE;

INSERT INTO storage.buckets (id, name, public)
VALUES ('report-images', 'report-images', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can view report photos (reports themselves are public data)
DROP POLICY IF EXISTS "report_images_public_read" ON storage.objects;
CREATE POLICY "report_images_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'report-images');

-- Any authenticated user can upload a photo (into their own folder, enforced below)
DROP POLICY IF EXISTS "report_images_auth_insert" ON storage.objects;
CREATE POLICY "report_images_auth_insert" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'report-images'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own uploaded photos; admins can delete any
DROP POLICY IF EXISTS "report_images_owner_delete" ON storage.objects;
CREATE POLICY "report_images_owner_delete" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'report-images'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
  );
