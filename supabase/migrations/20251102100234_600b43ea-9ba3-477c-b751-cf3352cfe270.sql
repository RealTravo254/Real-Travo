-- Create enum for gender
CREATE TYPE public.gender_type AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');

-- Create enum for business account types
CREATE TYPE public.business_account_type AS ENUM ('hotel_accommodation', 'trip_event', 'place_destination');

-- Create profiles table for standard users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  gender gender_type,
  phone_number TEXT,
  profile_picture_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create business_accounts table
CREATE TABLE public.business_accounts (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_type business_account_type NOT NULL,
  business_name TEXT NOT NULL,
  business_registration_number TEXT NOT NULL UNIQUE,
  business_phone_number TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for business_accounts
CREATE POLICY "Business users can view their own account"
  ON public.business_accounts
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Business users can update their phone number"
  ON public.business_accounts
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    business_name = (SELECT business_name FROM public.business_accounts WHERE id = auth.uid()) AND
    business_registration_number = (SELECT business_registration_number FROM public.business_accounts WHERE id = auth.uid())
  );

CREATE POLICY "Business users can insert their own account"
  ON public.business_accounts
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Add amenities column to hotels table
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS amenities TEXT[];

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_business_accounts
  BEFORE UPDATE ON public.business_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();