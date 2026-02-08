-- Drop the one family per user constraint to allow multiple families
ALTER TABLE public.household_members DROP CONSTRAINT IF EXISTS one_family_per_user;
