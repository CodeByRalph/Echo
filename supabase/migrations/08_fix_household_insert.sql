-- Ensure the insert policy for households exists and is correct
DROP POLICY IF EXISTS "Users can create households" ON public.households;

CREATE POLICY "Users can create households"
    ON public.households FOR INSERT
    WITH CHECK (auth.uid() = created_by);

-- Also ensure update policy allows creator to update (e.g. name)
DROP POLICY IF EXISTS "Creators can update households" ON public.households;

CREATE POLICY "Creators can update households"
    ON public.households FOR UPDATE
    USING (auth.uid() = created_by);
