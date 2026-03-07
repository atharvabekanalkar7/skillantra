-- ============================================
-- Internships Storage Buckets setup
-- ============================================

-- Create private buckets if they don't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resumes', 
  'resumes', 
  false, 
  5242880, -- 5MB
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'offer-letters', 
  'offer-letters', 
  false, 
  5242880, -- 5MB
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- RLS for resumes bucket
CREATE POLICY "Authenticated users can upload resumes"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'resumes');

CREATE POLICY "Authenticated users can read resumes"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'resumes');

-- RLS for offer-letters bucket
CREATE POLICY "Authenticated users can upload offer letters"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'offer-letters');

CREATE POLICY "Authenticated users can read offer letters"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'offer-letters');
