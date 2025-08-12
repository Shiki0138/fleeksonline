'use client'

import Link from 'next/link'
import { CheckCircle, AlertCircle, Info } from 'lucide-react'

export default function ResetGuidePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            パスワードリセット方法
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            お客様の状況に合わせて、最適な方法をお選びください
          </p>
        </div>

        {/* Option 1: Simple Reset */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-start">
            <CheckCircle className="flex-shrink-0 h-6 w-6 text-green-500 mt-1" />
            <div className="ml-3 flex-1">
              <h2 className="text-lg font-medium text-gray-900">
                方法1: シンプルリセット（推奨）
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                最も簡単な方法です。メールアドレスを入力すると、パスワードリセット用のリンクが送信されます。
              </p>
              <div className="mt-3 bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-800">
                  <strong>注意:</strong> メールに記載されているリンクが機能しない場合は、URLの「#」を「?」に手動で変更してください。
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  例: /auth/update-password#access_token=xxx → /auth/update-password?access_token=xxx
                </p>
              </div>
              <Link
                href="/auth/simple-reset"
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                シンプルリセットを試す
              </Link>
            </div>
          </div>
        </div>

        {/* Option 2: Emergency Reset */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-start">
            <AlertCircle className="flex-shrink-0 h-6 w-6 text-yellow-500 mt-1" />
            <div className="ml-3 flex-1">
              <h2 className="text-lg font-medium text-gray-900">
                方法2: 緊急用リセット（OTP方式）
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                6桁の確認コードを使用する方法です。ただし、現在のSupabaseの設定により、6桁のコードではなくリンクが送信される場合があります。
              </p>
              <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-sm text-yellow-800">
                  <strong>重要:</strong> この方法は、Supabaseの管理画面でOTP設定が有効になっている場合のみ機能します。
                </p>
              </div>
              <Link
                href="/auth/emergency-reset"
                className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                緊急用リセットを試す
              </Link>
            </div>
          </div>
        </div>

        {/* Option 3: Admin Reset */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-start">
            <Info className="flex-shrink-0 h-6 w-6 text-red-500 mt-1" />
            <div className="ml-3 flex-1">
              <h2 className="text-lg font-medium text-gray-900">
                方法3: 管理者に問い合わせ
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                上記の方法でリセットできない場合は、管理者が直接パスワードをリセットすることができます。
              </p>
              <div className="mt-3 bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-800">
                  <strong>注意:</strong> この方法は管理者権限が必要です。一般ユーザーは管理者にお問い合わせください。
                </p>
              </div>
              <Link
                href="/auth/admin-reset"
                className="mt-4 inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
              >
                管理者用リセット
              </Link>
            </div>
          </div>
        </div>

        {/* Back to Login */}
        <div className="text-center mt-8">
          <Link
            href="/auth/login"
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            ← ログインページに戻る
          </Link>
        </div>
      </div>
    </div>
  )
}