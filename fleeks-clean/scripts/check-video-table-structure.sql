-- Check the structure of fleeks_videos table

-- 1. Show all columns in fleeks_videos
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'fleeks_videos'
ORDER BY ordinal_position;

-- 2. Check if view_count column exists
SELECT 
    EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'fleeks_videos' 
        AND column_name = 'view_count'
    ) as view_count_exists;

-- 3. If view_count doesn't exist, add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'fleeks_videos' 
        AND column_name = 'view_count'
    ) THEN
        ALTER TABLE fleeks_videos 
        ADD COLUMN view_count INTEGER DEFAULT 0;
        
        RAISE NOTICE 'Added view_count column to fleeks_videos table';
    ELSE
        RAISE NOTICE 'view_count column already exists';
    END IF;
END $$;

-- 4. Show sample data from fleeks_videos
SELECT 
    id,
    title,
    youtube_id,
    is_premium,
    published_at,
    created_at
FROM fleeks_videos
ORDER BY created_at DESC
LIMIT 5;