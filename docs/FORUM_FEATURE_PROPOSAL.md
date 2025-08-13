# フォーラム機能実装提案書

## 概要
有料会員向けのフォーラム機能を実装し、美容師同士の知識共有とコミュニティ形成を促進します。

## 主な機能

### 1. ユーザープロフィール拡張
- **ニックネーム機能**
  - 既存ユーザー: デフォルトで「美容師#[ユーザーID下4桁]」を自動設定
  - 新規ユーザー: 登録時にニックネーム入力（任意）
  - プロフィール設定からいつでも変更可能
  - 重複チェック機能
- **プロフィール項目**
  - アバター画像（デフォルトアイコン提供）
  - 自己紹介文（200文字まで）
  - 専門分野タグ（カット、カラー、パーマ、経営など）
  - 経験年数
  - 地域（都道府県のみ、任意）

### 2. フォーラム構造
```
フォーラムトップ
├── カテゴリー
│   ├── 接客・サービス
│   ├── 経営・マーケティング
│   ├── 技術相談
│   ├── 商品・薬剤
│   ├── キャリア・転職
│   └── その他・雑談
├── 人気の質問
├── 未回答の質問
└── マイ質問・回答
```

### 3. 質問投稿機能
- **質問フォーム**
  - タイトル（必須、50文字まで）
  - 本文（必須、2000文字まで、Markdown対応）
  - カテゴリー選択（必須）
  - タグ付け（最大5個）
  - 画像添付（最大3枚、各5MBまで）
- **匿名投稿オプション**
  - 「匿名で投稿」チェックボックス
  - 匿名の場合は「匿名の美容師」と表示

### 4. 回答・コメント機能
- **回答投稿**
  - 本文（2000文字まで、Markdown対応）
  - 画像添付（最大3枚）
  - ベストアンサー機能（質問者が選択）
- **コメント機能**
  - 回答に対する補足コメント（500文字まで）
  - スレッド形式で表示

### 5. 通知システム
- **通知タイプ**
  - 自分の質問に回答があった時
  - 自分の回答がベストアンサーに選ばれた時
  - 自分の回答にコメントがついた時
  - フォローしている質問に新しい回答があった時
- **通知方法**
  - アプリ内通知（ベルアイコンにバッジ表示）
  - メール通知（設定でON/OFF可能）
  - プッシュ通知（PWA実装後）

### 6. 検索・フィルター機能
- **検索オプション**
  - キーワード検索（タイトル・本文）
  - カテゴリーフィルター
  - タグフィルター
  - 期間フィルター
  - ステータス（解決済み/未解決）
- **並び替え**
  - 新着順
  - 人気順（閲覧数）
  - 回答数順
  - ベストアンサー率順

### 7. ポイント・評価システム
- **ポイント獲得**
  - 質問投稿: 10pt
  - 回答投稿: 20pt
  - ベストアンサー獲得: 50pt
  - いいね獲得: 5pt
- **ランキング表示**
  - 月間貢献者ランキング
  - 累計ポイントランキング
  - バッジシステム（初心者、中級者、上級者、マスター）

### 8. モデレーション機能
- **自動フィルタリング**
  - NGワード検出
  - スパム検出
- **通報機能**
  - 不適切なコンテンツの通報
  - 管理者による確認・対応
- **ペナルティシステム**
  - 警告 → 一時停止 → アカウント停止

## 技術実装

### データベース設計
```sql
-- ユーザープロフィール拡張
ALTER TABLE fleeks_profiles ADD COLUMN
  nickname VARCHAR(50) UNIQUE,
  bio TEXT,
  avatar_url TEXT,
  experience_years INTEGER,
  prefecture VARCHAR(20),
  specialty_tags TEXT[];

-- フォーラムカテゴリー
CREATE TABLE forum_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  display_order INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 質問
CREATE TABLE forum_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  category_id UUID REFERENCES forum_categories(id),
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[],
  is_anonymous BOOLEAN DEFAULT FALSE,
  is_resolved BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 回答
CREATE TABLE forum_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID REFERENCES forum_questions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  is_best_answer BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 通知
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### API エンドポイント
```
POST   /api/forum/questions          # 質問投稿
GET    /api/forum/questions          # 質問一覧取得
GET    /api/forum/questions/:id      # 質問詳細取得
PUT    /api/forum/questions/:id      # 質問編集
DELETE /api/forum/questions/:id      # 質問削除

POST   /api/forum/answers            # 回答投稿
PUT    /api/forum/answers/:id        # 回答編集
DELETE /api/forum/answers/:id        # 回答削除
POST   /api/forum/answers/:id/best   # ベストアンサー選択

GET    /api/notifications            # 通知一覧取得
PUT    /api/notifications/:id/read   # 既読にする
```

### リアルタイム通知実装
- Supabase Realtime を使用
- 新規回答投稿時にリアルタイムで通知
- オンラインユーザーの表示

## 実装スケジュール

### Phase 1（2週間）
- データベース設計・構築
- ユーザープロフィール拡張
- 基本的な質問・回答機能

### Phase 2（2週間）
- 通知システム
- 検索・フィルター機能
- UIデザイン実装

### Phase 3（1週間）
- ポイントシステム
- モデレーション機能
- テスト・デバッグ

## セキュリティ考慮事項
- XSS対策（入力値のサニタイズ）
- SQLインジェクション対策（プリペアドステートメント使用）
- レート制限（1ユーザー1分間に5投稿まで）
- 画像アップロードのウイルススキャン

## 成功指標
- 月間アクティブユーザー数
- 質問投稿数
- 回答率（回答がついた質問の割合）
- ベストアンサー選択率
- 平均回答時間