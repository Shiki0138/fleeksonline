# Vercelドメイン設定の修正方法

## 現在の問題

Vercelのドメイン設定が原因でリダイレクトループが発生しています：

- **現在の設定**: `https://app.fleeks.jp`
- **実際のVercel URL**: `https://fleeksonline.vercel.app`

## 修正方法

### オプション1: カスタムドメインを使用する場合

1. **DNSレコードの設定**
   - `app.fleeks.jp`のCNAMEレコードを`cname.vercel-dns.com`に向ける
   - または、AレコードをVercelのIPアドレスに設定

2. **Vercelダッシュボードで確認**
   - ドメインの検証が完了していることを確認
   - SSL証明書が発行されていることを確認

3. **環境変数の更新**
   ```
   NEXTAUTH_URL=https://app.fleeks.jp
   NEXT_PUBLIC_APP_URL=https://app.fleeks.jp
   ```

### オプション2: Vercelのデフォルトドメインを使用する場合

1. **Vercelのドメイン設定を削除**
   - カスタムドメイン`app.fleeks.jp`を一時的に削除

2. **環境変数の更新**
   ```
   NEXTAUTH_URL=https://fleeksonline.vercel.app
   NEXT_PUBLIC_APP_URL=https://fleeksonline.vercel.app
   ```

3. **Supabaseの設定も更新**
   - Site URL: `https://fleeksonline.vercel.app`
   - Redirect URLs に追加

## 推奨される対応

現時点では、**オプション2**（Vercelのデフォルトドメインを使用）を推奨します：

1. まずVercelのデフォルトドメインで動作確認
2. 動作が確認できたら、カスタムドメインの設定を行う

これにより、段階的に問題を解決できます。