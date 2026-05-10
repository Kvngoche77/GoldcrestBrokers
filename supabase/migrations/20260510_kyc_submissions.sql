-- Migration to create kyc_submissions table and storage bucket

-- 1. Create the table
CREATE TABLE IF NOT EXISTS kyc_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Personal Data
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  dob date,
  gender text,
  
  -- Demographic Data
  country text NOT NULL,
  city text,
  zip text,
  address text,
  
  -- Identification Data
  id_type text NOT NULL,
  id_number text NOT NULL,
  issue_date date,
  expiry_date date,
  
  -- Document
  document_url text,
  
  -- Status tracking
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  admin_note text DEFAULT '',
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Only one pending or verified submission per user allowed
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE kyc_submissions ENABLE ROW LEVEL SECURITY;

-- User Policies
CREATE POLICY "Users can view own kyc submissions"
  ON kyc_submissions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create kyc submissions"
  ON kyc_submissions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admin Policies
CREATE POLICY "Admins can view all kyc submissions"
  ON kyc_submissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can update all kyc submissions"
  ON kyc_submissions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Create an index for faster queries
CREATE INDEX IF NOT EXISTS idx_kyc_submissions_status ON kyc_submissions(status);
CREATE INDEX IF NOT EXISTS idx_kyc_submissions_user_id ON kyc_submissions(user_id);

-- 2. Create the Storage Bucket for KYC documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for 'kyc-documents' bucket
-- Note: 'kyc-documents' is a private bucket, but we will allow users to upload and view their own, and admins to view all.

-- Allow users to upload their own documents
CREATE POLICY "Users can upload their own KYC documents" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to view their own documents
CREATE POLICY "Users can view their own KYC documents" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow admins to view all documents
CREATE POLICY "Admins can view all KYC documents" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (
  bucket_id = 'kyc-documents' AND 
  EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  )
);
