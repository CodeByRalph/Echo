-- Update create_household to allow multiple families
CREATE OR REPLACE FUNCTION public.create_household(name_input TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_household_id UUID;
  new_invite_code TEXT;
  curr_user_id UUID := auth.uid();
BEGIN
  IF curr_user_id IS NULL THEN
     RETURN json_build_object('success', false, 'message', 'Not authenticated');
  END IF;

  -- REMOVED: Check if already in a family
  -- Logic for Free/Pro limits is handled in application layer or specific policy if needed.

  -- Generate invite code
  new_invite_code := substr(md5(random()::text), 0, 7);

  -- Insert Household
  INSERT INTO households (name, created_by, invite_code)
  VALUES (name_input, curr_user_id, new_invite_code)
  RETURNING id INTO new_household_id;

  -- Insert Membership (Admin)
  INSERT INTO household_members (household_id, user_id, role)
  VALUES (new_household_id, curr_user_id, 'admin');

  RETURN json_build_object(
    'success', true, 
    'household_id', new_household_id,
    'invite_code', new_invite_code
  );

EXCEPTION 
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'message', 'Database error: ' || SQLERRM);
END;
$$;


-- Update join_household to allow multiple families
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

  -- REMOVED: Check if already in a family

  -- Lookup Household by invite_code OR id
  SELECT id INTO target_household_id
  FROM households
  WHERE invite_code = invite_code_input
  OR id::text = invite_code_input
  LIMIT 1;

  IF target_household_id IS NULL THEN
     RETURN json_build_object('success', false, 'message', 'Household not found with this code.');
  END IF;

  -- Check if already a member of THIS household
  IF EXISTS (SELECT 1 FROM household_members WHERE user_id = curr_user_id AND household_id = target_household_id) THEN
      RETURN json_build_object('success', false, 'message', 'You are already a member of this household.');
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
