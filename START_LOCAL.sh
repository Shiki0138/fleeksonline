#!/bin/bash

# FLEEKSローカル環境起動スクリプト

echo "🚀 FLEEKSローカル環境を起動します..."
echo ""

# 色の定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# .env.localファイルの確認
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  .env.localファイルが見つかりません${NC}"
    echo "作成しますか? (y/n)"
    read -r response
    if [[ "$response" == "y" ]]; then
        cp .env.example .env.local
        echo -e "${GREEN}✅ .env.localを作成しました${NC}"
        echo -e "${YELLOW}📝 .env.localを編集してSupabaseの認証情報を設定してください${NC}"
        exit 1
    else
        echo -e "${RED}❌ セットアップを中止しました${NC}"
        exit 1
    fi
fi

# Node.jsのバージョン確認
node_version=$(node -v 2>/dev/null)
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Node.jsがインストールされていません${NC}"
    echo "Node.js 18以上をインストールしてください"
    exit 1
fi

echo -e "${BLUE}📦 Node.jsバージョン: $node_version${NC}"

# パッケージのインストール確認
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 依存関係をインストールします...${NC}"
    npm install
fi

# fleeks-ai-platformディレクトリの確認
if [ -d "fleeks-ai-platform" ]; then
    cd fleeks-ai-platform
    
    # node_modulesの確認
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}📦 fleeks-ai-platform の依存関係をインストールします...${NC}"
        npm install
    fi
    
    echo ""
    echo -e "${GREEN}🎉 準備完了！${NC}"
    echo ""
    echo -e "${BLUE}開発サーバーを起動します...${NC}"
    echo -e "${BLUE}ブラウザで http://localhost:3000 にアクセスしてください${NC}"
    echo ""
    echo -e "${YELLOW}終了するには Ctrl+C を押してください${NC}"
    echo ""
    
    # 開発サーバー起動
    npm run dev
else
    echo -e "${RED}❌ fleeks-ai-platformディレクトリが見つかりません${NC}"
    echo "正しいディレクトリで実行してください"
    exit 1
fi