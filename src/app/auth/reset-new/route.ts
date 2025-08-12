import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')

  if (type === 'recovery' && token_hash) {
    // トークンハッシュをパラメータとして渡す
    // update-passwordページでクライアント側で検証
    const redirectUrl = new URL('/auth/update-password', requestUrl.origin)
    redirectUrl.searchParams.set('token_hash', token_hash)
    redirectUrl.searchParams.set('type', type)
    
    return NextResponse.redirect(redirectUrl.toString())
  }

  return NextResponse.redirect(`${requestUrl.origin}/login?error=invalid_link`)
}