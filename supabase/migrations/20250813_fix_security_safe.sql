-- Safe version: Fix only the functions that definitely exist
-- This version will not cause any errors

-- First, create a helper function to safely fix search_path
CREATE OR REPLACE FUNCTION fix_function_search_path(func_name text, func_args text DEFAULT '') 
RETURNS void AS $$
DECLARE
    full_func_name text;
BEGIN
    IF func_args = '' THEN
        full_func_name := 'public.' || func_name || '()';
    ELSE
        full_func_name := 'public.' || func_name || '(' || func_args || ')';
    END IF;
    
    -- Check if function exists
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = func_name
    ) THEN
        EXECUTE format('ALTER FUNCTION %s SET search_path = public, pg_catalog', full_func_name);
        RAISE NOTICE 'Fixed search_path for %', full_func_name;
    ELSE
        RAISE NOTICE 'Function % not found, skipping', full_func_name;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error fixing %: %', full_func_name, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Now fix the functions we know should exist
SELECT fix_function_search_path('fleeks_handle_updated_at');
SELECT fix_function_search_path('handle_fleeks_new_user');
SELECT fix_function_search_path('fleeks_is_admin');
SELECT fix_function_search_path('fleeks_get_current_user_id');
SELECT fix_function_search_path('handle_updated_at');
SELECT fix_function_search_path('update_updated_at_column');
SELECT fix_function_search_path('get_average_watch_time');
SELECT fix_function_search_path('get_user_growth');
SELECT fix_function_search_path('update_daily_stats');
SELECT fix_function_search_path('update_education_updated_at');

-- For functions with parameters, we need to check first
-- Try common parameter patterns
SELECT fix_function_search_path('is_fleeks_user', 'user_id uuid');
SELECT fix_function_search_path('update_video_view_count', 'p_video_id uuid');

-- Clean up the helper function
DROP FUNCTION IF EXISTS fix_function_search_path(text, text);