# 🚀 GitHub Actions セットアップガイド

## 📋 必要なGitHub Secrets

GitHub Actionsを使用するために、以下のSecretsを設定してください：

### 1. アプリケーション用Secrets

| Secret Name | 説明 | 取得方法 |
|------------|------|---------|
| `SUPABASE_ANON_KEY` | Supabase匿名キー | Supabaseダッシュボード → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabaseサービスロールキー | Supabaseダッシュボード → Settings → API |
| `OPENAI_API_KEY` | OpenAI APIキー | OpenAIダッシュボード → API Keys |
| `JWT_SECRET` | JWT署名用シークレット | `openssl rand -base64 64` で生成 |
| `ENCRYPTION_KEY` | 暗号化キー | `openssl rand -hex 32` で生成 |
| `BIOMETRIC_ENCRYPTION_KEY` | 生体認証暗号化キー | `openssl rand -hex 32` で生成 |
| `YOUTUBE_API_KEY` | YouTube Data API v3キー | Google Cloud Console → APIs |
| `SMTP_USER` | SMTPユーザー名 | Gmailアドレス |
| `SMTP_PASS` | SMTPパスワード | Gmailアプリパスワード |

### 2. Vercel用Secrets（オプション）

Vercelへの自動デプロイを使用する場合：

| Secret Name | 説明 | 取得方法 |
|------------|------|---------|
| `VERCEL_TOKEN` | Vercelアクセストークン | Vercel → Settings → Tokens |
| `VERCEL_ORG_ID` | Vercel組織ID | Vercel → Team Settings |

## 🔧 設定手順

### ステップ1: GitHub Secretsを追加

1. GitHubリポジトリページへアクセス
2. **Settings** → **Secrets and variables** → **Actions**
3. **New repository secret** をクリック
4. 上記の各Secretを追加

### ステップ2: ワークフローの有効化

1. **Actions** タブへアクセス
2. ワークフローが自動的に検出されます
3. 必要に応じて手動で実行

## 📊 ワークフロー概要

### CI/CDパイプライン (`ci.yml`)
- **トリガー**: mainブランチへのpush/PR
- **実行内容**:
  - Lintチェック
  - 型チェック
  - テスト実行
  - ビルド確認
  - セキュリティ監査

### CodeQL分析 (`codeql.yml`)
- **トリガー**: mainブランチへのpush/PR、週次スケジュール
- **実行内容**:
  - JavaScriptセキュリティ分析
  - TypeScriptセキュリティ分析
  - 脆弱性レポート

### 依存関係更新 (`dependabot.yml`)
- **スケジュール**: 毎週月曜日 4:00
- **実行内容**:
  - npm依存関係の自動更新
  - セキュリティパッチの適用

## 🛡️ セキュリティベストプラクティス

1. **最小権限の原則**
   - 各Secretには必要最小限の権限のみ付与

2. **定期的なローテーション**
   - APIキーは3ヶ月ごとに更新
   - 暗号化キーは6ヶ月ごとに更新

3. **監査ログの確認**
   - Actions実行履歴を定期的に確認
   - 不審なアクティビティを監視

4. **ブランチ保護**
   - mainブランチへの直接pushを禁止
   - PRレビューを必須化

## 📝 トラブルシューティング

### ワークフローが失敗する場合

1. **Secrets未設定エラー**
   ```
   Error: Input required and not supplied: SUPABASE_ANON_KEY
   ```
   → 必要なSecretが設定されているか確認

2. **権限エラー**
   ```
   Error: Resource not accessible by integration
   ```
   → リポジトリのActions権限を確認

3. **ビルドエラー**
   ```
   Error: Cannot find module
   ```
   → `npm ci` でクリーンインストール実行

## 🔄 カスタマイズ

### 追加のワークフロー

必要に応じて以下のワークフローを追加できます：

- E2Eテスト
- パフォーマンステスト
- ビジュアルリグレッションテスト
- 本番デプロイ自動化

詳細は[GitHub Actions ドキュメント](https://docs.github.com/actions)を参照してください。