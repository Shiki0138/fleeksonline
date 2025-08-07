# 🔄 プロジェクト分離計画

## 現状の問題点

1. **複数のプロジェクトが混在**
   - fleeks-ai-platform（旧バージョン）
   - fleeks-clean（現在の本番）
   - その他のシステムファイル

2. **将来の切り分けが困難**
   - 依存関係が不明確
   - 共有リソースの管理が複雑

## 🎯 推奨される構造

### 1. プロジェクト専用ディレクトリ（fleeks-platform）

```
/031_Fleeks/
├── fleeks-platform/          # メインプロジェクト（独立運用可能）
│   ├── src/                  # ソースコード
│   ├── public/               # 静的ファイル
│   ├── docs/                 # ドキュメント
│   ├── scripts/              # プロジェクト専用スクリプト
│   ├── tests/                # テスト
│   ├── .env.example          # 環境変数テンプレート
│   ├── package.json          # 依存関係
│   ├── next.config.js        # Next.js設定
│   ├── tsconfig.json         # TypeScript設定
│   ├── vercel.json           # Vercel設定
│   └── README.md             # プロジェクト説明
│
├── shared/                   # 共有リソース（オプション）
│   ├── configs/              # 共有設定
│   └── utils/                # 共有ユーティリティ
│
└── legacy/                   # 旧バージョンアーカイブ
    ├── fleeks-ai-platform/
    └── fleeks-clean/
```

### 2. 独立性の確保

- **自己完結型**: fleeks-platformディレクトリのみで動作
- **外部依存なし**: 親ディレクトリのファイルに依存しない
- **環境変数**: プロジェクト内で完結
- **設定ファイル**: すべてプロジェクト内に配置

## 🚀 移行手順

### ステップ1: 新構造の作成
```bash
# 新しいプロジェクトディレクトリ作成
mkdir -p fleeks-platform/{src,public,docs,scripts,tests}

# 必要なファイルをコピー
cp fleeks-clean/package.json fleeks-platform/
cp fleeks-clean/next.config.js fleeks-platform/
cp fleeks-clean/tsconfig.json fleeks-platform/
cp fleeks-clean/vercel.json fleeks-platform/
cp -r fleeks-clean/src/* fleeks-platform/src/
cp -r fleeks-clean/public/* fleeks-platform/public/
```

### ステップ2: 依存関係の整理
```bash
cd fleeks-platform
npm install
```

### ステップ3: 環境設定の独立化
- .env.localをプロジェクト内に作成
- 外部パスへの参照を削除
- 相対パスをプロジェクト内に限定

### ステップ4: Vercelの再設定
- 新しいプロジェクトパスを指定
- ビルド設定を更新

## 🔍 現在の状態確認

fleeks-cleanが実質的な本番環境として動作していますが、以下の改善が必要：

1. **名前の統一**: fleeks-clean → fleeks-platform
2. **不要ファイルの削除**: 旧プロジェクトのアーカイブ化
3. **ドキュメントの整理**: プロジェクト専用docsディレクトリ

## 📋 メリット

1. **独立性**: 他のシステムから完全に分離
2. **移植性**: ディレクトリごと別サーバーに移動可能
3. **保守性**: 明確な境界線で管理が容易
4. **拡張性**: 将来的なマイクロサービス化に対応

## 🎯 次のアクション

1. この構造で進めるか確認
2. 移行作業の実施
3. Vercelプロジェクトの更新

この方針で進めてよろしいでしょうか？