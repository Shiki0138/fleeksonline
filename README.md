<<<<<<< HEAD
# Fleeks Backend API

A robust, production-ready Node.js backend API built with Express.js, featuring JWT authentication, PostgreSQL database, Redis caching, and comprehensive testing.

## 🚀 Features

- **Express.js** - Fast, unopinionated web framework
- **JWT Authentication** - Secure token-based authentication with refresh tokens
- **PostgreSQL** - Reliable relational database with Knex.js query builder
- **Redis** - High-performance caching and session storage
- **Role-based Access Control** - Admin, moderator, and user roles
- **Request Validation** - Comprehensive input validation with Joi
- **Security** - Built-in security middleware (helmet, CORS, rate limiting)
- **Logging** - Structured logging with Winston
- **Testing** - Unit and integration tests with Jest
- **Error Handling** - Centralized error handling with detailed error responses
- **Code Quality** - ESLint configuration with Airbnb style guide

## 📋 Prerequisites

- Node.js 16.0 or higher
- PostgreSQL 12 or higher
- Redis 6 or higher (optional for development)

## 🛠 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fleeks-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database**
   ```bash
   # Create database
   createdb fleeks_db
   
   # Run migrations
   npm run migrate
   
   # Seed initial data (optional)
   npm run seed
   ```

5. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 🔧 Configuration

### Environment Variables

```env
# Server Configuration
NODE_ENV=development
PORT=3000
HOST=localhost

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fleeks_db
DB_USER=fleeks_user
DB_PASSWORD=fleeks_password

# Redis Configuration (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key
JWT_REFRESH_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🔗 API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/profile` - Get current user profile
- `POST /api/auth/change-password` - Change user password

### User Management

- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (admin only)
- `GET /api/users/search` - Search users (admin only)
- `GET /api/users/stats` - Get user statistics (admin only)

### System

- `GET /health` - Server health check
- `GET /api/health` - Detailed health check
- `GET /api/info` - Server information

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run specific test file
npm test -- auth.test.js
```

## 🏗 Project Structure

```
src/
├── config/           # Configuration files
│   ├── database.js   # Database configuration
│   ├── redis.js      # Redis configuration
│   └── logger.js     # Logging configuration
├── controllers/      # Route controllers
│   ├── AuthController.js
│   └── UserController.js
├── middleware/       # Express middleware
│   ├── auth.js       # Authentication middleware
│   ├── errorHandler.js
│   └── requestLogger.js
├── models/           # Data models
│   └── User.js       # User model
├── routes/           # API routes
│   ├── auth.js       # Authentication routes
│   ├── users.js      # User management routes
│   └── api.js        # General API routes
├── services/         # Business logic
│   └── AuthService.js
├── utils/            # Utility functions
│   ├── validation.js # Validation helpers
│   └── helpers.js    # General helpers
└── server.js         # Main server file

migrations/           # Database migrations
seeds/               # Database seeds
tests/               # Test files
├── unit/            # Unit tests
└── integration/     # Integration tests
```

## 🚀 Deployment

### Using Docker

1. **Build the Docker image**
   ```bash
   docker build -t fleeks-backend .
   ```

2. **Run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

### Manual Deployment

1. **Set up production environment**
   ```bash
   NODE_ENV=production
   ```

2. **Install production dependencies**
   ```bash
   npm ci --production
   ```

3. **Run migrations**
   ```bash
   npm run migrate
   ```

4. **Start the server**
   ```bash
   npm start
   ```

## 📊 Performance

- **JWT Token Caching** - Reduces database queries for authentication
- **Connection Pooling** - Efficient database connection management
- **Rate Limiting** - Prevents abuse and ensures fair usage
- **Compression** - Reduces response payload sizes
- **Structured Logging** - Efficient logging with configurable levels

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcrypt with configurable salt rounds
- **Rate Limiting** - Prevents brute force attacks
- **CORS Protection** - Configurable cross-origin request handling
- **Security Headers** - Helmet.js for security headers
- **Input Validation** - Comprehensive request validation
- **SQL Injection Prevention** - Parameterized queries with Knex.js

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the documentation
- Review existing issues
- Create a new issue if needed

## 🔄 Changelog

### v1.0.0
- Initial release
- JWT authentication system
- User management
- PostgreSQL integration
- Redis caching
- Comprehensive testing
- Security middleware
- API documentation
=======
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
>>>>>>> 459783e5ff4a66eaf5c8c10346e7f8e14da0285f
