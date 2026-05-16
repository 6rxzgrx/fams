import type { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { SignInButton } from './sign-in-button'

export const metadata: Metadata = { title: 'Masuk' }

export default async function SignInPage() {
  const session = await auth()
  if (session) redirect('/home')

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white text-2xl font-bold shadow-lg">
            F
          </div>
          <h1 className="text-2xl font-bold text-foreground">FAMS</h1>
          <p className="mt-2 text-sm text-muted-foreground">Family Asset &amp; Money System</p>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Masuk dengan akun Google keluarga Anda</p>
          <SignInButton />
        </div>

        <p className="text-xs text-muted-foreground">
          Hanya anggota keluarga yang diundang yang dapat mengakses.
        </p>
      </div>
    </div>
  )
}
