# 🔧 SSL証明書エラーの解決方法

## エラー内容
```
この接続ではプライバシーが保護されません
NET::ERR_CERT_COMMON_NAME_INVALID
```

## 原因
- SSL証明書がまだ発行されていない
- DNS設定が反映されていない
- Vercelのドメイン設定が完了していない

## 解決手順

### 1. Vercelダッシュボードで確認

1. **Vercelダッシュボード** → fleeksonline → Settings → Domains
2. `app.fleeks.jp` のステータスを確認

#### ステータスの意味：
- 🔄 **Invalid Configuration** - DNS設定待ち
- ⏳ **Pending** - SSL証明書発行中
- ✅ **Valid** - 設定完了

### 2. ムームードメインのDNS設定確認

1. ムームードメインにログイン
2. ドメイン操作 → ムームーDNS
3. fleeks.jp の設定を確認

正しい設定：
```
サブドメイン: app
種別: CNAME
内容: cname.vercel-dns.com
優先度: （空欄）
```

### 3. DNS伝播確認

ターミナルで以下を実行：
```bash
# DNSレコード確認
dig CNAME app.fleeks.jp

# または
nslookup app.fleeks.jp
```

期待される結果：
```
app.fleeks.jp. CNAME cname.vercel-dns.com.
```

### 4. 一時的な回避策

DNS反映を待つ間、以下のURLでアクセス可能：
- Vercel仮URL: https://fleeksonline-71gl3gez0-shikis-projects-6e27447a.vercel.app

## 📋 チェックリスト

- [ ] Vercelダッシュボードで `app.fleeks.jp` が追加されている
- [ ] ムームーDNSでCNAMEレコードが設定されている
- [ ] DNS設定から10分以上経過している
- [ ] Vercelのドメインステータスが「Valid」になっている

## ⏱️ 待ち時間の目安

- **DNS反映**: 5分〜48時間（通常は30分以内）
- **SSL証明書発行**: DNS反映後10〜30分

## 🆘 それでも解決しない場合

1. **ムームーDNSの設定を再確認**
   - 設定が保存されているか
   - タイポがないか

2. **Vercelでドメインを削除して再追加**
   - Domains設定から一度削除
   - 再度追加してやり直し

3. **別のブラウザやシークレットモードで確認**
   - キャッシュの影響を排除

## 💡 Tips

- DNS変更は即座に反映されません
- 焦らず少し待ちましょう
- その間は仮URLで開発を続けられます