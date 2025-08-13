-- Fix Function Search Path Mutable warnings for FLEEKS functions
-- Using the correct function signatures from the database

-- 1. check_video_access - with correct parameters
ALTER FUNCTION public.check_video_access(p_user_id uuid, p_video_id text, p_required_tier text) 
SET search_path = public, pg_catalog;

-- 2. fleeks_get_current_user_id - no parameters
ALTER FUNCTION public.fleeks_get_current_user_id() 
SET search_path = public, pg_catalog;

-- 3. fleeks_handle_updated_at - no parameters
ALTER FUNCTION public.fleeks_handle_updated_at() 
SET search_path = public, pg_catalog;

-- 4. fleeks_is_admin - no parameters
ALTER FUNCTION public.fleeks_is_admin() 
SET search_path = public, pg_catalog;

-- 5. handle_fleeks_new_user - no parameters
ALTER FUNCTION public.handle_fleeks_new_user() 
SET search_path = public, pg_catalog;

-- 6. is_fleeks_user - with uuid parameter
ALTER FUNCTION public.is_fleeks_user(user_id uuid) 
SET search_path = public, pg_catalog;

-- 7. log_video_access - with correct parameters
ALTER FUNCTION public.log_video_access(p_user_id uuid, p_video_id text, p_video_title text, p_watch_duration integer, p_total_duration integer) 
SET search_path = public, pg_catalog;

-- 8. update_video_view_count - no parameters
ALTER FUNCTION public.update_video_view_count() 
SET search_path = public, pg_catalog;

-- Additional functions from the security report (if they exist)
-- Using DO blocks to handle cases where functions might not exist

DO $$
DECLARE
    func_exists boolean;
BEGIN
    -- handle_updated_at
    SELECT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_updated_at' AND pronamespace = 'public'::regnamespace) INTO func_exists;
    IF func_exists THEN
        BEGIN
            ALTER FUNCTION public.handle_updated_at() SET search_path = public, pg_catalog;
            RAISE NOTICE 'Fixed handle_updated_at';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not fix handle_updated_at: %', SQLERRM;
        END;
    END IF;
    
    -- update_updated_at_column
    SELECT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column' AND pronamespace = 'public'::regnamespace) INTO func_exists;
    IF func_exists THEN
        BEGIN
            ALTER FUNCTION public.update_updated_at_column() SET search_path = public, pg_catalog;
            RAISE NOTICE 'Fixed update_updated_at_column';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not fix update_updated_at_column: %', SQLERRM;
        END;
    END IF;
    
    -- get_average_watch_time
    SELECT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_average_watch_time' AND pronamespace = 'public'::regnamespace) INTO func_exists;
    IF func_exists THEN
        BEGIN
            ALTER FUNCTION public.get_average_watch_time() SET search_path = public, pg_catalog;
            RAISE NOTICE 'Fixed get_average_watch_time';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not fix get_average_watch_time: %', SQLERRM;
        END;
    END IF;
    
    -- get_user_growth
    SELECT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_growth' AND pronamespace = 'public'::regnamespace) INTO func_exists;
    IF func_exists THEN
        BEGIN
            ALTER FUNCTION public.get_user_growth() SET search_path = public, pg_catalog;
            RAISE NOTICE 'Fixed get_user_growth';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not fix get_user_growth: %', SQLERRM;
        END;
    END IF;
    
    -- update_daily_stats
    SELECT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_daily_stats' AND pronamespace = 'public'::regnamespace) INTO func_exists;
    IF func_exists THEN
        BEGIN
            ALTER FUNCTION public.update_daily_stats() SET search_path = public, pg_catalog;
            RAISE NOTICE 'Fixed update_daily_stats';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not fix update_daily_stats: %', SQLERRM;
        END;
    END IF;
    
    -- update_education_updated_at
    SELECT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_education_updated_at' AND pronamespace = 'public'::regnamespace) INTO func_exists;
    IF func_exists THEN
        BEGIN
            ALTER FUNCTION public.update_education_updated_at() SET search_path = public, pg_catalog;
            RAISE NOTICE 'Fixed update_education_updated_at';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not fix update_education_updated_at: %', SQLERRM;
        END;
    END IF;
END $$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Security fixes applied successfully!';
END $$;

-- Note: Don't forget to update Auth settings in Supabase Dashboard:
-- 1. Go to Authentication > Settings
-- 2. Set OTP expiry to 3600 seconds (1 hour) or less
-- 3. Enable "Leaked Password Protection"