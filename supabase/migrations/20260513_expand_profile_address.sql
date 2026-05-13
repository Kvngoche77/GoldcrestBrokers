-- Migration to expand profile address and contact fields

DO $$ 
BEGIN
  -- Add city column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'city') THEN
    ALTER TABLE profiles ADD COLUMN city text DEFAULT '';
  END IF;

  -- Add street column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'street') THEN
    ALTER TABLE profiles ADD COLUMN street text DEFAULT '';
  END IF;

  -- Add postal_code column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'postal_code') THEN
    ALTER TABLE profiles ADD COLUMN postal_code text DEFAULT '';
  END IF;

  -- Add house_number column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'house_number') THEN
    ALTER TABLE profiles ADD COLUMN house_number text DEFAULT '';
  END IF;

  -- Add phone_country_code column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone_country_code') THEN
    ALTER TABLE profiles ADD COLUMN phone_country_code text DEFAULT '';
  END IF;
END $$;
