# 教育コンテンツ表示問題の調査レポート

## 問題の概要
教育コンテンツが表示されない問題について調査を実施しました。

## 調査結果

### 1. データベースのstatus列とpublish_dateの確認

#### テーブル構造（education_contents）
- `status` VARCHAR(20) - 値: 'draft', 'published', 'scheduled'
- `publish_date` TIMESTAMP WITH TIME ZONE
- 表示条件: `status = 'published' AND publish_date <= CURRENT_TIMESTAMP`

#### RLSポリシー
```sql
CREATE POLICY "Published education contents are viewable by everyone" ON education_contents
  FOR SELECT USING (status = 'published' AND publish_date <= CURRENT_TIMESTAMP);
```

### 2. APIエンドポイントの分析（/api/education/articles/route.ts）

#### 現在の実装
```typescript
// データ取得時にフィルタリングなし
const { data: contents, error } = await supabase
  .from('education_contents')
  .select(`...`)
  .order('article_number', { ascending: true })

// クライアント側でフィルタリング
const isPublished = content.status === 'published' && publishDate <= now
```

**問題点**: APIレベルでフィルタリングしていないため、RLSポリシーが適用されると、未公開の記事も取得しようとしてエラーになる可能性があります。

### 3. フロントエンドの表示条件（EducationContentList.tsx）

#### 現在の実装
- APIから記事リストを取得
- 記事が0件の場合、サンプルデータを表示
- 各記事の`isPublished`フラグで表示制御

### 4. 個別記事ページ（/education/[slug]/page.tsx）

#### 現在の実装
```typescript
// 公開チェック
if (content.status !== 'published' || publishDate > now) {
  notFound()
}
```

## 問題の原因

1. **データベースにデータが存在しない可能性**
   - JSONファイルは存在するが、データベースには挿入されていない
   - `generate-articles.log`を見ると記事生成は成功している

2. **RLSポリシーによる制限**
   - 公開日時が未来の記事や、statusがpublishedでない記事は取得できない
   - APIがRLSを考慮していない

3. **publish_dateの値の問題**
   - JSONファイルでは`postedAt`として保存されている
   - データベース挿入時の日付変換に問題がある可能性

## 推奨される対処法

### 1. データ確認用SQLクエリの実行
作成した`/docs/sql/check-education-status.sql`を実行して、データベースの状態を確認してください。

### 2. データ挿入スクリプトの実行
作成した`/scripts/insert-education-data.js`を使用して、JSONファイルからデータベースにデータを挿入してください。

```bash
# 環境変数を設定してスクリプトを実行
SUPABASE_SERVICE_KEY=your-service-key node scripts/insert-education-data.js
```

### 3. APIエンドポイントの修正
RLSを考慮してAPIでもフィルタリングを追加することを推奨します：

```typescript
const { data: contents, error } = await supabase
  .from('education_contents')
  .select(`...`)
  .eq('status', 'published')
  .lte('publish_date', new Date().toISOString())
  .order('article_number', { ascending: true })
```

### 4. デバッグ用のログ追加
APIエンドポイントに以下のようなログを追加して問題を特定：

```typescript
console.log('Fetching education contents...')
console.log('Total contents fetched:', contents?.length || 0)
console.log('Published contents:', contents?.filter(c => 
  c.status === 'published' && new Date(c.publish_date) <= new Date()
).length || 0)
```

## 次のステップ

1. SQLクエリでデータベースの状態を確認
2. データが存在しない場合は、挿入スクリプトを実行
3. APIエンドポイントにデバッグログを追加して問題を特定
4. 必要に応じてAPIのフィルタリング条件を修正