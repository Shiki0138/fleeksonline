#!/bin/bash

# FLEEKS環境チェックスクリプト

echo "🔍 FLEEKS環境をチェックします..."
echo "================================"
echo ""

# 色の定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# チェック結果
all_good=true

# 1. Node.jsバージョンチェック
echo "1. Node.jsバージョン確認"
node_version=$(node -v 2>/dev/null)
if [ $? -eq 0 ]; then
    echo -e "   ${GREEN}✅ Node.js: $node_version${NC}"
else
    echo -e "   ${RED}❌ Node.jsがインストールされていません${NC}"
    all_good=false
fi
echo ""

# 2. npmバージョンチェック
echo "2. npmバージョン確認"
npm_version=$(npm -v 2>/dev/null)
if [ $? -eq 0 ]; then
    echo -e "   ${GREEN}✅ npm: v$npm_version${NC}"
else
    echo -e "   ${RED}❌ npmがインストールされていません${NC}"
    all_good=false
fi
echo ""

# 3. 環境変数ファイルチェック
echo "3. 環境変数ファイル確認"
if [ -f ".env.local" ]; then
    echo -e "   ${GREEN}✅ .env.local が存在します${NC}"
    
    # 必須環境変数のチェック
    required_vars=("NEXT_PUBLIC_SUPABASE_URL" "NEXT_PUBLIC_SUPABASE_ANON_KEY" "NEXTAUTH_SECRET")
    for var in "${required_vars[@]}"; do
        if grep -q "^$var=" .env.local && ! grep -q "^$var=your_" .env.local && ! grep -q "^$var=generate_" .env.local; then
            echo -e "   ${GREEN}✅ $var が設定されています${NC}"
        else
            echo -e "   ${YELLOW}⚠️  $var を設定してください${NC}"
            all_good=false
        fi
    done
else
    echo -e "   ${RED}❌ .env.local が見つかりません${NC}"
    echo -e "   ${YELLOW}📝 cp .env.example .env.local でファイルを作成してください${NC}"
    all_good=false
fi
echo ""

# 4. プロジェクト構造チェック
echo "4. プロジェクト構造確認"
directories=("fleeks-ai-platform" "src" "docs" "scripts")
for dir in "${directories[@]}"; do
    if [ -d "$dir" ]; then
        echo -e "   ${GREEN}✅ /$dir ディレクトリが存在します${NC}"
    else
        echo -e "   ${RED}❌ /$dir ディレクトリが見つかりません${NC}"
        all_good=false
    fi
done
echo ""

# 5. 重要ファイルの確認
echo "5. 重要ファイル確認"
files=("package.json" "scripts/generate-secure-keys.sh" "docs/SUPABASE_MIGRATION.sql")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "   ${GREEN}✅ $file が存在します${NC}"
    else
        echo -e "   ${RED}❌ $file が見つかりません${NC}"
        all_good=false
    fi
done
echo ""

# 6. Git状態確認
echo "6. Git状態確認"
if [ -d ".git" ]; then
    echo -e "   ${GREEN}✅ Gitリポジトリです${NC}"
    
    # .gitignoreに.env.localが含まれているか確認
    if grep -q ".env.local" .gitignore 2>/dev/null; then
        echo -e "   ${GREEN}✅ .env.local は.gitignoreに含まれています${NC}"
    else
        echo -e "   ${YELLOW}⚠️  .env.local を.gitignoreに追加してください${NC}"
    fi
else
    echo -e "   ${YELLOW}⚠️  Gitリポジトリではありません${NC}"
fi
echo ""

# 結果サマリー
echo "================================"
if [ "$all_good" = true ]; then
    echo -e "${GREEN}✅ 環境チェック完了！問題ありません${NC}"
    echo ""
    echo "次のステップ:"
    echo "1. ./scripts/generate-secure-keys.sh でセキュリティキーを生成"
    echo "2. .env.local にSupabaseの認証情報を設定"
    echo "3. ./START_LOCAL.sh でローカル環境を起動"
else
    echo -e "${YELLOW}⚠️  いくつかの設定が必要です${NC}"
    echo ""
    echo "セットアップガイド: docs/LOCAL_SETUP_GUIDE.md を参照してください"
fi
echo ""