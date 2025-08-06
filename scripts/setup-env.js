#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('🔧 Fleeks AI Platform - 環境変数セットアップスクリプト\n');

// 暗号化キー生成
function generateEncryptionKey() {
  return crypto.randomBytes(32).toString('hex');
}

// JWT秘密鍵生成
function generateJWTSecret() {
  return crypto.randomBytes(64).toString('base64');
}

// 環境変数ファイル更新
function updateEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');
  let envContent = fs.readFileSync(envPath, 'utf8');

  // 暗号化キーを自動生成
  const encryptionKey = generateEncryptionKey();
  const biometricKey = generateEncryptionKey();
  const jwtSecret = generateJWTSecret();

  envContent = envContent.replace('JWT_SECRET=', `JWT_SECRET=${jwtSecret}`);
  envContent = envContent.replace('ENCRYPTION_KEY=', `ENCRYPTION_KEY=${encryptionKey}`);
  envContent = envContent.replace('BIOMETRIC_ENCRYPTION_KEY=', `BIOMETRIC_ENCRYPTION_KEY=${biometricKey}`);

  fs.writeFileSync(envPath, envContent);
  
  console.log('✅ セキュリティキーを自動生成しました');
  console.log(`   JWT_SECRET: ${jwtSecret.substring(0, 20)}...`);
  console.log(`   ENCRYPTION_KEY: ${encryptionKey.substring(0, 20)}...`);
  console.log(`   BIOMETRIC_KEY: ${biometricKey.substring(0, 20)}...\n`);
}

// メイン処理
async function main() {
  console.log('📋 設定が必要な環境変数:');
  console.log('');
  
  console.log('【最優先 - 動作に必須】');
  console.log('1. NEXT_PUBLIC_SUPABASE_URL');
  console.log('2. NEXT_PUBLIC_SUPABASE_ANON_KEY');
  console.log('3. SUPABASE_SERVICE_ROLE_KEY');
  console.log('4. SQUARE_ACCESS_TOKEN');
  console.log('5. SQUARE_LOCATION_ID');
  console.log('');
  
  console.log('【推奨 - AI機能用】');
  console.log('6. HUGGINGFACE_API_KEY (無料)');
  console.log('7. NEXT_PUBLIC_GA4_MEASUREMENT_ID');
  console.log('');
  
  console.log('【オプション - 拡張機能用】');
  console.log('8. OPENAI_API_KEY');
  console.log('9. YOUTUBE_API_KEY');
  console.log('10. SMTP_USER & SMTP_PASS');
  console.log('');

  // セキュリティキーを自動生成
  updateEnvFile();

  console.log('🚀 次のステップ:');
  console.log('1. Supabaseプロジェクトを作成: https://app.supabase.com');
  console.log('2. Squareアカウントを作成: https://developer.squareup.com');
  console.log('3. .env.localファイルに必要な値を入力');
  console.log('4. npm run dev でサーバー起動');
  console.log('');
  
  console.log('💡 詳細な設定方法は docs/SETUP_GUIDE.md を参照してください');
}

main().catch(console.error);