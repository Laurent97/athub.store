-- Create get_or_create_user_simple function
-- This function creates a user if they don't exist, or returns existing user ID

CREATE OR REPLACE FUNCTION get_or_create_user_simple(
    user_email TEXT,
    user_full_name TEXT DEFAULT NULL,
    user_type TEXT DEFAULT 'user'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    existing_user_id UUID;
    new_user_id UUID;
BEGIN
    -- First, try to find existing user by email
    SELECT id INTO existing_user_id
    FROM users
    WHERE email = user_email
    LIMIT 1;
    
    -- If user exists, return their ID
    IF existing_user_id IS NOT NULL THEN
        RETURN existing_user_id;
    END IF;
    
    -- If user doesn't exist, create them
    -- Generate a new UUID for the user
    new_user_id := gen_random_uuid();
    
    -- Insert the new user with the provided user_type
    INSERT INTO users (
        id,
        email,
        full_name,
        user_type,
        created_at,
        updated_at
    ) VALUES (
        new_user_id,
        user_email,
        user_full_name,
        user_type,
        NOW(),
        NOW()
    );
    
    -- Return the new user ID
    RETURN new_user_id;
    
EXCEPTION
    WHEN unique_violation THEN
        -- Handle race condition where user was created by another process
        SELECT id INTO existing_user_id
        FROM users
        WHERE email = user_email
        LIMIT 1;
        
        IF existing_user_id IS NOT NULL THEN
            RETURN existing_user_id;
        ELSE
            RAISE EXCEPTION 'Failed to create or retrieve user for email: %', user_email;
        END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_or_create_user_simple TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION get_or_create_user_simple IS 'Creates a user if they dont exist, or returns existing user ID. Defaults user_type to user if not specified.';
