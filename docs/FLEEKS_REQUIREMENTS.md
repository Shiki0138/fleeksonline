# FLEEKS - YouTube動画限定公開プラットフォーム

## 🎯 システム概要

FLEEKSは、YouTube限定公開動画を会員向けに配信するプラットフォームです。

### 主要機能
1. **YouTube限定公開動画の表示**
   - 管理者がYouTube限定公開URLを登録
   - 動画のサムネイル、タイトル、説明文を表示
   - カテゴリー分けによる整理

2. **会員種別による視聴制限**
   - 有料会員：全動画を無制限に視聴可能
   - 無料会員：各動画を最初の5分間のみ視聴可能
   - 未ログイン：動画一覧のみ閲覧可能（視聴不可）

3. **日本語対応**
   - 全てのUI要素を日本語で表示
   - 日本のユーザーに最適化されたUX

4. **おしゃれなデザイン**
   - モダンで洗練されたUI
   - ダークモード対応
   - レスポンシブデザイン

## 📊 データベース設計

### Users（ユーザー）
- id: string (UUID)
- email: string (unique)
- username: string (unique)
- password: string (hashed)
- membershipType: enum ('FREE', 'PREMIUM')
- membershipExpiry: datetime (null for FREE)
- profileImage: string (URL)
- createdAt: datetime
- updatedAt: datetime

### Videos（動画）
- id: string (UUID)
- youtubeVideoId: string
- title: string
- description: text
- thumbnailUrl: string
- duration: integer (seconds)
- category: string
- tags: string[]
- isPublished: boolean
- publishedAt: datetime
- createdAt: datetime
- updatedAt: datetime

### ViewingHistory（視聴履歴）
- id: string (UUID)
- userId: string (FK)
- videoId: string (FK)
- watchedDuration: integer (seconds)
- lastWatchedAt: datetime
- totalWatchTime: integer (seconds)
- completed: boolean
- createdAt: datetime
- updatedAt: datetime

### Categories（カテゴリー）
- id: string (UUID)
- name: string
- slug: string (unique)
- description: string
- displayOrder: integer
- createdAt: datetime
- updatedAt: datetime

### Subscriptions（サブスクリプション）
- id: string (UUID)
- userId: string (FK)
- planType: enum ('MONTHLY', 'YEARLY')
- amount: decimal
- status: enum ('ACTIVE', 'CANCELLED', 'EXPIRED')
- startDate: datetime
- endDate: datetime
- createdAt: datetime
- updatedAt: datetime

## 🎨 UI/UXデザイン要件

### カラーパレット
- プライマリ: #7C3AED (紫)
- セカンダリ: #EC4899 (ピンク)
- アクセント: #10B981 (緑)
- 背景: #0F172A (ダーク) / #FFFFFF (ライト)
- テキスト: #F8FAFC (ダーク) / #1E293B (ライト)

### フォント
- 見出し: Noto Sans JP (Bold)
- 本文: Noto Sans JP (Regular)
- 英数字: Inter

### レイアウト
- グリッドベースのカード表示
- 動画サムネイルホバーでプレビュー
- スムーズなアニメーション
- グラデーション効果の活用

## 🔧 技術要件

### フロントエンド
- React 18 + TypeScript
- Tailwind CSS (カスタムデザインシステム)
- YouTube Player API
- Framer Motion (アニメーション)
- React Query (データフェッチング)
- Zustand (状態管理)

### バックエンド
- Node.js + TypeScript
- Fastify (高速Webフレームワーク)
- Prisma (ORM)
- PostgreSQL
- JWT認証
- Redis (セッション管理)

### 特殊機能
- YouTube Player APIによる再生制御
- 5分タイマー機能（無料会員）
- 動画進捗の自動保存
- リアルタイム視聴状態の同期

## 🚀 実装優先順位

1. **Phase 1: 基本機能**
   - ユーザー認証（ログイン/登録）
   - 動画一覧表示
   - YouTube Player統合
   - 会員種別管理

2. **Phase 2: 視聴制限**
   - 5分制限機能
   - 視聴履歴保存
   - 続きから再生

3. **Phase 3: UI/UX向上**
   - アニメーション追加
   - ダークモード
   - レスポンシブ最適化

4. **Phase 4: 追加機能**
   - お気に入り機能
   - 検索・フィルター
   - 視聴統計