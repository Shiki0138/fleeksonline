'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Settings, Save, Globe, Lock, Bell, CreditCard, Shield, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

interface SystemSettings {
  siteName: string
  siteDescription: string
  contactEmail: string
  maintenanceMode: boolean
  allowRegistration: boolean
  requireEmailVerification: boolean
  freeVideoLimit: number
  stripePublicKey: string
  stripeSecretKey: string
  openaiApiKey: string
  emailNotifications: boolean
  slackWebhook: string
}

export default function SystemSettingsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showSecrets, setShowSecrets] = useState(false)
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'payment' | 'notifications'>('general')
  
  const [settings, setSettings] = useState<SystemSettings>({
    siteName: 'FLEEKS Platform',
    siteDescription: 'ビジネスと個人開発のための動画プラットフォーム',
    contactEmail: 'support@fleeks.jp',
    maintenanceMode: false,
    allowRegistration: true,
    requireEmailVerification: true,
    freeVideoLimit: 300, // 5分 = 300秒
    stripePublicKey: '',
    stripeSecretKey: '',
    openaiApiKey: '',
    emailNotifications: true,
    slackWebhook: ''
  })

  const handleSave = async () => {
    setIsLoading(true)
    try {
      // 実際の実装では、これらの設定をSupabaseやサーバーに保存します
      // 現在はデモなので、ローカルストレージに保存
      localStorage.setItem('fleeks_settings', JSON.stringify(settings))
      
      toast.success('設定を保存しました')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('設定の保存に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const tabs = [
    { id: 'general', label: '一般設定', icon: Globe },
    { id: 'security', label: 'セキュリティ', icon: Shield },
    { id: 'payment', label: '決済設定', icon: CreditCard },
    { id: 'notifications', label: '通知設定', icon: Bell }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            onClick={() => router.push('/admin')}
            className="flex items-center space-x-2 text-gray-300 hover:text-white mb-6 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>管理画面に戻る</span>
          </button>

          <h1 className="text-3xl font-bold mb-8 flex items-center">
            <Settings className="w-8 h-8 mr-3 text-gray-500" />
            システム設定
          </h1>

          {/* タブナビゲーション */}
          <div className="flex space-x-4 mb-8 border-b border-white/20">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-4 px-2 font-medium transition flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'text-white border-b-2 border-blue-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8">
            {/* 一般設定 */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">サイト名</label>
                  <input
                    type="text"
                    value={settings.siteName}
                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">サイト説明</label>
                  <textarea
                    value={settings.siteDescription}
                    onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">お問い合わせメール</label>
                  <input
                    type="email"
                    value={settings.contactEmail}
                    onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.maintenanceMode}
                      onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                      className="w-5 h-5 rounded"
                    />
                    <span>メンテナンスモード</span>
                  </label>
                  <p className="text-xs text-gray-400 mt-1 ml-8">
                    有効にすると管理者以外のアクセスを制限します
                  </p>
                </div>
              </div>
            )}

            {/* セキュリティ設定 */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.allowRegistration}
                      onChange={(e) => setSettings({ ...settings, allowRegistration: e.target.checked })}
                      className="w-5 h-5 rounded"
                    />
                    <span>新規登録を許可</span>
                  </label>
                  <p className="text-xs text-gray-400 mt-1 ml-8">
                    無効にすると新規ユーザー登録ができなくなります
                  </p>
                </div>

                <div>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.requireEmailVerification}
                      onChange={(e) => setSettings({ ...settings, requireEmailVerification: e.target.checked })}
                      className="w-5 h-5 rounded"
                    />
                    <span>メール認証を必須にする</span>
                  </label>
                  <p className="text-xs text-gray-400 mt-1 ml-8">
                    新規登録時にメール認証を要求します
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">無料会員の視聴制限（秒）</label>
                  <input
                    type="number"
                    value={settings.freeVideoLimit}
                    onChange={(e) => setSettings({ ...settings, freeVideoLimit: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    無料会員が動画を視聴できる最大時間（秒）。300秒 = 5分
                  </p>
                </div>
              </div>
            )}

            {/* 決済設定 */}
            {activeTab === 'payment' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">API Keys</h3>
                  <button
                    onClick={() => setShowSecrets(!showSecrets)}
                    className="flex items-center space-x-2 text-sm text-gray-400 hover:text-white transition"
                  >
                    {showSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    <span>{showSecrets ? '非表示' : '表示'}</span>
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Stripe Public Key</label>
                  <input
                    type={showSecrets ? 'text' : 'password'}
                    value={settings.stripePublicKey}
                    onChange={(e) => setSettings({ ...settings, stripePublicKey: e.target.value })}
                    placeholder="pk_test_..."
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Stripe Secret Key</label>
                  <input
                    type={showSecrets ? 'text' : 'password'}
                    value={settings.stripeSecretKey}
                    onChange={(e) => setSettings({ ...settings, stripeSecretKey: e.target.value })}
                    placeholder="sk_test_..."
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">OpenAI API Key</label>
                  <input
                    type={showSecrets ? 'text' : 'password'}
                    value={settings.openaiApiKey}
                    onChange={(e) => setSettings({ ...settings, openaiApiKey: e.target.value })}
                    placeholder="sk-..."
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    ブログ自動生成機能で使用します
                  </p>
                </div>
              </div>
            )}

            {/* 通知設定 */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                      className="w-5 h-5 rounded"
                    />
                    <span>メール通知を有効にする</span>
                  </label>
                  <p className="text-xs text-gray-400 mt-1 ml-8">
                    新規登録やアクティビティに関するメール通知
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Slack Webhook URL</label>
                  <input
                    type={showSecrets ? 'text' : 'password'}
                    value={settings.slackWebhook}
                    onChange={(e) => setSettings({ ...settings, slackWebhook: e.target.value })}
                    placeholder="https://hooks.slack.com/services/..."
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    重要なイベントをSlackに通知します
                  </p>
                </div>
              </div>
            )}

            {/* 保存ボタン */}
            <div className="mt-8 flex justify-end">
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-lg font-medium flex items-center space-x-2 transition disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                <span>{isLoading ? '保存中...' : '設定を保存'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}