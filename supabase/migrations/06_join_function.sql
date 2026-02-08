-- Secure RPC function to join a household by code
CREATE OR REPLACE FUNCTION public.join_household(invite_code_input TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_household_id UUID;
  curr_user_id UUID := auth.uid();
BEGIN
  IF curr_user_id IS NULL THEN
     RETURN json_build_object('success', false, 'message', 'Not authenticated');
  END IF;

  -- Check if already in a family (handled by constraint too, but nice for UX)
  IF EXISTS (SELECT 1 FROM household_members WHERE user_id = curr_user_id) THEN
     RETURN json_build_object('success', false, 'message', 'You are already in a family space. Leave your current one first.');
  END IF;

  -- Lookup Household by invite_code OR id
  SELECT id INTO target_household_id
  FROM households
  WHERE invite_code = invite_code_input
  OR id::text = invite_code_input
  LIMIT 1;

  IF target_household_id IS NULL THEN
     RETURN json_build_object('success', false, 'message', 'Household not found with this code.');
  END IF;

  -- Insert Membership
  INSERT INTO household_members (household_id, user_id, role)
  VALUES (target_household_id, curr_user_id, 'member');

  RETURN json_build_object('success', true, 'household_id', target_household_id);

EXCEPTION 
    WHEN unique_violation THEN
        RETURN json_build_object('success', false, 'message', 'Already a member of this household.');
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'message', 'Database error: ' || SQLERRM);
END;
$$;
