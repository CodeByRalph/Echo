-- Enforce one family per user
ALTER TABLE public.household_members ADD CONSTRAINT one_family_per_user UNIQUE (user_id);

-- For Invite Codes: simpler approach for MVP is just using the household_id as the code, 
-- or adding an invite_code column to households.
ALTER TABLE public.households ADD COLUMN IF NOT EXISTS invite_code TEXT DEFAULT substr(md5(random()::text), 0, 7);
