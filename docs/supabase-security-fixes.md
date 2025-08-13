# Supabase セキュリティ修正ガイド

## 実施済みの修正

### 1. Function Search Path Mutable の修正
以下のSQLマイグレーションファイルを作成しました：
- `/supabase/migrations/20250813_fix_security_warnings.sql`

このファイルは、すべてのFLEEKS関連の関数に対して安全な`search_path`を設定します。

**適用方法：**
```bash
# Supabase CLIを使用してマイグレーションを実行
supabase db push
```

または、Supabaseダッシュボードから直接SQLを実行：
1. SQL Editorを開く
2. マイグレーションファイルの内容をコピー＆ペースト
3. 実行

## 手動で設定が必要な項目

### 2. OTP有効期限の短縮
**現在の問題：** OTPの有効期限が1時間以上に設定されている

**修正手順：**
1. Supabaseダッシュボードにログイン
2. Authentication > Settings に移動
3. Email Configuration セクションを探す
4. "OTP expiry duration" を 3600秒（1時間）以下に設定
5. Save をクリック

### 3. 漏洩パスワード保護の有効化
**現在の問題：** 漏洩パスワード保護が無効

**修正手順：**
1. Supabaseダッシュボードにログイン
2. Authentication > Settings に移動
3. Security セクションを探す
4. "Enable Leaked Password Protection" をオンにする
5. Save をクリック

## なぜこれらの修正が重要か

### Function Search Path
- **リスク：** SQLインジェクション攻撃の可能性
- **対策：** 明示的なsearch_pathの設定により、意図しないスキーマからの関数実行を防ぐ

### OTP有効期限
- **リスク：** 長い有効期限は、OTPトークンが盗まれた場合のリスクを増大させる
- **推奨：** 30分〜1時間以内

### 漏洩パスワード保護
- **利点：** HaveIBeenPwnedデータベースと照合し、漏洩したパスワードの使用を防ぐ
- **ユーザー体験：** より安全なパスワードの選択を促す

## 確認方法

修正後、再度Supabaseのセキュリティレポートを実行して、警告が解消されたことを確認してください。

## 無視して良い警告

以下の警告はFLEEKSプロジェクトとは無関係なので無視：
- `hotel_search`スキーマ関連のすべての警告
- `postgis`および`vector`拡張機能の警告（これらは一般的に使用される拡張機能）