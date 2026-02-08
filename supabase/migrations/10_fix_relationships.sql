-- 1. Backfill profiles for existing household members to prevent FK violation
-- We insert a placeholder profile if one doesn't exist.
-- Note: 'email' might be wrong if we can't read auth.users, but we need the row for the FK.
INSERT INTO public.profiles (id, email, full_name)
SELECT DISTINCT user_id, 'user@echo.app', 'Family Member'
FROM public.household_members
WHERE user_id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT DO NOTHING;

-- 2. Add Foreign Key to allow PostgREST to detect the relationship
-- We won't drop the auth.users FK, just add this one to "expose" the relation to the API
ALTER TABLE public.household_members
ADD CONSTRAINT household_members_profiles_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id);
