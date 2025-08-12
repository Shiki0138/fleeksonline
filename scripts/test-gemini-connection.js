const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

console.log('環境変数チェック:');
console.log('GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);
console.log('GEMINI_API_KEY length:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0);

// Gemini APIの接続テスト
if (process.env.GEMINI_API_KEY) {
  const { GoogleGenerativeAI } = require("@google/generative-ai");
  
  async function testConnection() {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const result = await model.generateContent("Say 'Hello, API is working!' in Japanese.");
      const response = await result.response;
      const text = response.text();
      
      console.log('\n✅ Gemini API接続成功!');
      console.log('レスポンス:', text);
    } catch (error) {
      console.error('\n❌ Gemini API接続エラー:', error.message);
    }
  }
  
  testConnection();
} else {
  console.error('\n❌ GEMINI_API_KEYが設定されていません');
}