import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Deployment test successful',
    timestamp: new Date().toISOString()
  })
}