'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  ArrowLeftRight,
  Briefcase,
  ExternalLink,
  FileText,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { EmptyState } from '@/components/sections/empty-state'
import { ErrorState } from '@/components/sections/error-state'
import { ListSkeleton } from '@/components/sections/loading-state'
import { MoneyDisplay } from '@/components/finance/money-display'
import { TransactionItem } from '@/components/finance/transaction-item'
import { buildRegistryData, type RegistryItem } from '@/components/finance/asset-registry-shared'
import { MobileBackButton } from '@/components/nav/mobile-back-button'
import { PageContainer } from '@/components/layout/page-container'
import { useAccounts } from '@/hooks/use-accounts'
import { useAssets } from '@/hooks/use-assets'
import { useCategories } from '@/hooks/use-categories'
import { useTransactions } from '@/hooks/use-transactions'
import { cn } from '@/lib/utils'
import type { Account, Asset, TransactionCategory } from '@/domain/types'

export default function AsetPage() {
  const { accounts, isLoading: accLoading, error: accError, mutate: mutateAccounts } = useAccounts()
  const { assets, isLoading: assetLoading, error: assetError, mutate: mutateAssets } = useAssets()
  const { categories } = useCategories()
  const [detail, setDetail] = useState<RegistryItem | null>(null)

  const isLoading = accLoading || assetLoading
  const error = accError || assetError
  const { accountGroups, assetGroups, totalSaldo, totalNilai, hasItems } = buildRegistryData(accounts, assets)
  const accountNameById = new Map(accounts.map((account) => [account.id, account.name]))

  function handleRetry() {
    mutateAccounts()
    mutateAssets()
  }

  return (
    <PageContainer bleed>
      <header className="space-y-4 px-5 py-4 lg:px-0 lg:py-0 lg:pb-8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <MobileBackButton />
            <h1 className="text-[22px] font-semibold leading-tight tracking-tight lg:text-[28px]">Aset</h1>
            <p className="hidden text-[13px] text-muted-foreground lg:block">
              Daftar akun dan aset keluarga. Ubah data lewat Finance Setup di Pengaturan.
            </p>
          </div>
          <Button asChild variant="outline" className="shrink-0 rounded-pill lg:rounded-md">
            <Link href="/settings/finance-setup/assets">
              Finance Setup
              <ExternalLink className="size-4" strokeWidth={2.25} aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </header>

      {isLoading && <ListSkeleton count={5} />}
      {error && <ErrorState message={error} onRetry={handleRetry} />}

      {!isLoading && !error && !hasItems && (
        <EmptyState
          icon={Briefcase}
          title="Belum ada aset"
          description="Tambahkan akun atau aset fisik melalui Finance Setup di menu Pengaturan."
          action={
            <Button asChild variant="accent">
              <Link href="/settings/finance-setup/assets">Buka Finance Setup</Link>
            </Button>
          }
        />
      )}

      {!isLoading && !error && hasItems && (
        <div className="space-y-2 lg:space-y-0 lg:overflow-hidden lg:rounded-lg lg:border lg:border-border lg:bg-surface">
          <div className="bg-surface px-5 py-4 lg:border-b lg:border-border lg:bg-muted/40 lg:px-6">
            <div className="flex flex-wrap gap-6">
              <div>
                <p className="text-eyebrow text-muted-foreground">Total Saldo</p>
                <MoneyDisplay amount={totalSaldo} className="mt-1 text-2xl lg:text-[26px]" />
                <p className="mt-0.5 text-[11px] text-muted-foreground">Aset yang dihitung ke saldo</p>
              </div>
              {totalNilai !== totalSaldo && (
                <div>
                  <p className="text-eyebrow text-muted-foreground">Total Nilai</p>
                  <MoneyDisplay amount={totalNilai} className="mt-1 text-2xl lg:text-[26px]" />
                  <p className="mt-0.5 text-[11px] text-muted-foreground">Semua aset</p>
                </div>
              )}
            </div>
          </div>

          {Object.keys(accountGroups).length > 0 && (
            <OverviewGroupSection
              title="Akun"
              subTitle="Ketuk untuk melihat detail dan transaksi."
              groups={accountGroups}
              accountNameById={accountNameById}
              onSelect={setDetail}
            />
          )}

          {Object.keys(assetGroups).length > 0 && (
            <OverviewGroupSection
              title="Aset Fisik"
              subTitle="Ketuk untuk melihat detail aset dan transaksi terkait."
              groups={assetGroups}
              accountNameById={accountNameById}
              onSelect={setDetail}
            />
          )}
        </div>
      )}

      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="sm:max-w-2xl">
          {detail && (
            <RegistryDetailDialog
              detail={detail}
              categories={categories}
              accountNameById={accountNameById}
            />
          )}
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}

function OverviewGroupSection({
  title,
  subTitle,
  groups,
  accountNameById,
  onSelect,
}: {
  title: string
  subTitle?: string
  groups: Record<string, RegistryItem[]>
  accountNameById: Map<string, string>
  onSelect: (item: RegistryItem) => void
}) {
  return (
    <div className="lg:border-t lg:border-border">
      <div className="px-5 pb-1.5 pt-3 lg:bg-muted/20 lg:py-2.5">
        <p className="text-sm font-semibold">{title}</p>
        {subTitle && <p className="text-[11px] text-muted-foreground">{subTitle}</p>}
      </div>
      {Object.entries(groups).map(([groupLabel, items], idx) => (
        <section key={groupLabel} className={cn('mb-2 lg:mb-0', idx > 0 && 'lg:border-t lg:border-border/60')}>
          <div className="px-5 pb-1 pt-2 lg:bg-muted/40 lg:py-1.5">
            <p className="text-eyebrow text-muted-foreground">{groupLabel}</p>
          </div>
          <div className="divide-y divide-border bg-surface">
            {items.map((item) => {
              const linkedAccountName = item.kind === 'asset'
                ? accountNameById.get((item.raw as Asset).account_id || '')
                : undefined

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelect(item)}
                  className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-muted/40"
                >
                  <div
                    className={cn(
                      'flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                      item.kind === 'account' ? 'text-white' : 'bg-accent-soft text-accent',
                    )}
                    style={item.kind === 'account' ? { backgroundColor: (item.raw as Account).color || '#1e40af' } : undefined}
                  >
                    {item.kind === 'account'
                      ? item.name.slice(0, 1).toUpperCase()
                      : <Briefcase className="size-5" strokeWidth={2} aria-hidden="true" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate font-medium">{item.name}</p>
                      {!item.includeInSaldo && (
                        <Badge variant="secondary" className="shrink-0 px-1.5 py-0 text-[10px]">
                          Dikecualikan
                        </Badge>
                      )}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.kind === 'account'
                        ? item.subLabel || item.typeLabel
                        : linkedAccountName
                          ? `Akun terkait: ${linkedAccountName}`
                          : item.typeLabel}
                    </p>
                  </div>
                  <MoneyDisplay amount={item.value} />
                </button>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}

function RegistryDetailDialog({
  detail,
  categories,
  accountNameById,
}: {
  detail: RegistryItem
  categories: TransactionCategory[]
  accountNameById: Map<string, string>
}) {
  const linkedAccountId = detail.kind === 'account'
    ? detail.id
    : (detail.raw as Asset).account_id || '__none__'
  const { transactions, isLoading, error } = useTransactions({ account_id: linkedAccountId, limit: 25 })

  const account = detail.kind === 'account' ? detail.raw as Account : null
  const asset = detail.kind === 'asset' ? detail.raw as Asset : null
  const relatedAccountName = asset?.account_id ? accountNameById.get(asset.account_id) : undefined

  return (
    <div className="space-y-5">
      <DialogHeader>
        <DialogTitle>{detail.name}</DialogTitle>
      </DialogHeader>

      <div className="grid gap-3 sm:grid-cols-2">
        <InfoCard
          label={detail.kind === 'account' ? 'Saldo Saat Ini' : 'Nilai Aset'}
          value={<MoneyDisplay amount={detail.value} className="text-[22px]" />}
        />
        <InfoCard
          label="Jenis"
          value={<span className="text-base font-semibold">{detail.typeLabel}</span>}
        />
        <InfoCard
          label="Hitung ke Saldo"
          value={<Badge variant={detail.includeInSaldo ? 'success' : 'secondary'}>{detail.includeInSaldo ? 'Ya' : 'Tidak'}</Badge>}
        />
        <InfoCard
          label={detail.kind === 'account' ? 'Provider / Bank' : 'Akun Terkait'}
          value={
            <span className="text-sm font-medium text-foreground">
              {detail.kind === 'account'
                ? account?.bank_name || '-'
                : relatedAccountName || 'Belum ditautkan'}
            </span>
          }
        />
      </div>

      {account && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-eyebrow text-muted-foreground">Detail Akun</p>
          <dl className="mt-3 space-y-2 text-sm">
            <DetailRow label="Nama akun" value={account.name} />
            <DetailRow label="Nomor akun" value={account.account_number || '-'} />
            <DetailRow label="Catatan" value={account.notes || '-'} />
          </dl>
        </div>
      )}

      {asset && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-eyebrow text-muted-foreground">Detail Aset</p>
          <dl className="mt-3 space-y-2 text-sm">
            <DetailRow label="Nama aset" value={asset.name} />
            <DetailRow label="Akun terkait" value={relatedAccountName || '-'} />
            <DetailRow label="Catatan" value={asset.notes || '-'} />
          </dl>
        </div>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">Transaksi Terkait</h3>
            <p className="text-[12px] text-muted-foreground">
              {detail.kind === 'account'
                ? 'Riwayat transaksi untuk akun ini.'
                : relatedAccountName
                  ? 'Riwayat transaksi dari akun yang ditautkan ke aset ini.'
                  : 'Aset ini belum ditautkan ke akun transaksi.'}
            </p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/settings/finance-setup/assets">Kelola Data</Link>
          </Button>
        </div>

        {detail.kind === 'asset' && !relatedAccountName ? (
          <EmptyState
            icon={FileText}
            title="Belum ada transaksi terkait"
            description="Tautkan aset ke akun lewat Finance Setup agar riwayat transaksi bisa ditampilkan di sini."
            className="rounded-xl border border-border bg-surface py-10"
          />
        ) : isLoading ? (
          <ListSkeleton count={3} />
        ) : error ? (
          <ErrorState message={error} />
        ) : transactions.length === 0 ? (
          <EmptyState
            icon={ArrowLeftRight}
            title="Belum ada transaksi"
            description="Belum ada transaksi yang tercatat untuk entitas ini."
            className="rounded-xl border border-border bg-surface py-10"
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            <div className="divide-y divide-border">
              {transactions.map((transaction) => (
                <TransactionItem key={transaction.id} transaction={transaction} categories={categories} />
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

function InfoCard({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-eyebrow text-muted-foreground">{label}</p>
      <div className="mt-2">{value}</div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  )
}
