# 📁 FLEEKS プロジェクト構造ガイド

## 現在の状況
プロジェクトが2つの場所に分かれています：
1. **ルートディレクトリ** (`/031_Fleeks/`)
2. **fleeks-ai-platformディレクトリ** (`/031_Fleeks/fleeks-ai-platform/`)

## 🎯 推奨される構造

### 統一された構造に移行する方法

#### オプション1: fleeks-ai-platformを使用（推奨）
```bash
# 正しいディレクトリに移動
cd /Users/leadfive/Desktop/system/031_Fleeks/fleeks-ai-platform

# 開発サーバー起動
npm run dev
```

#### オプション2: ルートディレクトリに統合
すべてのソースコードをルートに移動して統一する

## 📂 理想的な構造

```
031_Fleeks/
├── src/                    # ソースコード
│   ├── app/               # Next.js App Router
│   ├── components/        # Reactコンポーネント
│   ├── hooks/            # カスタムフック
│   ├── lib/              # ライブラリ設定
│   └── utils/            # ユーティリティ
├── public/                # 静的ファイル
├── docs/                  # ドキュメント
├── scripts/               # スクリプト
├── .env.local            # 環境変数
├── package.json          # 依存関係
├── next.config.js        # Next.js設定
├── tsconfig.json         # TypeScript設定
└── tailwind.config.js    # Tailwind設定
```

## 🔧 クリーンアップ手順

### 1. どちらを使うか決める
- **fleeks-ai-platform**: より完全な実装
- **ルートディレクトリ**: シンプルな構造

### 2. 不要なファイルを削除
- 使わない方のディレクトリを削除
- 重複するファイルを整理

### 3. 環境変数を統一
- `.env.local`を使用するディレクトリに配置
- パスを統一

## 🚀 今すぐ使える方法

### fleeks-ai-platformを使う場合：
```bash
cd fleeks-ai-platform
npm install
npm run dev
```

### ルートディレクトリを使う場合：
```bash
cd /Users/leadfive/Desktop/system/031_Fleeks
npm run dev
```

現在、ルートディレクトリの開発サーバーが起動中です：
http://localhost:3000