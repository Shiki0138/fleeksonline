# Fleeks プロジェクト整理計画

## 🎯 目的
- 有料会員向け動画・ブログ・教育コンテンツシステムの構造整理
- 不要ファイル削除による650MB+の容量削減
- 階層構造の最適化

## ⚠️ 重要な注意事項
**絶対に削除してはいけないファイル（収益に直結）:**
- `src/middleware.ts` - 認証・権限制御
- `src/components/MembershipUpgrade.tsx` - 有料会員登録
- `src/components/PremiumContent.tsx` - 有料コンテンツ制御
- `src/app/membership/upgrade/page.tsx` - 課金ページ
- `src/app/api/admin/users/route.ts` - ユーザー管理API

## 📋 段階的整理計画

### 段階1: ドキュメント整理（安全・影響なし）
```bash
# 32個の散乱MDファイルを整理
mkdir -p docs/{architecture,deployment,security,api}

# 移動対象ファイル
AI_ARCHITECTURE.md → docs/architecture/
DEPLOY_GUIDE.md → docs/deployment/
SECURITY.md → docs/security/
API_*.md → docs/api/
```

### 段階2: バックアップファイル削除（安全）
```bash
# 番号付き重複ファイル
rm next-env.d\ 2.ts
rm tsconfig\ 2.json  
rm package\ 2.json
rm next.config\ 2.js
rm src/middleware\ 2.ts
```

### 段階3: 重複プロジェクト移動（要確認）
```bash
# 古いプロジェクトフォルダ
mv fleeks-ai-platform/ ../fleeks_backup_*/
mv fleeks-platform/ ../fleeks_backup_*/
mv fleeks-clean/ ../fleeks_backup_*/
mv ai-community/ ../fleeks_backup_*/
mv frontend/ ../fleeks_backup_*/
```

### 段階4: 一時ファイル削除
```bash
rm -rf coverage/
rm -rf .next\ 2/
rm debug-password-reset.html
rm test-results.json
```

## 🔧 各段階での確認コマンド
```bash
# アプリケーション起動確認
npm run dev

# ビルド確認  
npm run build

# 認証機能確認
curl http://localhost:3000/api/auth/signout

# 管理画面確認
curl http://localhost:3000/admin
```

## 📊 期待効果
- **容量削減**: 650MB以上
- **ファイル数削減**: 500個以上
- **階層深度**: 平均2レベル削減
- **保守性向上**: 論理的なファイル配置

## 🚨 緊急時の復旧
バックアップ場所: `../fleeks_backup_YYYYMMDD_HHMMSS/`

```bash
# 全体復旧
cp -R ../fleeks_backup_*/src_backup/* src/
cp ../fleeks_backup_*/package.json .
cp ../fleeks_backup_*/next.config.js .
```

作成日時: $(date)