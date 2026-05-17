'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden>
      <path fill="#0A0A0B" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#0A0A0B" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" opacity=".85" />
      <path fill="#0A0A0B" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" opacity=".7" />
      <path fill="#0A0A0B" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" opacity=".55" />
    </svg>
  )
}

export function SignInButton() {
  const [loading, setLoading] = useState(false)

  async function handleSignIn() {
    setLoading(true)
    await signIn('google', { callbackUrl: '/' })
  }

  return (
    <button
      onClick={handleSignIn}
      disabled={loading}
      style={{
        width: '100%',
        height: 54,
        borderRadius: 16,
        border: 'none',
        cursor: loading ? 'not-allowed' : 'pointer',
        background: '#C5F23E',
        color: '#0A0A0B',
        fontFamily: 'inherit',
        fontSize: 15.5,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        letterSpacing: '-0.01em',
        boxShadow: '0 10px 28px rgba(197,242,62,0.32), inset 0 1px 0 rgba(255,255,255,0.5)',
        opacity: loading ? 0.7 : 1,
        transition: 'opacity 0.15s',
      }}
    >
      <GoogleIcon />
      {loading ? 'Memuat...' : 'Masuk dengan Google'}
    </button>
  )
}
