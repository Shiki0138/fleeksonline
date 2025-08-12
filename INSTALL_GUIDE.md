# 🔧 Fleeks インストール・実行ガイド

## ❗ 現在の状況
- Node.js v24.3.0, npm 11.4.2 確認済み
- node_modulesのインストール競合が発生中
- 段階1（ドキュメント整理）は完了済み

## 🚀 推奨実行手順

### 1. 依存関係のクリーンインストール
```bash
# 現在のプロジェクトディレクトリで
cd /Users/leadfive/Desktop/system/031_Fleeks

# node_modulesとlockファイルを削除
rm -rf node_modules package-lock.json

# 依存関係を再インストール
npm install

# 開発サーバー起動
npm run dev
```

### 2. 代替手順（問題が続く場合）
```bash
# Yarnを使用（より安定）
npm install -g yarn
yarn install
yarn dev
```

### 3. 確認項目
```bash
# インストール成功後の確認
ls node_modules/.bin/next  # nextコマンド存在確認
npm run build              # ビルド確認
npm run dev               # 開発サーバー起動
```

## 📋 期待される結果
```
> fleeksonline@1.0.0 dev
> next dev

▲ Next.js 14.0.4
- Local:        http://localhost:3000
- Environments: .env.local

✓ Ready in 2.1s
```

## 🔍 動作確認ポイント
1. **http://localhost:3000** - メインページ
2. **http://localhost:3000/login** - ログインページ  
3. **http://localhost:3000/admin** - 管理画面
4. **http://localhost:3000/membership/upgrade** - 有料会員登録

## ⚠️ 注意事項
- **有料会員機能**は完全保護済み
- **認証システム**に変更なし
- **Supabaseキー**は環境変数で設定必要

## 🆘 トラブルシューティング
```bash
# Node.jsバージョン確認
node --version  # v16以上推奨

# npmキャッシュクリア
npm cache clean --force

# プロジェクト権限確認
ls -la package.json
```

実行日時: 2025-08-11 00:39