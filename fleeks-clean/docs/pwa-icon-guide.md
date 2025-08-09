# PWAアイコン作成ガイド

## 1. デザインツールで作成する場合

### Adobe Illustrator/Photoshop
1. 512x512pxの正方形キャンバスを作成
2. ロゴデザイン（背景色：#000000、アクセント色：#4f46e5）
3. 各サイズにエクスポート

### Canva（無料ツール）
1. カスタムサイズ 512x512pxを選択
2. 背景を黒(#000000)に設定
3. "F"の文字または"FLEEKS"ロゴを配置
4. PNG形式でダウンロード

### Figma（無料ツール）
1. 512x512のフレームを作成
2. デザインを作成
3. 各サイズにエクスポート

## 2. オンラインツールで一括生成

### おすすめツール
1. **Real Favicon Generator** (https://realfavicongenerator.net/)
   - 512x512pxの画像をアップロード
   - 全サイズを自動生成
   - PWA設定も同時に生成

2. **PWA Asset Generator** (https://pwa-asset-generator.com/)
   - ロゴをアップロード
   - 背景色を指定
   - 全アイコンとスプラッシュ画面を生成

## 3. コマンドラインツール

```bash
# ImageMagickを使用した場合
brew install imagemagick

# 512x512の元画像から各サイズを生成
convert icon-512x512.png -resize 72x72 icon-72x72.png
convert icon-512x512.png -resize 96x96 icon-96x96.png
convert icon-512x512.png -resize 128x128 icon-128x128.png
convert icon-512x512.png -resize 144x144 icon-144x144.png
convert icon-512x512.png -resize 152x152 icon-152x152.png
convert icon-512x512.png -resize 192x192 icon-192x192.png
convert icon-512x512.png -resize 384x384 icon-384x384.png
```

## 4. アイコンの配置

生成したPNGファイルを以下の場所に配置：
```
/public/
  ├── icon-72x72.png
  ├── icon-96x96.png
  ├── icon-128x128.png
  ├── icon-144x144.png
  ├── icon-152x152.png
  ├── icon-192x192.png
  ├── icon-384x384.png
  └── icon-512x512.png
```

## 5. manifest.jsonの更新

`public/manifest.json`のアイコン設定を`.svg`から`.png`に変更：
```json
"icons": [
  {
    "src": "/icon-72x72.png",
    "sizes": "72x72",
    "type": "image/png"
  },
  // ... 他のサイズも同様に変更
]
```

## デザイン推奨事項

1. **シンプルなデザイン**：小さいサイズでも認識可能
2. **適切なパディング**：アイコンの周囲に10-15%の余白
3. **高コントラスト**：背景と前景の明確な区別
4. **ブランドカラー**：黒背景に紫/青のアクセント