#!/bin/bash

# FLEEKSデプロイメント確認スクリプト

echo "🔍 FLEEKSデプロイメント状態確認中..."
echo "=================================="

# 色定義
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Vercel仮URLチェック
echo -e "\n📡 Vercel仮URL確認:"
VERCEL_URL="https://fleeksonline-qy7b5f0bt-shikis-projects-6e27447a.vercel.app"
if curl -s -o /dev/null -w "%{http_code}" "$VERCEL_URL" | grep -q "200\|301\|302"; then
    echo -e "${GREEN}✅ Vercel仮URL: アクセス可能${NC}"
    echo "   URL: $VERCEL_URL"
else
    echo -e "${RED}❌ Vercel仮URL: アクセス不可${NC}"
fi

# 2. カスタムドメインチェック
echo -e "\n🌐 カスタムドメイン確認:"
CUSTOM_DOMAIN="https://app.fleeks.jp"
if curl -s -o /dev/null -w "%{http_code}" "$CUSTOM_DOMAIN" | grep -q "200\|301\|302"; then
    echo -e "${GREEN}✅ カスタムドメイン: 設定完了${NC}"
    echo "   URL: $CUSTOM_DOMAIN"
else
    echo -e "${YELLOW}⏳ カスタムドメイン: 設定待ち${NC}"
    echo "   DNS反映には最大48時間かかる場合があります"
fi

# 3. DNS確認
echo -e "\n🔗 DNS設定確認:"
DNS_RESULT=$(dig +short CNAME app.fleeks.jp 2>/dev/null)
if [[ ! -z "$DNS_RESULT" ]]; then
    echo -e "${GREEN}✅ CNAMEレコード検出:${NC}"
    echo "   app.fleeks.jp → $DNS_RESULT"
else
    echo -e "${YELLOW}⏳ CNAMEレコード: 未検出${NC}"
    echo "   ムームーDNSで設定を確認してください"
fi

# 4. SSL証明書確認
echo -e "\n🔐 SSL証明書確認:"
if echo | openssl s_client -servername app.fleeks.jp -connect app.fleeks.jp:443 2>/dev/null | openssl x509 -noout -issuer 2>/dev/null | grep -q "Let's Encrypt"; then
    echo -e "${GREEN}✅ SSL証明書: 有効${NC}"
else
    echo -e "${YELLOW}⏳ SSL証明書: 確認中${NC}"
fi

# 5. 推奨事項
echo -e "\n📋 次のステップ:"
echo "1. Vercelダッシュボードで環境変数を設定"
echo "2. ムームーDNSでCNAMEレコードを確認"
echo "3. DNS反映を待つ（通常数分〜数時間）"
echo "4. https://app.fleeks.jp でアクセステスト"

echo -e "\n=================================="
echo "確認完了！"