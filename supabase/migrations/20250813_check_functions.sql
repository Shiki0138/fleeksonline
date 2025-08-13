-- Check function signatures for FLEEKS functions
-- Run this query to see the actual function parameters

SELECT 
    proname as function_name,
    pg_get_function_arguments(oid) as arguments,
    prosrc as source_code_preview
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
AND proname IN (
    'check_video_access',
    'log_video_access',
    'fleeks_handle_updated_at',
    'handle_fleeks_new_user',
    'fleeks_is_admin',
    'is_fleeks_user',
    'fleeks_get_current_user_id',
    'update_video_view_count',
    'update_daily_stats',
    'get_average_watch_time',
    'get_user_growth',
    'update_education_updated_at',
    'handle_updated_at',
    'update_updated_at_column'
)
ORDER BY proname;