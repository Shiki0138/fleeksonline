# アナリティクス実装ガイド

## 現在のアナリティクス実装状況

### ✅ 実装済み（正確なデータ）
- **総ユーザー数**: `fleeks_profiles`テーブルから実数を取得
- **メンバーシップ分布**: premium/free会員の実数を集計
- **総動画数・総ブログ数**: 各テーブルから実数を取得
- **人気動画TOP5**: view_countでソート
- **総視聴回数**: 全動画のview_count合計

### ⚠️ ダミーデータ（要実装）
- **平均視聴時間**: 固定値425秒
- **ユーザー成長グラフ**: ランダム値

## 正確なアナリティクスのための実装手順

### 1. Supabaseでテーブル作成
`scripts/analytics-tables.sql`を実行して以下を作成：
- `fleeks_daily_user_stats`: 日次統計テーブル
- 視聴数自動更新トリガー
- RPC関数（平均視聴時間、ユーザー成長）

### 2. 視聴時間の追跡
```typescript
// VideoPlayerコンポーネントで実装
const trackWatchTime = async (seconds: number) => {
  await supabase
    .from('fleeks_watch_history')
    .upsert({
      user_id: userId,
      video_id: videoId,
      watched_seconds: seconds,
      last_position: currentPosition,
      last_watched_at: new Date().toISOString()
    })
}
```

### 3. 日次統計の更新
Supabase Edge Functionまたはcronジョブで毎日実行：
```sql
SELECT update_daily_stats();
```

### 4. アナリティクスページの更新
```typescript
// 実際のデータを取得
const { data: avgTime } = await supabase.rpc('get_average_watch_time', { days: 30 })
const { data: userGrowth } = await supabase.rpc('get_user_growth', { days: 30 })
```

## データの信頼性を高める方法

### 1. 視聴完了率の追跡
- 動画の何%まで視聴したか記録
- エンゲージメント分析に活用

### 2. ユニーク視聴者数
- 同一ユーザーの重複カウントを防ぐ
- 実際のリーチを把握

### 3. セッション分析
- 平均セッション時間
- バウンス率
- ページビュー数

### 4. コンバージョン追跡
- 無料→有料会員への転換率
- 動画視聴→会員登録の流れ

## 実装優先順位

1. **高**: 視聴時間追跡（ユーザー体験に直結）
2. **中**: 日次統計（トレンド把握）
3. **低**: 詳細なセッション分析

## セキュリティ考慮事項

- RLSポリシーで管理者のみアクセス可能に
- 個人情報は集計データのみ表示
- 生データへの直接アクセスを制限