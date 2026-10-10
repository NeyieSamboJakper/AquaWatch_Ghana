-- AquaWatch Ghana — Database Migration
-- Run this script to set up the full schema

-- ============================================================
-- PROFILES (linked to Supabase Auth)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'community' CHECK (role IN ('community', 'ngo', 'government', 'admin')),
  region TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- Admins can see all profiles
CREATE POLICY "profiles_admin_select" ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- ============================================================
-- AUTO-CREATE PROFILE TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NULL),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'community')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- WATER ISSUE REPORTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.water_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  issue_type TEXT NOT NULL CHECK (issue_type IN (
    'contamination', 'shortage', 'infrastructure', 'flooding', 'pollution', 'other'
  )),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'in_progress', 'resolved', 'closed')),
  region TEXT NOT NULL,
  district TEXT,
  community TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  image_url TEXT,
  upvotes INTEGER NOT NULL DEFAULT 0,
  is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
  admin_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.water_reports ENABLE ROW LEVEL SECURITY;

-- Anyone can view reports (public data)
CREATE POLICY "reports_public_select" ON public.water_reports FOR SELECT USING (TRUE);

-- Authenticated users can insert
CREATE POLICY "reports_auth_insert" ON public.water_reports FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own reports
CREATE POLICY "reports_owner_update" ON public.water_reports FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can update any report
CREATE POLICY "reports_admin_update" ON public.water_reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- ============================================================
-- REPORT UPVOTES (prevent duplicate upvotes)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.report_upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.water_reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (report_id, user_id)
);

ALTER TABLE public.report_upvotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "upvotes_public_select" ON public.report_upvotes FOR SELECT USING (TRUE);
CREATE POLICY "upvotes_auth_insert" ON public.report_upvotes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "upvotes_auth_delete" ON public.report_upvotes FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- WATER QUALITY METRICS (regional aggregate data)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.water_quality_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region TEXT NOT NULL,
  district TEXT,
  metric_type TEXT NOT NULL CHECK (metric_type IN (
    'ph_level', 'turbidity', 'chlorine', 'bacteria', 'access_rate', 'quality_score'
  )),
  value DOUBLE PRECISION NOT NULL,
  unit TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.water_quality_metrics ENABLE ROW LEVEL SECURITY;

-- Public read access for metrics
CREATE POLICY "metrics_public_select" ON public.water_quality_metrics FOR SELECT USING (TRUE);

-- Only admins/government can insert metrics
CREATE POLICY "metrics_admin_insert" ON public.water_quality_metrics FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'government')
    )
  );

-- ============================================================
-- SEED: GHANA REGIONS with sample reports & metrics
-- ============================================================
-- Sample water quality metrics for Ghana regions
INSERT INTO public.water_quality_metrics (region, metric_type, value, unit, notes) VALUES
  ('Greater Accra', 'quality_score', 72, 'score', 'Urban treatment plants operational'),
  ('Greater Accra', 'access_rate', 85, 'percent', 'Pipe-borne water access'),
  ('Ashanti', 'quality_score', 68, 'score', 'Some areas relying on boreholes'),
  ('Ashanti', 'access_rate', 78, 'percent', 'Expanded GWCL coverage'),
  ('Northern', 'quality_score', 45, 'score', 'Seasonal fluctuations in quality'),
  ('Northern', 'access_rate', 52, 'percent', 'High reliance on surface water'),
  ('Upper East', 'quality_score', 41, 'score', 'Fluoride levels above WHO limit in some areas'),
  ('Upper East', 'access_rate', 48, 'percent', 'Borehole coverage improving'),
  ('Upper West', 'quality_score', 43, 'score', 'Limited piped water infrastructure'),
  ('Upper West', 'access_rate', 45, 'percent', 'NGO-supported borehole programs'),
  ('Volta', 'quality_score', 61, 'score', 'Lake Volta water treatment needed'),
  ('Volta', 'access_rate', 63, 'percent', 'Rural communities underserved'),
  ('Eastern', 'quality_score', 65, 'score', 'River Birim pollution concerns'),
  ('Eastern', 'access_rate', 70, 'percent', 'Urban-rural disparity'),
  ('Central', 'quality_score', 67, 'score', 'Coastal salt intrusion issues'),
  ('Central', 'access_rate', 69, 'percent', 'Cape Coast treatment plant upgrade'),
  ('Western', 'quality_score', 60, 'score', 'Mining runoff impacting quality'),
  ('Western', 'access_rate', 65, 'percent', 'Takoradi expanding GWCL'),
  ('Bono', 'quality_score', 58, 'score', 'Seasonal water scarcity'),
  ('Bono', 'access_rate', 60, 'percent', 'Sunyani urban supply stable'),
  ('Oti', 'quality_score', 50, 'score', 'Newly created region, infrastructure developing'),
  ('Oti', 'access_rate', 51, 'percent', 'Investment needed in rural areas'),
  ('Savannah', 'quality_score', 44, 'score', 'Dry season water crisis common'),
  ('Savannah', 'access_rate', 47, 'percent', 'Dams and boreholes primary sources'),
  ('North East', 'quality_score', 42, 'score', 'High turbidity during rains'),
  ('North East', 'access_rate', 46, 'percent', 'New borehole drilling programs'),
  ('Ahafo', 'quality_score', 57, 'score', 'Mining activity affecting waterways'),
  ('Ahafo', 'access_rate', 59, 'percent', 'Goaso water system improvements'),
  ('Bono East', 'quality_score', 55, 'score', 'Agricultural runoff concerns'),
  ('Bono East', 'access_rate', 58, 'percent', 'Techiman water supply improving'),
  ('Western North', 'quality_score', 53, 'score', 'Deforestation affecting water catchment'),
  ('Western North', 'access_rate', 55, 'percent', 'Rural pipe system expansions');

-- Sample water reports (anonymous seed data)
INSERT INTO public.water_reports (
  title, description, issue_type, severity, status,
  region, district, community, latitude, longitude, is_anonymous
) VALUES
  (
    'Contaminated borehole water in Tamale',
    'The community borehole water has turned brown and smells bad. Many residents have reported stomach illnesses after drinking.',
    'contamination', 'high', 'under_review',
    'Northern', 'Tamale Metro', 'Vittin', 9.4008, -0.8393, TRUE
  ),
  (
    'No water supply for 3 weeks in Nima',
    'The GWCL supply to Nima has been completely cut for 3 weeks. Residents are buying water from tankers at high cost.',
    'shortage', 'critical', 'in_progress',
    'Greater Accra', 'Ayawaso Central', 'Nima', 5.5833, -0.2167, FALSE
  ),
  (
    'Broken pipe flooding street in Kumasi',
    'A major water main has burst on Asafo road. Water is wasting and flooding the street causing traffic problems.',
    'infrastructure', 'high', 'pending',
    'Ashanti', 'Kumasi Metro', 'Asafo', 6.6885, -1.6244, FALSE
  ),
  (
    'River Birim pollution from mining',
    'Gold mining activities upstream are causing significant pollution. The river water has turned orange-red color.',
    'pollution', 'critical', 'under_review',
    'Eastern', 'Atiwa West', 'Akyem Abuakwa', 6.2, -0.9, TRUE
  ),
  (
    'Fluoride levels too high in Bawku boreholes',
    'Community members are experiencing dental and skeletal fluorosis. Lab tests confirm fluoride levels at 4mg/L (WHO limit 1.5mg/L).',
    'contamination', 'critical', 'in_progress',
    'Upper East', 'Bawku Municipal', 'Bawku', 11.0605, -0.2427, FALSE
  ),
  (
    'Seasonal water shortage in Wa',
    'During dry season the dam water levels drop drastically. The town faces acute water shortage every year from Dec-March.',
    'shortage', 'medium', 'pending',
    'Upper West', 'Wa Municipal', 'Wa', 10.0601, -2.5099, FALSE
  ),
  (
    'Sewage mixing with drinking water in Sekondi',
    'Old infrastructure is causing sewage to leak into the water distribution pipes. Residents smell sewage in their tap water.',
    'contamination', 'high', 'under_review',
    'Western', 'Sekondi-Takoradi Metro', 'Sekondi', 4.9344, -1.7049, TRUE
  ),
  (
    'Broken hand pump serving 500 people',
    'The only hand pump for our community of 500 people broke 2 months ago. We now walk 3km to fetch water.',
    'infrastructure', 'high', 'pending',
    'Volta', 'Ketu North', 'Dzodze', 6.1667, 0.9667, TRUE
  );
