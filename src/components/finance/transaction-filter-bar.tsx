'use client'

import { X, Check, ChevronDown, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import type { TransactionCategory, Account } from '@/domain/types'

export interface TransactionFilters {
  categoryId: string
  date: string
  accountId: string
}

interface TransactionFilterBarProps {
  filters: TransactionFilters
  onChange: (filters: TransactionFilters) => void
  categories: TransactionCategory[]
  accounts: Account[]
  availableDates: string[] // sorted desc unique dates from current fetch
}

function FilterChip({
  label,
  active,
  onClear,
  children,
}: {
  label: string
  active: boolean
  onClear: () => void
  children: React.ReactNode
}) {
  return (
    <DropdownMenu>
      <div className={cn(
        'flex shrink-0 items-center overflow-hidden rounded-full border text-sm font-medium transition-colors',
        active
          ? 'border-accent bg-accent text-accent-foreground'
          : 'border-border bg-surface text-foreground hover:bg-muted',
      )}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-2"
          >
            <span>{label}</span>
            <ChevronDown className="size-3.5 shrink-0 opacity-60" strokeWidth={2.5} aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>
        {active && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onClear() }}
            aria-label={`Hapus filter ${label}`}
            className="flex size-8 items-center justify-center border-l border-current/20 transition-colors hover:bg-black/10 dark:hover:bg-white/10"
          >
            <X className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
          </button>
        )}
      </div>
      {children}
    </DropdownMenu>
  )
}

export function TransactionFilterBar({
  filters,
  onChange,
  categories,
  accounts,
  availableDates,
}: TransactionFilterBarProps) {
  const activeCount = [filters.categoryId, filters.date, filters.accountId].filter(Boolean).length

  const selectedCategory = categories.find((c) => c.id === filters.categoryId)
  const selectedAccount = accounts.find((a) => a.id === filters.accountId)

  function setFilter(key: keyof TransactionFilters, value: string) {
    onChange({ ...filters, [key]: value })
  }

  function clearFilter(key: keyof TransactionFilters) {
    onChange({ ...filters, [key]: '' })
  }

  function clearAll() {
    onChange({ categoryId: '', date: '', accountId: '' })
  }

  // Build category tree: parents first, then children nested
  const parentCats = categories.filter((c) => !c.parent_id)
  const childCats = (parentId: string) => categories.filter((c) => c.parent_id === parentId)

  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  function formatDate(iso: string) {
    const [y, m, d] = iso.split('-')
    return `${d} ${MONTH_NAMES[parseInt(m) - 1]} ${y}`
  }

  return (
    <div className="flex items-center gap-2">
      {/* Active indicator icon */}
      {activeCount > 0 && (
        <div className="flex shrink-0 items-center gap-1 text-xs font-semibold text-accent">
          <SlidersHorizontal className="size-3.5" strokeWidth={2.5} />
          <span>{activeCount}</span>
        </div>
      )}

      {/* Scrollable chip row */}
      <div className="flex flex-1 gap-2 overflow-x-auto pb-0.5 scrollbar-none">

        {/* Category filter */}
        <FilterChip
          label={selectedCategory ? selectedCategory.name : 'Kategori'}
          active={!!filters.categoryId}
          onClear={() => clearFilter('categoryId')}
        >
          <DropdownMenuContent align="start" className="max-h-72 w-56 overflow-y-auto">
            {parentCats.length === 0 && (
              <DropdownMenuItem disabled>Belum ada kategori</DropdownMenuItem>
            )}
            {parentCats.map((parent) => {
              const children = childCats(parent.id)
              return (
                <div key={parent.id}>
                  {children.length > 0 ? (
                    <>
                      <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {parent.name}
                      </div>
                      {children.map((child) => (
                        <DropdownMenuItem
                          key={child.id}
                          onClick={() => setFilter('categoryId', child.id)}
                          className="pl-4"
                        >
                          <Check
                            className={cn('mr-2 size-4', filters.categoryId === child.id ? 'opacity-100' : 'opacity-0')}
                            strokeWidth={2.5}
                          />
                          <span
                            className="mr-2 inline-block size-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: child.color || '#64748b' }}
                          />
                          {child.name}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                    </>
                  ) : (
                    <DropdownMenuItem onClick={() => setFilter('categoryId', parent.id)}>
                      <Check
                        className={cn('mr-2 size-4', filters.categoryId === parent.id ? 'opacity-100' : 'opacity-0')}
                        strokeWidth={2.5}
                      />
                      <span
                        className="mr-2 inline-block size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: parent.color || '#64748b' }}
                      />
                      {parent.name}
                    </DropdownMenuItem>
                  )}
                </div>
              )
            })}
          </DropdownMenuContent>
        </FilterChip>

        {/* Date filter */}
        <FilterChip
          label={filters.date ? formatDate(filters.date) : 'Tanggal'}
          active={!!filters.date}
          onClear={() => clearFilter('date')}
        >
          <DropdownMenuContent align="start" className="max-h-72 w-52 overflow-y-auto">
            {availableDates.length === 0 && (
              <DropdownMenuItem disabled>Tidak ada data</DropdownMenuItem>
            )}
            {availableDates.map((d) => (
              <DropdownMenuItem key={d} onClick={() => setFilter('date', d)}>
                <Check
                  className={cn('mr-2 size-4', filters.date === d ? 'opacity-100' : 'opacity-0')}
                  strokeWidth={2.5}
                />
                {formatDate(d)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </FilterChip>

        {/* Account filter */}
        <FilterChip
          label={selectedAccount ? selectedAccount.name : 'Akun'}
          active={!!filters.accountId}
          onClear={() => clearFilter('accountId')}
        >
          <DropdownMenuContent align="start" className="w-52">
            {accounts.length === 0 && (
              <DropdownMenuItem disabled>Belum ada akun</DropdownMenuItem>
            )}
            {accounts.map((acc) => (
              <DropdownMenuItem key={acc.id} onClick={() => setFilter('accountId', acc.id)}>
                <Check
                  className={cn('mr-2 size-4', filters.accountId === acc.id ? 'opacity-100' : 'opacity-0')}
                  strokeWidth={2.5}
                />
                <span
                  className="mr-2 inline-block size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: acc.color || '#1e40af' }}
                />
                {acc.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </FilterChip>
      </div>

      {/* Clear all */}
      {activeCount > 0 && (
        <button
          type="button"
          onClick={clearAll}
          className="shrink-0 text-xs font-semibold text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          Hapus filter
        </button>
      )}
    </div>
  )
}
