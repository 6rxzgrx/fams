import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { title: 'Keuangan — FAMS' }

export default function FinanceIndex() {
  redirect('/finance/dashboard')
}
