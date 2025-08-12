-- 教育コンテンツの表示問題調査用クエリ

-- 1. education_contentsテーブルのstatus列の値を確認
SELECT 
    status,
    COUNT(*) as count,
    MIN(publish_date) as earliest_publish_date,
    MAX(publish_date) as latest_publish_date
FROM education_contents
GROUP BY status
ORDER BY status;

-- 2. 現在公開されているべき記事の確認（status='published' AND publish_date <= 現在時刻）
SELECT 
    article_number,
    title,
    status,
    publish_date,
    access_level,
    CASE 
        WHEN status = 'published' AND publish_date <= CURRENT_TIMESTAMP THEN '公開中'
        WHEN status = 'published' AND publish_date > CURRENT_TIMESTAMP THEN '公開予定'
        ELSE 'その他'
    END as display_status
FROM education_contents
ORDER BY article_number;

-- 3. 公開されている記事の詳細（APIエンドポイントの条件を再現）
SELECT 
    ec.id,
    ec.article_number,
    ec.title,
    ec.slug,
    ec.access_level,
    ec.publish_date,
    ec.reading_time,
    ec.status,
    ech.category,
    ech.title as chapter_title,
    ech.chapter_number
FROM education_contents ec
LEFT JOIN education_chapters ech ON ec.chapter_id = ech.id
WHERE ec.status = 'published' 
  AND ec.publish_date <= CURRENT_TIMESTAMP
ORDER BY ec.article_number;

-- 4. 公開されていない記事の理由を調査
SELECT 
    article_number,
    title,
    status,
    publish_date,
    CURRENT_TIMESTAMP as current_time,
    CASE 
        WHEN status != 'published' THEN 'ステータスがpublishedではない'
        WHEN publish_date > CURRENT_TIMESTAMP THEN '公開日時が未来'
        WHEN publish_date IS NULL THEN '公開日時がNULL'
        ELSE '条件を満たしているはず'
    END as not_published_reason
FROM education_contents
WHERE NOT (status = 'published' AND publish_date <= CURRENT_TIMESTAMP)
ORDER BY article_number;

-- 5. RLSポリシーの確認
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename IN ('education_contents', 'education_chapters')
ORDER BY tablename, policyname;

-- 6. 記事数の集計
SELECT 
    'Total Articles' as category,
    COUNT(*) as count
FROM education_contents
UNION ALL
SELECT 
    'Published Status' as category,
    COUNT(*) as count
FROM education_contents
WHERE status = 'published'
UNION ALL
SELECT 
    'Currently Viewable' as category,
    COUNT(*) as count
FROM education_contents
WHERE status = 'published' AND publish_date <= CURRENT_TIMESTAMP;