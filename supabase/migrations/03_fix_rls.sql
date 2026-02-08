-- Fix infinite recursion in RLS policies by using a SECURITY DEFINER function

-- 1. Create a helper function to get the current user's household_ids
-- This runs with the privileges of the creator (SECURITY DEFINER), bypassing RLS on household_members
CREATE OR REPLACE FUNCTION public.get_my_household_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT household_id
  FROM public.household_members
  WHERE user_id = auth.uid();
$$;

-- 2. Fix 'household_members' policy
DROP POLICY IF EXISTS "Members viewable by household" ON public.household_members;

CREATE POLICY "Members viewable by household"
    ON public.household_members FOR SELECT
    USING (
        -- Users can always see their own membership
        user_id = auth.uid()
        OR
        -- OR they can see members of households they belong to (using the secure function)
        household_id IN (SELECT public.get_my_household_ids())
    );

-- 3. Fix 'households' policy (optional but good for consistency)
DROP POLICY IF EXISTS "Households are viewable by members" ON public.households;

CREATE POLICY "Households are viewable by members"
    ON public.households FOR SELECT
    USING (
        id IN (SELECT public.get_my_household_ids())
    );

-- 4. Fix 'reminders' policy
-- Drop the previous attempt if it exists
DROP POLICY IF EXISTS "View shared reminders" ON public.reminders;

CREATE POLICY "View shared reminders"
    ON public.reminders FOR ALL
    USING (
        household_id IN (SELECT public.get_my_household_ids())
    );
