import { type NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
  const token =
    request.cookies.get('authjs.session-token')?.value ??
    request.cookies.get('__Secure-authjs.session-token')?.value ??
    request.cookies.get('next-auth.session-token')?.value ??
    request.cookies.get('__Secure-next-auth.session-token')?.value

  if (!token) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }
}

export const config = {
  matcher: [
    '/((?!api/auth|api/telegram|api/health|_next/static|_next/image|favicon\\.ico|sign-in|manifest\\.webmanifest|icon-).*)',
  ],
}
