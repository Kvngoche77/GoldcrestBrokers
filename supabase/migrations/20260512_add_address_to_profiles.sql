-- Migration to add address column to profiles table

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'address') THEN
    ALTER TABLE profiles ADD COLUMN address text DEFAULT '';
  END IF;
END $$;

-- Update the handle_new_user function to handle raw_user_meta_data more robustly if needed
-- (Currently it's fine, but let's make sure it doesn't fail if metadata is missing)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, referral_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    generate_referral_code()
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name
  WHERE profiles.username IS NULL OR profiles.full_name = '';
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error or handle it (in Supabase you can't easily log to a file, but this prevents trigger from blocking signup)
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
