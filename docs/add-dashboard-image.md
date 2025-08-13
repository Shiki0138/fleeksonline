# ダッシュボード画像の更新手順

## 概要
トップページの「ログイン後のダッシュボード画面」セクションに表示される画像を更新する手順です。

## 手順

1. **画像の準備**
   - 提供された画像を `dashboard-preview.png` という名前で保存します
   - 推奨サイズ: 1600x900px（16:9のアスペクト比）
   - 形式: PNG または JPG

2. **画像の配置**
   - 画像を以下のパスに配置してください:
     ```
     /public/images/dashboard-preview.png
     ```

3. **既存のコード**
   - `src/app/page.tsx` の122-134行目で画像が参照されています:
   ```jsx
   <Image
     src="/images/dashboard-preview.png"
     alt="FLEEKSダッシュボード - 動画コンテンツとブログ記事の管理画面"
     width={1600}
     height={900}
     className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
     priority
   />
   ```

4. **画像の最適化（オプション）**
   - Next.jsは自動的に画像を最適化しますが、事前に最適化することも可能です
   - 画像圧縮ツールを使用してファイルサイズを削減できます

## 確認方法

1. 開発サーバーを起動:
   ```bash
   npm run dev
   ```

2. ブラウザで `http://localhost:3000` にアクセス

3. 「ログイン後のダッシュボード画面」セクションで新しい画像が表示されることを確認

## 注意事項

- 画像ファイル名は `dashboard-preview.png` にしてください
- 別の名前を使用する場合は、`src/app/page.tsx` の126行目のパスも更新してください
- 画像が大きすぎる場合は、パフォーマンスに影響する可能性があります