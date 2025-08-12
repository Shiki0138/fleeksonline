const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔍 セキュリティチェックを実行中...\n');

// 危険なパターン
const dangerousPatterns = [
  /AIza[0-9A-Za-z\-_]{35}/g, // Google API Key
  /sk-[a-zA-Z0-9]{48}/g, // OpenAI API Key
  /ghp_[a-zA-Z0-9]{36}/g, // GitHub Personal Access Token
  /ghs_[a-zA-Z0-9]{36}/g, // GitHub Secret
  /eyJ[a-zA-Z0-9\-_]+\.eyJ[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+/g, // JWT Token
];

// チェックする拡張子
const extensions = ['js', 'ts', 'tsx', 'json', 'md', 'env', 'yml', 'yaml'];

// 除外するディレクトリ
const excludeDirs = ['node_modules', '.git', '.next', 'build', 'dist'];

let issuesFound = 0;

// ファイルをスキャン
function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath);
  
  // .envファイルのチェック
  if (fileName.startsWith('.env') && fileName !== '.env.example') {
    console.log(`⚠️  環境変数ファイルが見つかりました: ${filePath}`);
    console.log('   → このファイルはGitにコミットしないでください\n');
    issuesFound++;
  }
  
  // 危険なパターンのチェック
  dangerousPatterns.forEach((pattern, index) => {
    const matches = content.match(pattern);
    if (matches) {
      const patternNames = [
        'Google API Key',
        'OpenAI API Key',
        'GitHub Personal Access Token',
        'GitHub Secret',
        'JWT Token'
      ];
      
      console.log(`🚨 ${patternNames[index]}が見つかりました: ${filePath}`);
      console.log(`   → マッチした値: ${matches[0].substring(0, 20)}...`);
      console.log('   → このキーを環境変数に移動してください\n');
      issuesFound++;
    }
  });
  
  // ハードコーディングされた可能性のある値
  const suspiciousPatterns = [
    { pattern: /GEMINI_API_KEY\s*[:=]\s*["']([^"']+)["']/g, name: 'Gemini API Key' },
    { pattern: /SUPABASE_SERVICE_ROLE_KEY\s*[:=]\s*["']([^"']+)["']/g, name: 'Supabase Service Role Key' },
    { pattern: /password\s*[:=]\s*["']([^"']+)["']/gi, name: 'Password' },
    { pattern: /secret\s*[:=]\s*["']([^"']+)["']/gi, name: 'Secret' }
  ];
  
  suspiciousPatterns.forEach(({ pattern, name }) => {
    const matches = content.match(pattern);
    if (matches) {
      console.log(`⚠️  ${name}のハードコーディングの可能性: ${filePath}`);
      console.log(`   → 環境変数を使用することを推奨します\n`);
      issuesFound++;
    }
  });
}

// ファイルを検索してスキャン
extensions.forEach(ext => {
  const pattern = `**/*.${ext}`;
  const files = glob.sync(pattern, {
    ignore: excludeDirs.map(dir => `**/${dir}/**`)
  });
  
  files.forEach(file => {
    try {
      scanFile(file);
    } catch (error) {
      // ファイル読み取りエラーは無視
    }
  });
});

// 結果のサマリー
console.log('=====================================');
if (issuesFound === 0) {
  console.log('✅ セキュリティ上の問題は見つかりませんでした！');
} else {
  console.log(`❌ ${issuesFound}個のセキュリティ上の問題が見つかりました`);
  console.log('\n推奨される対策:');
  console.log('1. APIキーを環境変数に移動');
  console.log('2. .env.exampleファイルを作成（実際の値は含めない）');
  console.log('3. .gitignoreに.envファイルを追加');
  console.log('4. 既にコミットされている場合は、git履歴から削除');
  console.log('5. 露出したAPIキーは即座に無効化して再発行');
}
console.log('=====================================');