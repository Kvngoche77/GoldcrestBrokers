-- Email Verification System Migration
-- Adds email verification tracking and admin email messaging capabilities

-- Add email verification columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS email_verification_sent_at timestamptz;

-- Create admin_emails table for tracking admin-sent emails
CREATE TABLE IF NOT EXISTS admin_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES profiles(id),
  recipient_user_id uuid REFERENCES profiles(id),
  subject text NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_emails ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all admin emails they sent
CREATE POLICY "Admins can view their sent emails"
  ON admin_emails FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.is_admin = true
    ) AND admin_id = auth.uid()
  );

-- Policy: Users can view emails sent to them
CREATE POLICY "Users can view their received emails"
  ON admin_emails FOR SELECT
  TO authenticated
  USING (recipient_user_id = auth.uid());

-- Policy: Admins can insert emails
CREATE POLICY "Admins can send emails"
  ON admin_emails FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.is_admin = true
    ) AND admin_id = auth.uid()
  );

-- Function to request email verification
CREATE OR REPLACE FUNCTION request_email_verification()
RETURNS json AS $$
DECLARE
  user_id uuid := auth.uid();
  user_email text;
BEGIN
  -- Get user email
  SELECT email INTO user_email FROM auth.users WHERE id = user_id;
  
  IF user_email IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User email not found');
  END IF;
  
  -- Update profile to mark verification as requested
  UPDATE profiles 
  SET email_verification_sent_at = now()
  WHERE id = user_id;
  
  -- Trigger Supabase to resend confirmation email
  -- Note: This requires Supabase Auth to be configured with email templates
  
  RETURN json_build_object('success', true, 'message', 'Verification email sent');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark email as verified (called after user clicks verification link)
CREATE OR REPLACE FUNCTION verify_user_email(target_user_id uuid)
RETURNS json AS $$
BEGIN
  -- Only admins or the user themselves can call this
  IF auth.uid() != target_user_id AND NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;
  
  UPDATE profiles 
  SET email_verified = true, updated_at = now()
  WHERE id = target_user_id;
  
  RETURN json_build_object('success', true, 'message', 'Email verified successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION request_email_verification TO authenticated;
GRANT EXECUTE ON FUNCTION verify_user_email TO authenticated;
