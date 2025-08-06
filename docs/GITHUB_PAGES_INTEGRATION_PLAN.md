# 🌐 GitHub Pages統合計画

## 📋 現状分析

### 既存GitHub Pagesサイト
- **URL**: https://shiki0138.github.io/fleeksonline/
- **内容**: FLEEKSバックエンドAPI・AI Beauty Platformドキュメント
- **形式**: 静的HTML（README.md基盤）
- **言語**: 英語・日本語混在

### 現在のFLEEKSプラットフォーム
- **フロントエンド**: React + TypeScript + Vite
- **バックエンド**: Node.js + Fastify + Prisma
- **認証**: JWT + Supabase連携
- **機能**: 動画管理・ユーザー認証・管理者ダッシュボード

## 🎯 統合戦略

### 1. ハイブリッドアーキテクチャ
```
GitHub Pages (静的) + Supabase Edge Functions (動的)
├── 静的コンテンツ: ランディングページ・ドキュメント
├── 動的機能: 認証・動画ストリーミング・API
└── デプロイ: GitHub Actions自動化
```

### 2. 統合方法オプション

#### A. 完全統合アプローチ（推奨）
```
1. 現在のReactアプリをGitHub Pagesにビルド
2. 既存ドキュメントを統合
3. Supabaseで認証・データ管理
4. GitHub Actionsで自動デプロイ
```

#### B. リダイレクトアプローチ
```
1. GitHub Pagesをランディングページとして維持
2. ログイン後、FLEEKSアプリにリダイレクト
3. シンプルだが、ユーザー体験が分断される
```

## 🚀 実装手順

### Phase 1: GitHub Pagesセットアップ
1. **Next.js Static Export設定**
   ```json
   // next.config.js
   output: 'export'
   trailingSlash: true
   basePath: '/fleeksonline'
   ```

2. **GitHub Actions設定**
   ```yaml
   # .github/workflows/deploy.yml
   - Build React app
   - Export static files  
   - Deploy to gh-pages branch
   ```

### Phase 2: 認証統合
1. **Supabase Auth統合**
   - GitHub Pages環境でのSupabase設定
   - 認証状態管理（localStorage）
   - 認証フロー最適化

2. **API統合**
   - Supabase Edge Functions活用
   - CORS設定調整
   - 静的サイトでのAPI呼び出し

### Phase 3: UI統合
1. **既存ドキュメント統合**
   - README.mdをReactコンポーネント化
   - 一貫したデザインシステム適用
   - 日本語UI最適化

2. **レスポンシブ対応**
   - モバイルファースト設計
   - PWA機能追加

## 📁 新しいディレクトリ構造

```
/
├── public/                 # 静的アセット
│   ├── images/
│   └── manifest.json
├── src/
│   ├── components/
│   │   ├── landing/        # ランディングページ
│   │   ├── auth/          # 認証コンポーネント
│   │   └── docs/          # ドキュメント統合
│   ├── pages/
│   │   ├── index.tsx      # トップページ
│   │   ├── login.tsx      # ログインページ
│   │   └── dashboard.tsx  # 認証後ダッシュボード
│   └── lib/
│       ├── supabase.ts    # Supabase設定
│       └── auth.ts        # 認証ロジック
├── docs/                  # 既存ドキュメント統合
└── .github/
    └── workflows/
        └── deploy.yml     # 自動デプロイ
```

## 🔧 技術要件

### 必要な変更
1. **プロジェクト構造**
   - Next.jsへの移行（静的エクスポート対応）
   - GitHub Actions設定
   - 環境変数管理（GitHub Secrets）

2. **認証システム**
   - Supabase Auth設定調整
   - 静的サイト向け認証フロー
   - セッション管理最適化

### 制約事項
- 静的ファイルのみ配信可能
- サーバーサイド処理はSupabase Edge Functionsで代替
- リアルタイム機能は制限される

## 🎨 デザイン統合

### 既存サイトデザイン活用
- ドキュメントスタイルを維持
- FLEEKSブランディングと統合
- 日本語フォント最適化

### 新UI要素追加
- ログインボタン・フォーム
- ユーザーダッシュボード
- 動画プレイヤー統合

## 📊 期待される効果

### ユーザー体験向上
- 統一されたブランド体験
- シームレスな認証フロー
- 高速な静的サイト配信

### 技術的メリット
- GitHub Pages無料ホスティング
- 自動デプロイメント
- CDN配信による高速化

## ⚡ 次のアクション

1. **現在のReactアプリをNext.js化**
2. **GitHub Pages用ビルド設定**
3. **Supabase認証の静的サイト対応**
4. **既存ドキュメントの統合**
5. **デプロイメント自動化**

---

**判定**: ✅ **実装可能** - 技術的制約はありますが、Supabase + GitHub Pagesの組み合わせで実現可能です。