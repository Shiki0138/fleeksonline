'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // The actual auth handling is done in the route handler (route.ts)
    // This page just shows a loading state while the redirect happens
    
    // Check for error params
    const error = searchParams.get('error');
    if (error) {
      router.push(`/login?error=${error}`);
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <h1 className="text-xl font-semibold text-gray-800">認証中...</h1>
        <p className="text-gray-600 mt-2">少々お待ちください</p>
      </div>
    </div>
  );
}