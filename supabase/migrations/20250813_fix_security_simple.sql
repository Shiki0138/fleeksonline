-- Fix security warnings for FLEEKS functions only
-- This version only fixes the functions we know exist from the CSV file

-- 1. check_video_access
ALTER FUNCTION public.check_video_access(p_user_id uuid, p_video_id text, p_required_tier text) 
SET search_path = public, pg_catalog;

-- 2. fleeks_get_current_user_id
ALTER FUNCTION public.fleeks_get_current_user_id() 
SET search_path = public, pg_catalog;

-- 3. fleeks_handle_updated_at
ALTER FUNCTION public.fleeks_handle_updated_at() 
SET search_path = public, pg_catalog;

-- 4. fleeks_is_admin
ALTER FUNCTION public.fleeks_is_admin() 
SET search_path = public, pg_catalog;

-- 5. handle_fleeks_new_user
ALTER FUNCTION public.handle_fleeks_new_user() 
SET search_path = public, pg_catalog;

-- 6. is_fleeks_user
ALTER FUNCTION public.is_fleeks_user(user_id uuid) 
SET search_path = public, pg_catalog;

-- 7. log_video_access
ALTER FUNCTION public.log_video_access(p_user_id uuid, p_video_id text, p_video_title text, p_watch_duration integer, p_total_duration integer) 
SET search_path = public, pg_catalog;

-- 8. update_video_view_count
ALTER FUNCTION public.update_video_view_count() 
SET search_path = public, pg_catalog;

-- Done! These are all the FLEEKS functions that exist
-- 
-- IMPORTANT: Don't forget to update Auth settings in Supabase Dashboard:
-- 1. Go to Authentication > Settings
-- 2. Email Configuration > OTP expiry duration: 3600 seconds or less
-- 3. Security > Enable Leaked Password Protection: ON