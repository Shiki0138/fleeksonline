# 動画クリック問題のデバッグ手順

## ブラウザでの確認手順

1. **Chrome DevToolsを開く**
   - 右クリック → 「検証」または F12キー

2. **Consoleタブでエラーを確認**
   - 赤いエラーメッセージがないか確認
   - 特に以下のようなエラーに注目:
     - `Cannot read property 'id' of undefined`
     - `Router.push is not a function`
     - `Hydration error`

3. **Networkタブで通信を確認**
   - 動画をクリックした時に新しいリクエストが発生するか
   - `/videos/[id]`へのナビゲーションが試みられているか

4. **Elementsタブで構造を確認**
   - 動画カードのHTML構造を確認
   - `onClick`イベントが正しく設定されているか
   - `cursor-pointer`クラスが適用されているか

## デバッグ用コードの追加

ダッシュボードページに以下のデバッグコードを追加してください:

```javascript
// Video Info セクションのonClickを修正
<div 
  className="p-4 cursor-pointer"
  onClick={(e) => {
    e.stopPropagation();
    console.log('[Dashboard] Video clicked:', video.id, video.title);
    console.log('[Dashboard] Navigating to:', `/videos/${video.id}`);
    router.push(`/videos/${video.id}`);
  }}
>
```

## データベースの確認

Supabaseダッシュボードで以下を確認:

1. **fleeks_videosテーブル**
   - `id`フィールドが存在し、値が入っているか
   - `title`, `description`などの必須フィールドに値があるか

2. **Row Level Security (RLS)**
   - fleeks_videosテーブルのRLSが有効か
   - SELECT権限が適切に設定されているか

## よくある原因

1. **イベントバブリング**
   - 親要素でもクリックイベントが発生している
   - 解決: `e.stopPropagation()`を追加

2. **動画IDが取得できない**
   - video.idがundefinedまたはnull
   - 解決: データベースの値を確認

3. **ルーターが機能していない**
   - Next.jsのルーターが正しくインポートされていない
   - 解決: `useRouter`のインポートを確認

4. **ハイドレーションエラー**
   - サーバーとクライアントでHTMLが一致しない
   - 解決: `useEffect`内で動的な処理を行う