# 🚀 FLEEKS 簡単ガイド

## 開発サーバーは起動しています！

### アクセス方法
ブラウザで以下のURLを開いてください：
```
http://localhost:3000
```

## 📁 2つのプロジェクト構造

### 1. ルートプロジェクト（現在起動中）
```
/Users/leadfive/Desktop/system/031_Fleeks/
├── src/app/          # ページコンポーネント
├── package.json      # 依存関係
└── next.config.js    # Next.js設定
```

### 2. fleeks-ai-platform（完全版）
```
/Users/leadfive/Desktop/system/031_Fleeks/fleeks-ai-platform/
├── src/              # 完全な実装
├── package.json      # すべての依存関係
└── 各種設定ファイル
```

## 🎯 どちらを使うべきか？

### 開発を続ける場合
**fleeks-ai-platformを推奨**（より完全な実装）

```bash
# 現在のサーバーを停止（Ctrl+C）
# fleeks-ai-platformに移動
cd fleeks-ai-platform
npm run dev
```

### 今すぐ確認したい場合
現在起動中のサーバーを使用：
```
http://localhost:3000
```

## 📱 利用可能なページ

### ルートプロジェクト（http://localhost:3000）
- ホームページ
- /auth/login - ログインページ
- /admin/* - 管理画面

### fleeks-ai-platform（より多機能）
- すべての機能が実装済み
- 動画制限機能
- 認証システム
- API連携

## 🔧 トラブルシューティング

### ページが表示されない場合
1. ブラウザのキャッシュをクリア
2. http://localhost:3000 を再読み込み
3. コンソールでエラーを確認

### 別のポートで起動したい場合
```bash
npm run dev -- -p 3001
```