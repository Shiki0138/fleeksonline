# 📹 YouTube動画追加ガイド

## 🎯 動画を追加する2つの方法

### 方法1: 管理画面から追加（推奨）✨

1. **アプリにアクセス**
   ```
   http://localhost:3001/admin/videos
   ```
   または本番環境:
   ```
   https://your-app.vercel.app/admin/videos
   ```

2. **Googleアカウントでログイン**
   - 管理者メール: leadfive.138@gmail.com

3. **動画情報を入力**
   - タイトル: 動画のタイトル
   - 説明: 動画の詳細説明
   - YouTube URL: 限定公開動画のURL
   - カテゴリー: 適切なカテゴリーを選択
   - タグ: カンマ区切りで入力
   - プレビュー時間: 無料会員が視聴できる秒数（デフォルト300秒）
   - 有料会員限定: チェックボックス

4. **「動画を追加」をクリック**

### 方法2: Supabaseで直接追加

1. **Supabase Dashboard にアクセス**
   ```
   https://app.supabase.com/project/kbvaekypkszvzrwlbkug/editor
   ```

2. **Table Editor → beauty_videos**

3. **「Insert」ボタンをクリック**

4. **必須フィールドを入力**
   ```json
   {
     "title": "動画タイトル",
     "description": "動画の説明",
     "youtube_id": "xxxxxxxxxxx",  // URLの最後の11文字
     "category": "マーケティング",
     "tags": ["SNS", "集客"],
     "is_premium": true,
     "preview_seconds": 300,
     "thumbnail_url": "https://i.ytimg.com/vi/xxxxxxxxxxx/maxresdefault.jpg"
   }
   ```

## 🔒 YouTube設定の重要ポイント

### 限定公開設定の手順

1. **YouTube Studio にアクセス**
   - https://studio.youtube.com

2. **動画をアップロード**

3. **公開設定で「限定公開」を選択**
   - 「限定公開」= URLを知っている人だけが視聴可能
   - 「非公開」は使わない（共有できなくなる）

4. **埋め込み設定を確認**
   - 「埋め込みを許可」にチェック

### 動画URLの形式

以下のどの形式でもOK:
- `https://www.youtube.com/watch?v=xxxxxxxxxxx`
- `https://youtu.be/xxxxxxxxxxx`
- `xxxxxxxxxxx`（IDのみ）

### サムネイル画像

自動的に以下のURLで取得されます:
```
https://i.ytimg.com/vi/{動画ID}/maxresdefault.jpg
```

## 🎬 動画の表示制御

### 無料会員
- **preview_seconds** で指定した秒数まで視聴可能
- デフォルト: 300秒（5分）
- 続きを見るには有料会員登録が必要

### 有料会員
- フル動画視聴可能
- 全ての限定公開動画にアクセス可能

### 完全無料動画
- `is_premium: false` に設定
- 誰でもフル視聴可能

## 🚨 注意事項

1. **著作権**
   - アップロードする動画の著作権を確認
   - 第三者の音楽使用時は権利処理必須

2. **セキュリティ**
   - 限定公開URLは外部に漏らさない
   - 管理画面へのアクセスは管理者のみ

3. **パフォーマンス**
   - 動画は長すぎない方が良い（推奨: 10-30分）
   - 高画質すぎるとロード時間が長くなる

## 📊 動画管理のベストプラクティス

1. **定期的な更新**
   - 週1-2本のペースで新規動画追加
   - 古い動画の情報更新

2. **カテゴリー整理**
   - 適切なカテゴリー分類
   - タグを活用した検索性向上

3. **分析活用**
   - view_count で人気動画を把握
   - 完了率から動画の質を改善

## 🆘 トラブルシューティング

### 動画が表示されない
- YouTube動画が「限定公開」になっているか確認
- 埋め込みが許可されているか確認
- youtube_id が正しいか確認

### サムネイルが表示されない
- 動画処理が完了するまで待つ（最大1時間）
- 手動でthumbnail_urlを更新

### プレビューが機能しない
- preview_seconds が設定されているか確認
- is_premium がtrueになっているか確認