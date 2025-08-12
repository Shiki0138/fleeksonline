# 🔧 Node.js インストール問題解決ガイド

## 🚨 現在の問題
- `node_modules/`内のロックされたディレクトリが削除できない
- npm installが`ENOTEMPTY`エラーで失敗

## 💡 解決方法（優先度順）

### 方法1: ターミナルで手動実行（推奨）
```bash
# Finderでnode_modulesを完全削除
open .
# Finderでnode_modulesフォルダを手動でゴミ箱に移動

# または完全停止後に削除
sudo lsof +D node_modules/  # プロセス確認
sudo killall node           # Node.jsプロセス停止
rm -rf node_modules/
rm -f package-lock.json

# 新規インストール
npm install
```

### 方法2: Yarnを使用
```bash
# Yarnインストール（グローバル）
npm install -g yarn

# Yarnでインストール
yarn install
yarn dev
```

### 方法3: 異なる場所で再作成
```bash
cd ../
cp -r 031_Fleeks 031_Fleeks_clean
cd 031_Fleeks_clean
rm -rf node_modules package-lock.json
npm install
npm run dev
```

## ⚡ クイック回避策
```bash
# 現在のプロジェクトで直接実行
npx next dev
```

## 🎯 確認事項
1. **重要**: src/ディレクトリは完全保護済み
2. **バックアップ**: ../fleeks_backup_20250811_003659/ に保存済み  
3. **段階1完了**: ドキュメント整理済み（問題なし）

## 📋 次のステップ
1. 上記いずれかの方法でnpm install完了
2. `npm run dev`でローカル動作確認
3. 問題なければ**段階2**へ進行（バックアップファイル削除）

作成日時: 2025-08-11 00:50