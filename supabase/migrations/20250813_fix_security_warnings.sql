-- Fix Function Search Path Mutable warnings for FLEEKS functions
-- This sets a secure search_path for all FLEEKS-related functions

-- First, let's check which functions exist and fix them one by one
-- Run each ALTER FUNCTION separately to identify which ones exist

-- 1. fleeks_handle_updated_at
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'fleeks_handle_updated_at' AND pronamespace = 'public'::regnamespace) THEN
        ALTER FUNCTION public.fleeks_handle_updated_at() SET search_path = public, pg_catalog;
        RAISE NOTICE 'Fixed fleeks_handle_updated_at';
    END IF;
END $$;

-- 2. handle_fleeks_new_user
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_fleeks_new_user' AND pronamespace = 'public'::regnamespace) THEN
        ALTER FUNCTION public.handle_fleeks_new_user() SET search_path = public, pg_catalog;
        RAISE NOTICE 'Fixed handle_fleeks_new_user';
    END IF;
END $$;

-- 3. check_video_access (skip for now - parameter mismatch)
-- Need to check actual function signature in Supabase dashboard

-- 4. fleeks_is_admin
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'fleeks_is_admin' AND pronamespace = 'public'::regnamespace) THEN
        ALTER FUNCTION public.fleeks_is_admin() SET search_path = public, pg_catalog;
        RAISE NOTICE 'Fixed fleeks_is_admin';
    END IF;
END $$;

-- 5. is_fleeks_user
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_fleeks_user' AND pronamespace = 'public'::regnamespace) THEN
        ALTER FUNCTION public.is_fleeks_user(user_id uuid) SET search_path = public, pg_catalog;
        RAISE NOTICE 'Fixed is_fleeks_user';
    END IF;
END $$;

-- 6. fleeks_get_current_user_id
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'fleeks_get_current_user_id' AND pronamespace = 'public'::regnamespace) THEN
        ALTER FUNCTION public.fleeks_get_current_user_id() SET search_path = public, pg_catalog;
        RAISE NOTICE 'Fixed fleeks_get_current_user_id';
    END IF;
END $$;

-- 7. update_video_view_count
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_video_view_count' AND pronamespace = 'public'::regnamespace) THEN
        ALTER FUNCTION public.update_video_view_count(p_video_id uuid) SET search_path = public, pg_catalog;
        RAISE NOTICE 'Fixed update_video_view_count';
    END IF;
END $$;

-- 8. log_video_access (skip for now - need to check parameters)
-- Need to check actual function signature in Supabase dashboard

-- 9. update_daily_stats
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_daily_stats' AND pronamespace = 'public'::regnamespace) THEN
        ALTER FUNCTION public.update_daily_stats() SET search_path = public, pg_catalog;
        RAISE NOTICE 'Fixed update_daily_stats';
    END IF;
END $$;

-- 10. get_average_watch_time
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_average_watch_time' AND pronamespace = 'public'::regnamespace) THEN
        ALTER FUNCTION public.get_average_watch_time() SET search_path = public, pg_catalog;
        RAISE NOTICE 'Fixed get_average_watch_time';
    END IF;
END $$;

-- 11. get_user_growth
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_growth' AND pronamespace = 'public'::regnamespace) THEN
        ALTER FUNCTION public.get_user_growth() SET search_path = public, pg_catalog;
        RAISE NOTICE 'Fixed get_user_growth';
    END IF;
END $$;

-- 12. update_education_updated_at
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_education_updated_at' AND pronamespace = 'public'::regnamespace) THEN
        ALTER FUNCTION public.update_education_updated_at() SET search_path = public, pg_catalog;
        RAISE NOTICE 'Fixed update_education_updated_at';
    END IF;
END $$;

-- 13. handle_updated_at
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_updated_at' AND pronamespace = 'public'::regnamespace) THEN
        ALTER FUNCTION public.handle_updated_at() SET search_path = public, pg_catalog;
        RAISE NOTICE 'Fixed handle_updated_at';
    END IF;
END $$;

-- 14. update_updated_at_column
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column' AND pronamespace = 'public'::regnamespace) THEN
        ALTER FUNCTION public.update_updated_at_column() SET search_path = public, pg_catalog;
        RAISE NOTICE 'Fixed update_updated_at_column';
    END IF;
END $$;

-- Note: Auth configuration (OTP expiry and leaked password protection) 
-- needs to be updated in Supabase Dashboard:
-- 1. Go to Authentication > Settings
-- 2. Set OTP expiry to 3600 seconds (1 hour) or less
-- 3. Enable "Leaked Password Protection"