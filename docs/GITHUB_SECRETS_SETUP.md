# 🔐 GitHub Secrets 設定ガイド

## 🚨 重要: 機密情報の保護

`.env.local` ファイルには機密情報が含まれているため、**GitHubにはプッシュしません**。
代わりに、GitHub SecretsとVercel環境変数を使用します。

## 📋 設定手順

### 1. GitHub Secrets に登録する値

1. **GitHubリポジトリにアクセス**
   ```
   https://github.com/Shiki0138/fleeksonline
   ```

2. **Settings → Secrets and variables → Actions**

3. **New repository secret** をクリックして以下を追加:

#### 必須のSecrets:

| Name | Value |
|------|-------|
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtidmFla3lwa3N6dnpyd2xia3VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwMDQ5NzksImV4cCI6MjA2NDU4MDk3OX0.5vSllsb13X_iFdEA4MqzDB64bYn90INWhb-0V8_-ia0` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtidmFla3lwa3N6dnpyd2xia3VnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTAwNDk3OSwiZXhwIjoyMDY0NTgwOTc5fQ.Tcidqsnp3OcjWJlF2OmC_JD0b3D7spk_5G4VqCf3OPk` |
| `OPENAI_API_KEY` | `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` |
| `JWT_SECRET` | `y5LqsTUARY9lkFM4KvFexK2h+BTVrdEq2OlGp0O8EsEkOLA2yLZfo5mVms/y7TDH7cIL7u5uZ8WuMSCgW5Ta0Q==` |
| `ENCRYPTION_KEY` | `8973124742b882ec8bf42ed46ae95b31da9db91f035895f575c1ca4ccc9030ef` |
| `BIOMETRIC_ENCRYPTION_KEY` | `26be0e146c3b04092f3ebeb546f17a0ed36f9cd3520660b272419bec215430d3` |
| `YOUTUBE_API_KEY` | `AIzaSyBTGkMwnlPH_OO_wF4G3i-T0GJayMAR_a8` |
| `SMTP_USER` | `leadfive.138@gmail.com` |
| `SMTP_PASS` | `Lkyosai51` |

### 2. Vercel 環境変数設定

1. **Vercel Dashboard にアクセス**
   ```
   https://vercel.com/dashboard/project/prj_aYJGlhNBZwbVppg5yD0DIjKUV2L3
   ```

2. **Settings → Environment Variables**

3. **すべての環境変数を追加**（上記と同じ値）

### 3. 公開可能な環境変数

以下は公開しても問題ない値です（.env.exampleに含まれています）:

```env
NEXT_PUBLIC_SUPABASE_URL=https://kbvaekypkszvzrwlbkug.supabase.co
WEBAUTHN_RP_NAME=Fleeks Beauty Platform
WEBAUTHN_RP_ID=localhost
WEBAUTHN_ORIGIN=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Fleeks Beauty Platform
NEXT_PUBLIC_APP_URL=http://localhost:3000
MONTHLY_PRICE=7980
CURRENCY=JPY
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
REDIS_URL=redis://localhost:6379
```

## 🔄 GitHub Actions での使用

GitHub Actionsで環境変数を使用する場合:

```yaml
env:
  SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
  SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
  # ... 他のsecrets
```

## 🛡️ セキュリティベストプラクティス

1. **定期的にAPIキーをローテーション**
   - 特にOpenAI APIキーは定期的に更新

2. **アクセス権限の最小化**
   - 必要最小限の権限のみ付与

3. **監査ログの確認**
   - GitHub Settings → Audit log で不正アクセスをチェック

4. **2要素認証の有効化**
   - GitHubアカウントで2FAを必須に

## 📝 チェックリスト

- [ ] .env.local から機密情報を削除
- [ ] GitHub Secrets に全ての機密情報を登録
- [ ] Vercel に環境変数を設定
- [ ] .gitignore に .env.local が含まれていることを確認
- [ ] コミット前に機密情報が含まれていないことを確認

## ⚠️ 注意事項

- **絶対に機密情報をコミットしない**
- もし誤ってコミットした場合は、即座にAPIキーを再生成
- GitHub の履歴から完全に削除する必要がある