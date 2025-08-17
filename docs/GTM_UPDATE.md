# Google Tag Manager更新記録

## 更新日時: 2025-08-17

### 変更内容
- GTMコンテナIDを `GTM-KBLG5XDM` から `GTM-TNVX6KCS` に変更
- サブドメイン用の適切なコンテナIDを使用

### 変更ファイル
- `/fleeks-ai-platform/src/components/GoogleTagManager.tsx`
  - GTM_ID定数を更新

### 実装詳細
```tsx
const GTM_ID = 'GTM-TNVX6KCS'
```

### 確認事項
- GoogleTagManager.tsxコンポーネントでGTM-TNVX6KCSを使用
- layout.tsxでGoogleTagManagerコンポーネントを正しく呼び出し
- サブドメインでも問題なく動作することを確認

### 注意事項
- fleeks-ai-platformディレクトリは独自のgitリポジトリを持っているため、そちらから直接コミットが必要な場合があります