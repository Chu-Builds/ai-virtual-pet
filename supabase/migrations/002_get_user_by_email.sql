-- Migration 002: Add helper function to look up a user ID by email
-- This uses SECURITY DEFINER to safely query auth.users from the client.

CREATE OR REPLACE FUNCTION get_user_id_by_email(user_email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  found_user_id uuid;
BEGIN
  SELECT id INTO found_user_id
  FROM auth.users
  WHERE email = user_email
  LIMIT 1;
  RETURN found_user_id;
END;
$$;
