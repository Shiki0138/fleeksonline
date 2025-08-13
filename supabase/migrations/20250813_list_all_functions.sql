-- List all functions in public schema to see what actually exists
SELECT 
    proname as function_name,
    pg_get_function_arguments(oid) as arguments
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
AND proname LIKE '%fleeks%' 
   OR proname LIKE '%video%' 
   OR proname LIKE '%education%'
   OR proname IN ('handle_updated_at', 'update_updated_at_column', 'get_average_watch_time', 'get_user_growth', 'update_daily_stats')
ORDER BY proname;