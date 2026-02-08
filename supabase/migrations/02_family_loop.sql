-- Create households table
CREATE TABLE IF NOT EXISTS public.households (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create household_members table
CREATE TABLE IF NOT EXISTS public.household_members (
    household_id UUID REFERENCES public.households(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    role TEXT DEFAULT 'member', -- 'admin', 'member', 'child'
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (household_id, user_id)
);

-- Update reminders table for assignment
ALTER TABLE public.reminders ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES public.households(id) ON DELETE SET NULL;
ALTER TABLE public.reminders ADD COLUMN IF NOT EXISTS assignee_id UUID REFERENCES auth.users(id);
ALTER TABLE public.reminders ADD COLUMN IF NOT EXISTS completed_by UUID REFERENCES auth.users(id);
ALTER TABLE public.reminders ADD COLUMN IF NOT EXISTS proof_url TEXT;

-- RLS Policies
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;

-- Households: Viewable if you are a member
CREATE POLICY "Households are viewable by members"
    ON public.households FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.household_members
            WHERE household_members.household_id = households.id
            AND household_members.user_id = auth.uid()
        )
    );

-- Households: Insert if authenticated (creating new)
CREATE POLICY "Users can create households"
    ON public.households FOR INSERT
    WITH CHECK (auth.uid() = created_by);

-- Household Members: Viewable by other members of same household
CREATE POLICY "Members viewable by household"
    ON public.household_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.household_members hm
            WHERE hm.household_id = household_members.household_id
            AND hm.user_id = auth.uid()
        )
    );

-- Reminders: Viewable if in same household OR owner
-- Note: You might need to drop existing policy and replace it with a composite one, or add a new OR policy.
-- For now adding a permissive policy for shared ones.
CREATE POLICY "View shared reminders"
    ON public.reminders FOR ALL
    USING (
        household_id IN (
            SELECT household_id FROM public.household_members
            WHERE user_id = auth.uid()
        )
    );
