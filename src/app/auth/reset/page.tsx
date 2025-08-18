'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function ResetRedirectPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  useEffect(() => {
    // Redirect to the correct password reset page
    const params = new URLSearchParams(searchParams.toString())
    const redirectUrl = `/auth/password-reset?${params.toString()}`
    
    console.log('[Reset Redirect] Redirecting to:', redirectUrl)
    router.replace(redirectUrl)
  }, [router, searchParams])
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-gray-300">リダイレクト中...</p>
      </div>
    </div>
  )
}