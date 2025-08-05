# 🌟 Fleeks AI Beauty Platform

<div align="center">
  <img src="public/logo.png" alt="Fleeks Logo" width="200"/>
  <h3>最先端AI技術で美容業界を革新する学習プラットフォーム</h3>
  <p>
    <a href="#features">機能</a> •
    <a href="#tech-stack">技術スタック</a> •
    <a href="#getting-started">始め方</a> •
    <a href="#demo">デモ</a>
  </p>
</div>

## 🎯 概要

Fleeks AI Beauty Platformは、美容師・美容室経営者向けの革新的なオンライン学習プラットフォームです。最先端のAI技術を活用し、パーソナライズされた学習体験と実践的なスキル習得を提供します。

### ✨ 主要機能 <a name="features"></a>

#### 🤖 AI機能
- **インテリジェント動画解析**: 視聴パターンに基づく個別最適化
- **AIレコメンデーション**: ハイブリッド推薦システム
- **会話型AI**: 24時間対応のバーチャルアシスタント
- **感情分析**: コミュニティの健全性モニタリング
- **予測分析**: 解約予測と収益最適化

#### 🔐 セキュリティ
- **WebAuthn/生体認証**: パスワードレス認証
- **ゼロトラストアーキテクチャ**: 動的信頼スコアリング
- **AI異常検知**: リアルタイム脅威対策
- **DRM保護**: コンテンツの著作権保護
- **プライバシー分析**: GDPR/CCPA準拠

#### 🎨 UI/UX
- **3D動画ギャラリー**: Three.jsによる没入体験
- **ジェスチャーコントロール**: ハンドトラッキング操作
- **音声コマンド**: ハンズフリー操作
- **AR美容シミュレーション**: バーチャルメイクアップ
- **適応型UI**: 使用パターン学習

#### 📱 PWA機能
- **オフライン対応**: ネットワークなしでも学習継続
- **プッシュ通知**: 新着コンテンツ即座通知
- **ホーム画面追加**: ネイティブアプリ体験
- **バックグラウンド同期**: データ自動同期

## 🛠️ 技術スタック <a name="tech-stack"></a>

### Frontend
- **Next.js 14** - React フレームワーク
- **TypeScript** - 型安全な開発
- **Tailwind CSS** - ユーティリティファーストCSS
- **Three.js** - 3Dグラフィックス
- **Framer Motion** - アニメーション

### Backend
- **Supabase** - BaaS（PostgreSQL, Auth, Realtime）
- **Edge Functions** - サーバーレス処理
- **Square API** - 決済処理
- **YouTube API** - 動画配信

### AI/ML
- **TensorFlow.js** - クライアントサイドAI
- **MediaPipe** - 顔認識・ジェスチャー検出
- **Hugging Face** - NLP処理
- **Brain.js** - ニューラルネットワーク

### インフラ
- **Vercel** - ホスティング・CDN
- **GitHub Actions** - CI/CD
- **Cloudflare** - セキュリティ・最適化

## 🚀 クイックスタート <a name="getting-started"></a>

### 前提条件
- Node.js 18+
- npm/yarn
- Supabaseアカウント
- Squareアカウント（決済用）

### インストール

```bash
# リポジトリのクローン
git clone https://github.com/your-org/fleeks-ai-platform
cd fleeks-ai-platform

# 依存関係のインストール
npm install

# 環境変数の設定
cp src/.env.example .env.local
# .env.localを編集

# データベースのセットアップ
npm run supabase:migrate

# 開発サーバーの起動
npm run dev
```

### 環境変数の設定

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Square
SQUARE_ACCESS_TOKEN=your_square_token
SQUARE_LOCATION_ID=your_location_id

# AI APIs
HUGGINGFACE_API_KEY=your_hf_key
```

## 📸 スクリーンショット <a name="demo"></a>

<div align="center">
  <img src="docs/images/3d-gallery.png" alt="3D Gallery" width="45%"/>
  <img src="docs/images/ar-beauty.png" alt="AR Beauty" width="45%"/>
</div>

<div align="center">
  <img src="docs/images/ai-dashboard.png" alt="AI Dashboard" width="45%"/>
  <img src="docs/images/community.png" alt="Community" width="45%"/>
</div>

## 📊 パフォーマンス

- **初回読み込み**: < 2.5秒（LCP）
- **対話可能時間**: < 4秒（TTI）
- **AIレスポンス**: < 200ms
- **オフライン対応**: 100%
- **アクセシビリティ**: WCAG 2.1 AA準拠

## 🔒 セキュリティ

- エンドツーエンド暗号化
- 定期的なセキュリティ監査
- バグバウンティプログラム
- SOC2準拠（予定）

## 🤝 貢献

プロジェクトへの貢献を歓迎します！

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 ライセンス

MIT License - 詳細は[LICENSE](LICENSE)を参照してください。

## 📞 お問い合わせ

- Website: [https://fleeks.beauty](https://fleeks.beauty)
- Email: support@fleeks.beauty
- Twitter: [@fleeks_beauty](https://twitter.com/fleeks_beauty)

---

<div align="center">
  Made with ❤️ by Fleeks Team
</div>