#!/bin/bash

echo "🚀 FLEEKS Platform デプロイスクリプト"
echo "=================================="

# 環境変数チェック
check_env() {
    if [ -z "$1" ]; then
        echo "❌ エラー: $2 が設定されていません"
        exit 1
    fi
}

# 1. 環境変数の確認
echo "📋 環境変数をチェック中..."
check_env "$NEXT_PUBLIC_SUPABASE_URL" "NEXT_PUBLIC_SUPABASE_URL"
check_env "$NEXT_PUBLIC_SUPABASE_ANON_KEY" "NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "✅ 環境変数チェック完了"

# 2. 依存関係のインストール
echo "📦 依存関係をインストール中..."
cd fleeks-ai-platform && npm install
cd ..

# 3. ビルドテスト
echo "🔨 プロダクションビルドをテスト中..."
cd fleeks-ai-platform && npm run build
if [ $? -ne 0 ]; then
    echo "❌ ビルドに失敗しました"
    exit 1
fi
cd ..
echo "✅ ビルド成功"

# 4. Vercelへのデプロイ
echo "🌐 Vercelにデプロイ中..."
if command -v vercel &> /dev/null; then
    vercel --prod
else
    echo "⚠️  Vercel CLIがインストールされていません"
    echo "以下のコマンドでインストールしてください:"
    echo "npm i -g vercel"
fi

echo "✅ デプロイ準備完了！"