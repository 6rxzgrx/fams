'use client'

import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'sonner'
import { ThemeProvider, useTheme } from './theme-provider'
import { SwRegister } from './sw-register'

function ThemedToaster() {
  const { resolvedTheme } = useTheme()
  return (
    <Toaster
      theme={resolvedTheme}
      position="top-center"
      richColors
      closeButton
      duration={4000}
      toastOptions={{ className: 'font-sans' }}
    />
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SessionProvider>
        <SwRegister />
        {children}
        <ThemedToaster />
      </SessionProvider>
    </ThemeProvider>
  )
}
