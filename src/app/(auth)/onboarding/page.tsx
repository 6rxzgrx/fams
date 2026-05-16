'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function OnboardingPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [familyName, setFamilyName] = useState('')
  const [memberName, setMemberName] = useState(session?.user?.name ?? '')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!familyName.trim() || !memberName.trim()) return

    setLoading(true)
    try {
      const res = await fetch('/api/sheets/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ familyName: familyName.trim(), memberName: memberName.trim() }),
      })
      const json = await res.json()
      if (!json.ok) {
        toast.error(json.error)
        return
      }
      toast.success(json.data.alreadyInitialized ? 'Spreadsheet siap digunakan' : 'Spreadsheet berhasil disiapkan!')
      router.push('/')
    } catch {
      toast.error('Gagal membuat spreadsheet. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white text-2xl font-bold shadow-lg">
            F
          </div>
          <h1 className="text-2xl font-bold">Selamat Datang di FAMS</h1>
          <p className="mt-2 text-sm text-muted-foreground">Siapkan spreadsheet keluarga Anda untuk memulai</p>
        </div>

        <div className="rounded-lg border bg-muted/30 p-4 text-xs text-muted-foreground space-y-2">
          <p className="font-medium text-foreground">Sebelum lanjut, pastikan:</p>
          <ol className="list-decimal pl-4 space-y-1">
            <li>Anda sudah membuat Google Spreadsheet kosong manual</li>
            <li>Spreadsheet sudah di-share sebagai <strong>Editor</strong> ke service account</li>
            <li>ID spreadsheet sudah diisi ke <code>GOOGLE_SHEETS_ID</code> di <code>.env.local</code></li>
          </ol>
          <p className="pt-1">FAMS akan otomatis membuat 16 tab beserta header dan data awal di spreadsheet Anda.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="familyName">Nama Keluarga</Label>
            <Input
              id="familyName"
              placeholder="cth. Keluarga Budi"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="memberName">Nama Anda</Label>
            <Input
              id="memberName"
              placeholder="Nama lengkap"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Menyiapkan...' : 'Siapkan Spreadsheet'}
          </Button>
        </form>
      </div>
    </div>
  )
}
