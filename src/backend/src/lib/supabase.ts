import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Supabase環境変数が設定されていません。ローカル認証を使用します。');
}

// Supabaseクライアント（サーバーサイド用）
export const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

// Supabase認証ヘルパー
export const supabaseAuth = {
  // Supabaseユーザーの存在確認
  async getUser(email: string) {
    if (!supabase) return null;
    
    try {
      const { data, error } = await supabase.auth.admin.listUsers();
      if (error) throw error;
      
      return data.users.find(user => user.email === email) || null;
    } catch (error) {
      console.error('Supabaseユーザー取得エラー:', error);
      return null;
    }
  },

  // Supabaseユーザー作成
  async createUser(email: string, password: string, userData: any) {
    if (!supabase) return null;
    
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        user_metadata: userData,
        email_confirm: true, // 自動でメール確認
      });
      
      if (error) throw error;
      return data.user;
    } catch (error) {
      console.error('Supabaseユーザー作成エラー:', error);
      throw error;
    }
  },

  // Supabaseユーザー更新
  async updateUser(userId: string, updates: any) {
    if (!supabase) return null;
    
    try {
      const { data, error } = await supabase.auth.admin.updateUserById(userId, updates);
      if (error) throw error;
      return data.user;
    } catch (error) {
      console.error('Supabaseユーザー更新エラー:', error);
      throw error;
    }
  },

  // Supabaseユーザー削除
  async deleteUser(userId: string) {
    if (!supabase) return false;
    
    try {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Supabaseユーザー削除エラー:', error);
      return false;
    }
  },

  // JWT トークン検証
  async verifyToken(token: string) {
    if (!supabase) return null;
    
    try {
      const { data, error } = await supabase.auth.getUser(token);
      if (error) throw error;
      return data.user;
    } catch (error) {
      console.error('Supabaseトークン検証エラー:', error);
      return null;
    }
  },
};

// Supabase接続テスト
export const testSupabaseConnection = async () => {
  if (!supabase) {
    return { connected: false, message: 'Supabase設定が見つかりません' };
  }

  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) throw error;
    
    return { 
      connected: true, 
      message: `Supabase接続成功。ユーザー数: ${data.users.length}` 
    };
  } catch (error) {
    return { 
      connected: false, 
      message: `Supabase接続失敗: ${error}` 
    };
  }
};