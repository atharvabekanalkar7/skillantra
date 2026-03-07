-- Migration: Add company_name and company_description columns to profiles table and update trigger

-- 1. Add new columns to the profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_description text;

-- 2. Update the profile creation trigger function to include these new fields
-- Note: Ensure user_type is also included
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if profile already exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = NEW.id) THEN
    -- Create profile with data from user metadata
    INSERT INTO public.profiles (
      user_id, 
      name, 
      college, 
      user_type, 
      company_name, 
      company_description
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
      COALESCE(NEW.raw_user_meta_data->>'college', NULL),
      COALESCE(NEW.raw_user_meta_data->>'user_type', 'SkillSeeker'),
      COALESCE(NEW.raw_user_meta_data->>'company_name', NULL),
      COALESCE(NEW.raw_user_meta_data->>'company_description', NULL)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
