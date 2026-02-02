-- Create a function to delete auth users
CREATE OR REPLACE FUNCTION admin_delete_user(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deletion_count INTEGER;
BEGIN
    -- First, delete from the users table (this should already be done by the app)
    -- But we'll include it here for completeness and to handle foreign key constraints
    DELETE FROM users WHERE id = user_id;
    
    -- Then delete from auth.users table
    DELETE FROM auth.users WHERE id = user_id;
    
    -- Check if deletion was successful
    GET DIAGNOSTICS deletion_count = ROW_COUNT;
    
    RETURN deletion_count > 0;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to delete user: %', SQLERRM;
        RETURN FALSE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION admin_delete_user(UUID) TO authenticated;
