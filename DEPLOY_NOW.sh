#!/bin/bash

echo "🚀 FLEEKS本番デプロイ準備"
echo "========================"

# プロジェクトディレクトリ
PROJECT_DIR="/Users/leadfive/Desktop/system/031_Fleeks/fleeks-clean"

cd "$PROJECT_DIR"

# 1. プロダクションビルドのテスト
echo "📦 プロダクションビルドを実行..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ ビルド成功！"
else
    echo "❌ ビルドエラー。修正が必要です。"
    exit 1
fi

# 2. 環境変数チェック
echo ""
echo "🔐 環境変数の確認..."
if [ -f ".env.local" ]; then
    echo "✅ .env.localが存在します"
    echo "⚠️  本番環境では.env.productionを使用してください"
else
    echo "❌ .env.localが見つかりません"
fi

# 3. デプロイオプション表示
echo ""
echo "📋 デプロイオプション:"
echo ""
echo "1️⃣  Vercel (推奨 - 最も簡単)"
echo "   npx vercel"
echo ""
echo "2️⃣  Netlify"
echo "   netlify deploy --prod"
echo ""
echo "3️⃣  手動アップロード"
echo "   - outディレクトリの内容をサーバーにアップロード"
echo ""

# 4. 推奨サブドメイン
echo "🌐 推奨サブドメイン:"
echo "   • app.fleeks.jp"
echo "   • platform.fleeks.jp"
echo "   • learn.fleeks.jp"
echo ""

# 5. 次のステップ
echo "📝 次のステップ:"
echo "1. Vercelアカウントを作成: https://vercel.com"
echo "2. このコマンドを実行: npx vercel"
echo "3. プロジェクトをインポート"
echo "4. 環境変数を設定"
echo "5. カスタムドメインを追加"
echo ""

echo "準備ができたら、上記のコマンドを実行してください！"