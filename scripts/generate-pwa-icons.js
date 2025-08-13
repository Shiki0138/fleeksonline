// PWAアイコン生成スクリプト
// 実際の実装では sharp や canvas を使用して画像を生成しますが、
// ここではプレースホルダーとしてSVGベースのアイコンを作成します

const fs = require('fs');
const path = require('path');

// アイコンのサイズ設定
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// SVGテンプレート（FLEEKSロゴ）
const createSvgIcon = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#7c3aed" rx="${size * 0.1}"/>
  <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" 
        font-family="Arial, sans-serif" font-size="${size * 0.3}" font-weight="bold" fill="white">
    F
  </text>
</svg>
`;

// アイコンディレクトリを作成
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// 各サイズのアイコンを生成
iconSizes.forEach(size => {
  const svg = createSvgIcon(size);
  const filename = path.join(iconsDir, `icon-${size}x${size}.svg`);
  fs.writeFileSync(filename, svg);
  console.log(`Generated: icon-${size}x${size}.svg`);
});

// 特殊用途のアイコンも生成
// バッジアイコン
const badgeSvg = createSvgIcon(72);
fs.writeFileSync(path.join(iconsDir, 'badge-72x72.svg'), badgeSvg);

// 教育アイコン
const educationSvg = `
<svg width="96" height="96" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
  <rect width="96" height="96" fill="#7c3aed" rx="9.6"/>
  <path d="M48 28L24 40l24 12l20-10v14h4V40L48 28zm-16 23v10c0 5.5 7.2 10 16 10s16-4.5 16-10V51l-16 8-16-8z" fill="white"/>
</svg>
`;
fs.writeFileSync(path.join(iconsDir, 'education-96x96.svg'), educationSvg);

// フォーラムアイコン
const forumSvg = `
<svg width="96" height="96" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
  <rect width="96" height="96" fill="#7c3aed" rx="9.6"/>
  <path d="M32 32h32v24H44l-8 8v-8h-4V32zm8 32h24v-8h4v12H48l-8 8v-8h-8V48h8v16z" fill="white"/>
</svg>
`;
fs.writeFileSync(path.join(iconsDir, 'forum-96x96.svg'), forumSvg);

console.log('All PWA icons generated successfully!');

// 注意: 本番環境では、SVGからPNGへの変換が必要です。
// sharp パッケージを使用して変換することを推奨します。