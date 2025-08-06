# 🌐 カスタムドメイン設定完全ガイド

## 現在の状況
- ✅ Vercelデプロイ成功
- ✅ 仮URLで稼働中: https://fleeksonline-qy7b5f0bt-shikis-projects-6e27447a.vercel.app
- 🔄 カスタムドメイン設定待ち: app.fleeks.jp

## 📋 設定手順

### ステップ1: Vercelでドメイン追加

1. **Vercelダッシュボードにアクセス**
   ```
   https://vercel.com/dashboard
   ```

2. **プロジェクト選択**
   - 「fleeksonline」プロジェクトをクリック

3. **ドメイン設定画面へ**
   - 上部メニューから「Settings」をクリック
   - 左サイドバーから「Domains」を選択

4. **ドメイン追加**
   - 「Add」ボタンをクリック
   - 入力欄に以下を入力:
   ```
   app.fleeks.jp
   ```
   - 「Add」をクリックして追加

### ステップ2: ムームードメインでDNS設定

1. **ムームードメインにログイン**
   ```
   https://muumuu-domain.com/
   ```

2. **DNS設定画面へ**
   - コントロールパネルから「ドメイン操作」
   - 「ムームーDNS」を選択

3. **fleeks.jpドメインの設定**
   - fleeks.jp の「変更」ボタンをクリック

4. **CNAMEレコード追加**
   以下の設定を追加:
   ```
   サブドメイン: app
   種別: CNAME
   内容: cname.vercel-dns.com
   優先度: （空欄のまま）
   ```

5. **設定を保存**
   - 「セットアップ情報変更」をクリック
   - 確認画面で「OK」

### ステップ3: SSL証明書の確認

1. **Vercelダッシュボードで確認**
   - Settings → Domains
   - app.fleeks.jp の横に緑のチェックマークが表示されるまで待つ
   - 通常10-30分程度

2. **ステータス確認**
   - 🔄 Processing: DNS設定反映中
   - ✅ Valid Configuration: 設定完了

## 🚨 トラブルシューティング

### DNSが反映されない場合

1. **DNSキャッシュクリア**
   ```bash
   # Mac
   sudo dscacheutil -flushcache
   
   # Windows
   ipconfig /flushdns
   ```

2. **DNS伝播確認**
   - https://dnschecker.org/ でapp.fleeks.jpを確認
   - CNAMEがcname.vercel-dns.comを指しているか確認

3. **ムームーDNS設定確認**
   - 設定が正しく保存されているか再確認
   - 必要に応じて再設定

### Vercelでエラーが出る場合

1. **Invalid Configuration**
   - DNS設定が正しくない
   - CNAMEレコードを再確認

2. **Conflicting Configuration**
   - 既存のDNSレコードと競合
   - app.fleeks.jpに既存の設定がないか確認

## 📊 設定完了後の確認

1. **アクセステスト**
   ```
   https://app.fleeks.jp
   ```

2. **SSL証明書確認**
   - ブラウザのアドレスバーに鍵マークが表示されるか
   - 証明書の詳細でVercelの証明書か確認

3. **リダイレクト確認**
   - HTTPからHTTPSへの自動リダイレクト
   - wwwありなしの統一

## 🎯 最終確認チェックリスト

- [ ] Vercelにドメイン追加完了
- [ ] ムームーDNSにCNAMEレコード追加
- [ ] DNS伝播確認（最大48時間）
- [ ] SSL証明書発行確認
- [ ] https://app.fleeks.jp でアクセス可能
- [ ] 環境変数設定（Supabase関連）

## 📝 次のステップ

1. **環境変数設定**
   - Vercel Settings → Environment Variables
   - 本番用のSupabase認証情報を設定

2. **機能実装**
   - 認証機能の有効化
   - データベース接続
   - 決済機能の実装

3. **モニタリング設定**
   - Vercel Analytics有効化
   - エラー監視設定

## 💡 Tips

- DNS反映は通常数分〜数時間
- 最大48時間かかる場合もあるので焦らない
- SSL証明書は自動発行・自動更新
- サブドメインなので既存のfleeks.jpには影響なし

設定完了後、https://app.fleeks.jp でFLEEKSプラットフォームが利用可能になります！