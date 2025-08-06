# 🚀 クイックフィックスガイド

## 問題
プロジェクトが2つの異なる構造を持っています：
1. ルートディレクトリ（`/031_Fleeks`）
2. サブディレクトリ（`/031_Fleeks/fleeks-ai-platform`）

## 解決方法

### オプション1: fleeks-ai-platformディレクトリを使用（推奨）
```bash
cd fleeks-ai-platform
npm install
npm run dev
```

### オプション2: ルートディレクトリで実行
```bash
# ルートディレクトリに戻る
cd /Users/leadfive/Desktop/system/031_Fleeks

# 必要なパッケージをインストール
npm install next-pwa @supabase/auth-helpers-nextjs

# 開発サーバー起動
npm run dev
```

## 正しいディレクトリ構造

fleeks-ai-platformが本来のプロジェクトディレクトリです。
こちらには必要な依存関係がすべて含まれています。

## アクセス方法
```
http://localhost:3000
```
または（ポートが使用中の場合）
```
http://localhost:3001
```