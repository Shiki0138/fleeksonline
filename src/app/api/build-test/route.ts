import { NextResponse } from 'next/server'

export async function GET() {
  const envCheck = {
    NODE_ENV: process.env.NODE_ENV,
    NODE_VERSION: process.version,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Set' : '✗ Not set',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ Set' : '✗ Not set',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ Set' : '✗ Not set',
    GEMINI_API_KEY: process.env.GEMINI_API_KEY ? '✓ Set' : '✗ Not set',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'Not set',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '✓ Set' : '✗ Not set',
  }

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: envCheck,
    buildInfo: {
      nextVersion: '14.0.4',
      nodeVersion: process.version,
    }
  })
}