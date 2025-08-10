# 🔐 FLEEKS Platform - Supabase Setup (Fixed Version)

## 🚨 Fixed Auth Table Error

The previous error `ERROR: 42501: must be owner of table users` occurred because we tried to modify the `auth.users` table directly. This version fixes that issue.

## 📋 Step-by-Step Setup

### Step 1: Run Main Migration Script

**Execute in Supabase SQL Editor:**

```sql
-- Copy and paste the entire content from:
scripts/supabase-migration-fixed.sql
```

This script will:
- ✅ Create all tables (profiles, videos, blog_posts, etc.)
- ✅ Set up Row Level Security policies
- ✅ Create performance indexes
- ✅ Avoid touching auth.users directly

### Step 2: Set up Database Triggers

**Execute in Supabase SQL Editor:**

```sql
-- Copy and paste from:
scripts/supabase-triggers-setup.sql
```

### Step 3: Create Auth Trigger (Supabase Dashboard)

**⚠️ Important: This must be done through Supabase Dashboard, not SQL Editor**

1. Go to **Database** → **Triggers** in Supabase Dashboard
2. Click **Create a new trigger**
3. Fill in:
   - **Name**: `on_auth_user_created`
   - **Table**: `auth.users`
   - **Events**: `INSERT` (check this box)
   - **Type**: `After`
   - **Function**: `public.handle_new_user()`
4. Click **Create trigger**

### Step 4: Create Admin User

1. **Go to Authentication** → **Users** in Supabase Dashboard
2. **Click "Add user"**
3. **Fill in:**
   - Email: `greenroom51@gmail.com`
   - Password: `Fkyosai51`
   - Auto Confirm User: ✅ (check this)
4. **Click "Create user"**

### Step 5: Verify Admin User Setup

**Run this query in SQL Editor to verify:**

```sql
-- Check if admin user was created correctly
SELECT 
  u.email,
  u.created_at,
  p.role,
  p.membership_type,
  p.full_name
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'greenroom51@gmail.com';
```

**Expected Result:**
- Email: `greenroom51@gmail.com`
- Role: `admin`
- Membership Type: `free` (will be automatically set)

### Step 6: Update Admin User (Optional)

If you want to set the admin user as VIP member:

```sql
UPDATE profiles 
SET membership_type = 'vip'
WHERE id = (
  SELECT id FROM auth.users 
  WHERE email = 'greenroom51@gmail.com'
);
```

### Step 7: Insert Sample Data (Optional)

```sql
-- Insert sample videos for testing
INSERT INTO videos (
  youtube_id,
  title,
  description,
  category,
  duration,
  is_premium
) VALUES
  ('xdHq_H-VF80', 'Instagram集客の基礎：フォロワーを増やす5つの戦略', 'Instagramでビジネスを成長させるための基本戦略を解説。', 'Instagram集客', 1200, true),
  ('R6m6YtYj7w8', '顧客心理を掴む接客術：リピート率80%の秘密', '心理学的アプローチを活用した接客方法を実践的に解説。', '接客スキル', 1800, true),
  ('hJ22_BtUoQA', 'ローカルビジネスのためのMEO対策完全ガイド', 'Googleマイビジネスを活用した地域集客の方法を徹底解説。', 'デジタルマーケティング', 2400, true),
  ('vMq5vrfHlKI', 'インスタライブで売上を3倍にする方法', 'ライブコマースの成功事例と実践的なテクニック。', 'Instagram集客', 1500, true),
  ('6F9lUORkrNA', '価格設定の心理学：利益を最大化する戦略', '行動経済学に基づいた価格設定の方法を解説。', '経営戦略', 2100, true),
  ('_-0SaFXGeNw', 'SNS広告運用の基礎：少額予算で始める集客', 'Facebook/Instagram広告の基本設定から効果測定まで。', 'デジタルマーケティング', 1950, false),
  ('U43Z0O_PHNE', 'リールで爆発的にフォロワーを増やす方法', 'Instagramリールのアルゴリズムを理解し、バズるコンテンツを作る方法。', 'Instagram集客', 1650, true),
  ('X4I3wHH1cJY', 'ストーリーズを使った集客テクニック10選', 'Instagramストーリーズの機能を最大限活用する方法。', 'Instagram集客', 1350, false),
  ('cV8ynHlaq6I', 'クレーム対応の極意：ピンチをチャンスに変える', '難しいお客様への対応方法を心理学的アプローチで解説。', '接客スキル', 1750, true),
  ('vGdVg_Zl1b0', '競合分析の基本：差別化戦略の立て方', '競合店舗の分析方法と自店の強みを見つける方法。', '経営戦略', 2050, true)
ON CONFLICT (youtube_id) DO NOTHING;
```

## 🔍 Verification Checklist

After setup, verify these queries work:

### 1. Check Tables Created
```sql
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

### 2. Check RLS Policies
```sql
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### 3. Check Triggers
```sql
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
```

### 4. Check Sample Data
```sql
SELECT COUNT(*) as video_count FROM videos;
SELECT COUNT(*) as profile_count FROM profiles;
SELECT email, role FROM profiles p JOIN auth.users u ON p.id = u.id;
```

## 🚨 Troubleshooting

### Common Issues:

1. **"Function does not exist" error**
   - Make sure triggers script ran successfully
   - Check if functions were created in the `public` schema

2. **"Trigger not found" error**
   - Create auth trigger through Dashboard, not SQL
   - Ensure function exists before creating trigger

3. **"Admin user not created" error**
   - Check if user exists in Authentication > Users
   - Verify trigger fired by checking profiles table
   - Run manual profile creation if needed

4. **"RLS policy denies access" error**
   - Check if user has proper role in profiles table
   - Verify auth.email() returns correct email
   - Test with specific user ID

### Manual Admin Profile Creation

If the trigger didn't create admin profile:

```sql
-- Insert admin profile manually
INSERT INTO profiles (id, role, membership_type, full_name)
SELECT u.id, 'admin', 'vip', 'Administrator'
FROM auth.users u
WHERE u.email = 'greenroom51@gmail.com'
AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.id);
```

## 🎯 Next Steps

1. ✅ Complete database setup
2. ✅ Verify admin user access
3. ✅ Test video/blog functionality
4. 🔄 Set environment variables in Vercel
5. 🔄 Deploy and test production

This fixed version avoids auth table permissions issues and provides a robust, secure database foundation for the FLEEKS platform.