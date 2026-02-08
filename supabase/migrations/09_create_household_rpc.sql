-- Secure RPC function to create a household and add the creator as admin
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

  -- Check if already in a family
  IF EXISTS (SELECT 1 FROM household_members WHERE user_id = curr_user_id) THEN
     RETURN json_build_object('success', false, 'message', 'You are already in a family space.');
  END IF;

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
