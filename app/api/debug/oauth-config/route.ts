import { NextResponse } from 'next/server'

export async function GET() {
  const appId = process.env.META_APP_ID || '(not set)'
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI || '(not set)'
  const hasSecret = !!process.env.META_APP_SECRET

  return NextResponse.json({
    META_APP_ID: appId,
    INSTAGRAM_REDIRECT_URI: redirectUri,
    META_APP_SECRET_present: hasSecret,
    META_APP_SECRET_length: process.env.META_APP_SECRET?.length || 0,
  })
}
