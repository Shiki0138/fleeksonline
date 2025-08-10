#!/bin/bash

echo "📚 美容教育コンテンツ自動投稿システムのセットアップ"
echo "================================================"

# 必要なパッケージをインストール
echo "📦 必要なパッケージをインストール中..."
npm install node-cron

# コンテンツプランを生成
echo "📝 80記事のコンテンツプランを生成中..."
node scripts/generate-content-plan.js

# 環境変数の確認
echo ""
echo "⚠️  重要: 以下の環境変数が.env.localに設定されていることを確認してください:"
echo "- NEXT_PUBLIC_SUPABASE_URL"
echo "- SUPABASE_SERVICE_ROLE_KEY (管理者権限のキー)"
echo ""

# 使用方法の説明
echo "🚀 セットアップ完了！使用方法:"
echo ""
echo "1. 今すぐ2記事を投稿:"
echo "   node scripts/content-scheduler.js post"
echo ""
echo "2. 自動投稿を開始（毎日午前10時に2記事）:"
echo "   node scripts/content-scheduler.js schedule"
echo ""
echo "3. 進捗状況を確認:"
echo "   node scripts/content-scheduler.js status"
echo ""
echo "4. バックグラウンドで実行（推奨）:"
echo "   nohup node scripts/content-scheduler.js schedule > content-scheduler.log 2>&1 &"
echo ""
echo "5. PM2を使った永続化（より安定）:"
echo "   npm install -g pm2"
echo "   pm2 start scripts/content-scheduler.js --name content-scheduler -- schedule"
echo "   pm2 save"
echo "   pm2 startup"
echo ""

# 実行権限を付与
chmod +x scripts/setup-content-automation.sh

echo "✅ セットアップ完了！"