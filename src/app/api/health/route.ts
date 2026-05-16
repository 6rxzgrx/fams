import { NextResponse } from 'next/server'
import { isSheetsConfigured } from '@/lib/env'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    sheets: isSheetsConfigured() ? 'configured' : 'not_configured',
  })
}
