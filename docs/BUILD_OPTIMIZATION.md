# ビルド最適化ガイド

## 非推奨パッケージの警告

現在のビルドログに以下の非推奨パッケージの警告が表示されています：

### 1. @supabase/auth-helpers-nextjs → @supabase/ssr
```bash
npm install @supabase/ssr
npm uninstall @supabase/auth-helpers-nextjs @supabase/auth-helpers-shared
```

### 2. その他の非推奨パッケージ
- sourcemap-codec → @jridgewell/sourcemap-codec
- rollup-plugin-terser → @rollup/plugin-terser
- rimraf v2 → rimraf v4+
- glob v7 → glob v9+

## パッケージ更新コマンド

```bash
# Supabase SSRへの移行
npm install @supabase/ssr

# 非推奨パッケージの削除
npm uninstall @supabase/auth-helpers-nextjs @supabase/auth-helpers-shared

# 依存関係の更新
npm update
```

## 注意事項

1. **Supabase SSRへの移行は慎重に**
   - 認証ロジックの変更が必要
   - 既存のコードベースとの互換性確認が必要

2. **段階的な更新を推奨**
   - まずは現在のビルドエラーを解決
   - その後、非推奨パッケージを順次更新

3. **テスト環境での検証**
   - パッケージ更新後は必ずローカルでテスト
   - 認証フローが正常に動作することを確認