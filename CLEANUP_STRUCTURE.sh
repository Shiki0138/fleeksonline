#!/bin/bash

echo "🧹 FLEEKSプロジェクトを整理します..."

# 整理されたプロジェクトディレクトリを作成
PROJECT_ROOT="/Users/leadfive/Desktop/system/031_Fleeks"
NEW_PROJECT="$PROJECT_ROOT/fleeks-clean"

# クリーンなプロジェクトディレクトリを作成
mkdir -p "$NEW_PROJECT"

echo "📁 新しい整理された構造を作成中..."

# package.jsonを作成
cat > "$NEW_PROJECT/package.json" << 'EOF'
{
  "name": "fleeks-platform",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "14.0.4",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@supabase/auth-helpers-nextjs": "^0.10.0",
    "@supabase/supabase-js": "^2.39.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "@mui/material": "^5.14.0",
    "@mui/icons-material": "^5.14.0",
    "lucide-react": "^0.263.1"
  },
  "devDependencies": {
    "@types/node": "^20.10.5",
    "@types/react": "^18.2.45",
    "typescript": "^5.3.3"
  }
}
EOF

# next.config.jsを作成（シンプル版）
cat > "$NEW_PROJECT/next.config.js" << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['i.ytimg.com', 'img.youtube.com'],
  },
}

module.exports = nextConfig
EOF

# tsconfig.jsonを作成
cat > "$NEW_PROJECT/tsconfig.json" << 'EOF'
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": false,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
EOF

# tailwind.config.jsを作成
cat > "$NEW_PROJECT/tailwind.config.js" << 'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOF

# postcss.config.jsを作成
cat > "$NEW_PROJECT/postcss.config.js" << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

echo "✅ 基本設定ファイルを作成しました"

# ソースコードをコピー
echo "📂 ソースコードを整理中..."

# srcディレクトリを作成
mkdir -p "$NEW_PROJECT/src/app"
mkdir -p "$NEW_PROJECT/src/components"
mkdir -p "$NEW_PROJECT/src/lib"
mkdir -p "$NEW_PROJECT/src/hooks"
mkdir -p "$NEW_PROJECT/src/utils"
mkdir -p "$NEW_PROJECT/public"

# 既存のソースコードをコピー（優先順位: fleeks-ai-platform > ルート）
if [ -d "$PROJECT_ROOT/fleeks-ai-platform/src" ]; then
    cp -r "$PROJECT_ROOT/fleeks-ai-platform/src/"* "$NEW_PROJECT/src/" 2>/dev/null || true
fi

if [ -d "$PROJECT_ROOT/src" ]; then
    cp -r "$PROJECT_ROOT/src/"* "$NEW_PROJECT/src/" 2>/dev/null || true
fi

# publicディレクトリの内容をコピー
if [ -d "$PROJECT_ROOT/fleeks-ai-platform/public" ]; then
    cp -r "$PROJECT_ROOT/fleeks-ai-platform/public/"* "$NEW_PROJECT/public/" 2>/dev/null || true
fi

if [ -d "$PROJECT_ROOT/public" ]; then
    cp -r "$PROJECT_ROOT/public/"* "$NEW_PROJECT/public/" 2>/dev/null || true
fi

# .env.localをコピー
if [ -f "$PROJECT_ROOT/.env.local" ]; then
    cp "$PROJECT_ROOT/.env.local" "$NEW_PROJECT/.env.local"
else
    echo "⚠️  .env.localが見つかりません"
fi

# .gitignoreを作成
cat > "$NEW_PROJECT/.gitignore" << 'EOF'
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
EOF

echo "✅ プロジェクト構造の整理が完了しました！"
echo ""
echo "📁 新しいプロジェクトの場所:"
echo "   $NEW_PROJECT"
echo ""
echo "🚀 開発サーバーを起動するには:"
echo "   cd $NEW_PROJECT"
echo "   npm install"
echo "   npm run dev"