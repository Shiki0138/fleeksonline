#!/bin/bash

echo "🔧 ビルドエラーを修正します..."

# 1. 不足している依存関係をインストール
echo "📦 依存関係をインストール..."
npm install framer-motion react-hot-toast

# 2. 重複ファイルを削除（page.tsxとroute.tsが両方存在）
echo "🗑️ 重複ファイルを削除..."
if [ -f "src/app/auth/callback/route.ts" ]; then
    rm src/app/auth/callback/route.ts
    echo "✅ route.ts を削除しました"
fi

# 3. auth-helpers.tsをクライアント用に修正
echo "📝 auth-helpers.tsを修正..."
cat > src/lib/auth-helpers-client.ts << 'EOF'
'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export const createClient = () => {
  return createClientComponentClient()
}
EOF

# 4. サーバー用のauth-helpersを作成
cat > src/lib/auth-helpers-server.ts << 'EOF'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const createServerClient = () => {
  return createServerComponentClient({ cookies })
}
EOF

echo "✅ 修正が完了しました！"
echo ""
echo "次のコマンドでビルドを確認:"
echo "npm run build"