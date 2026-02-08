-- Allow users to join households (insert themselves)
CREATE POLICY "Users can join households"
    ON public.household_members FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow users to leave households (delete their own membership)
CREATE POLICY "Users can leave households"
    ON public.household_members FOR DELETE
    USING (auth.uid() = user_id);
