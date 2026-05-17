'use client'

import { useDeferredValue, useState } from 'react'
import type { ReactNode } from 'react'
import { Search, Star, ChevronDown, Check } from 'lucide-react'
import type { CategoryType, TransactionCategory } from '@/domain/types'
import {
  CATEGORY_TYPE_LABELS,
  formatCategoryLabel,
  getCategoryBranches,
  searchSelectableCategories,
} from '@/domain/categories'
import { useFavoriteCategoryIds } from '@/hooks/use-favorite-category-ids'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { CategoryIcon } from '@/components/finance/category-icon'
import { cn } from '@/lib/utils'

const ALL_CATEGORY_TYPES: CategoryType[] = ['expense', 'income', 'transfer']

interface TransactionCategoryPickerProps {
  categories: TransactionCategory[]
  value: string
  onChange: (categoryId: string) => void
  allowedTypes?: CategoryType[]
  defaultType?: CategoryType
  label?: string
  placeholder?: string
}

export function TransactionCategoryPicker({
  categories,
  value,
  onChange,
  allowedTypes = ALL_CATEGORY_TYPES,
  defaultType = 'expense',
  label = 'Pilih kategori',
  placeholder = 'Pilih kategori',
}: TransactionCategoryPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const { favoriteIds, isFavorite, toggleFavorite } = useFavoriteCategoryIds()
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  const selectedCategory = categories.find((c) => c.id === value)
  const normalizedDefaultType = allowedTypes.includes(defaultType) ? defaultType : allowedTypes[0]

  const [manualType, setManualType] = useState<CategoryType>(
    selectedCategory && allowedTypes.includes(selectedCategory.type)
      ? selectedCategory.type
      : normalizedDefaultType,
  )
  const activeType = allowedTypes.includes(manualType) ? manualType : normalizedDefaultType

  const typeCategories = searchSelectableCategories(categories, deferredQuery, activeType)
  const favoriteCategories = typeCategories.filter((c) => favoriteIds.includes(c.id))
  const fullListCategories = typeCategories.filter((c) => !favoriteIds.includes(c.id))
  const branches = getCategoryBranches(categories, activeType)
  const hasVisibleBranches = branches.some((branch) =>
    branch.children.length > 0
      ? branch.children.some((child) => !isFavorite(child.id))
      : !isFavorite(branch.parent.id),
  )

  function toggleGroup(id: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleSelect(categoryId: string) {
    onChange(categoryId)
    setOpen(false)
    setQuery('')
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (nextOpen) {
      const cat = categories.find((c) => c.id === value)
      const syncedType = cat && allowedTypes.includes(cat.type) ? cat.type : normalizedDefaultType
      setManualType(syncedType)
      setCollapsedGroups(new Set())
    } else {
      setQuery('')
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'flex min-h-12 w-full items-center gap-3 rounded-lg border border-input bg-background px-3 py-2 text-left transition-colors hover:bg-muted/40',
          !selectedCategory && 'text-muted-foreground',
        )}
      >
        <span
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: selectedCategory?.color ?? '#64748b' }}
          aria-hidden="true"
        >
          <CategoryIcon
            icon={selectedCategory?.icon ?? 'tag'}
            className="size-4 text-white"
          />
        </span>
        <div className="min-w-0 flex-1">
          <p className={cn('truncate text-sm font-medium', !selectedCategory && 'font-normal')}>
            {selectedCategory ? formatCategoryLabel(selectedCategory, categories) : placeholder}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {selectedCategory ? CATEGORY_TYPE_LABELS[selectedCategory.type] : label}
          </p>
        </div>
        <Star
          className={cn(
            'size-4 shrink-0',
            selectedCategory && isFavorite(selectedCategory.id) ? 'fill-accent text-accent' : 'text-muted-foreground',
          )}
          strokeWidth={2}
          aria-hidden="true"
        />
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
          <DialogHeader className="border-b border-border px-5 py-4">
            <DialogTitle>Pilih Kategori</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Pilih kategori akhir. Jenis transaksi akan ikut otomatis.
            </p>
          </DialogHeader>

          {/* Type tabs + search */}
          <div className="border-b border-border px-5 py-3">
            {allowedTypes.length > 1 && (
              <div className="mb-3 grid grid-cols-3 gap-1.5 rounded-xl bg-muted/60 p-1">
                {allowedTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setManualType(type)}
                    className={cn(
                      'rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors',
                      activeType === type
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:bg-background/80 hover:text-foreground',
                    )}
                  >
                    {CATEGORY_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
            )}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" strokeWidth={2} />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari kategori..."
                className="h-10 pl-9"
              />
            </div>
          </div>

          {/* List */}
          <div className="max-h-[60svh] space-y-4 overflow-y-auto px-5 py-4">
            {/* Favorites section */}
            {favoriteCategories.length > 0 && (
              <ListSection title="Favorit">
                {favoriteCategories.map((cat) => (
                  <FlatCategoryRow
                    key={cat.id}
                    category={cat}
                    categories={categories}
                    label={formatCategoryLabel(cat, categories)}
                    selected={cat.id === value}
                    isFavorite={isFavorite(cat.id)}
                    onSelect={() => handleSelect(cat.id)}
                    onToggleFavorite={() => toggleFavorite(cat.id)}
                  />
                ))}
              </ListSection>
            )}

            {/* Search results */}
            {deferredQuery ? (
              <ListSection title="Hasil Pencarian">
                {fullListCategories.length > 0 ? (
                  fullListCategories.map((cat) => (
                    <FlatCategoryRow
                      key={cat.id}
                      category={cat}
                      categories={categories}
                      label={formatCategoryLabel(cat, categories)}
                      selected={cat.id === value}
                      isFavorite={isFavorite(cat.id)}
                      onSelect={() => handleSelect(cat.id)}
                      onToggleFavorite={() => toggleFavorite(cat.id)}
                    />
                  ))
                ) : (
                  <EmptyCategoryState />
                )}
              </ListSection>
            ) : (
              <ListSection title="Semua Kategori">
                {hasVisibleBranches ? (
                  <div className="space-y-2">
                    {branches.map((branch) => {
                      const hasChildren = branch.children.length > 0
                      const isCollapsed = collapsedGroups.has(branch.parent.id)
                      const isStandaloneFavorite = !hasChildren && isFavorite(branch.parent.id)

                      if (isStandaloneFavorite) return null

                      // Standalone (mandiri) — no toggle, simple flat row
                      if (!hasChildren) {
                        return (
                          <FlatCategoryRow
                            key={branch.parent.id}
                            category={branch.parent}
                            categories={categories}
                            label={branch.parent.name}
                            selected={branch.parent.id === value}
                            isFavorite={isFavorite(branch.parent.id)}
                            onSelect={() => handleSelect(branch.parent.id)}
                            onToggleFavorite={() => toggleFavorite(branch.parent.id)}
                          />
                        )
                      }

                      // Parent with children — card with toggle + indented children
                      const visibleChildren = branch.children.filter((c) => !isFavorite(c.id))
                      if (visibleChildren.length === 0) return null

                      return (
                        <div key={branch.parent.id} className="overflow-hidden rounded-xl border border-border bg-surface">
                          {/* Parent header row */}
                          <div className={cn(
                            'flex items-center gap-2 px-3 py-2.5',
                            isCollapsed ? 'bg-surface' : 'border-b border-border bg-muted/30',
                          )}>
                            {/* Toggle on left */}
                            <button
                              type="button"
                              onClick={() => toggleGroup(branch.parent.id)}
                              aria-label={isCollapsed ? 'Buka' : 'Tutup'}
                              className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                              <ChevronDown
                                className={cn('size-3.5 transition-transform duration-200', isCollapsed && '-rotate-90')}
                                strokeWidth={2.5}
                                aria-hidden="true"
                              />
                            </button>
                            {/* Icon circle */}
                            <span
                              className="inline-flex size-8 shrink-0 items-center justify-center rounded-full"
                              style={{ backgroundColor: branch.parent.color || '#64748b' }}
                              aria-hidden="true"
                            >
                              <CategoryIcon icon={branch.parent.icon ?? 'tag'} className="size-4 text-white" />
                            </span>
                            {/* Name + count */}
                            <p className="flex-1 truncate text-sm font-semibold">{branch.parent.name}</p>
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {visibleChildren.length}
                            </span>
                          </div>

                          {/* Children — indented rows, no individual box borders */}
                          {!isCollapsed && (
                            <div className="py-1">
                              {visibleChildren.map((child) => {
                                const childSelected = child.id === value
                                return (
                                  <div key={child.id} className={cn(
                                    'flex items-center transition-colors hover:bg-muted/50',
                                    childSelected && 'bg-accent/8',
                                  )}>
                                    <button
                                      type="button"
                                      onClick={() => handleSelect(child.id)}
                                      className="flex min-w-0 flex-1 items-center gap-2.5 py-2.5 pl-12 pr-3 text-left"
                                    >
                                      <span
                                        className="inline-flex size-6 shrink-0 items-center justify-center rounded-full"
                                        style={{ backgroundColor: child.color || '#64748b' }}
                                        aria-hidden="true"
                                      >
                                        <CategoryIcon icon={child.icon ?? 'tag'} className="size-3 text-white" />
                                      </span>
                                      <p className={cn('flex-1 truncate text-sm', childSelected && 'font-semibold text-accent')}>
                                        {child.name}
                                      </p>
                                      {childSelected && (
                                        <Check className="size-4 shrink-0 text-accent" strokeWidth={2.5} aria-hidden="true" />
                                      )}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => toggleFavorite(child.id)}
                                      className="flex size-9 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                                      aria-label={isFavorite(child.id) ? `Hapus ${child.name} dari favorit` : `Tambahkan ${child.name} ke favorit`}
                                    >
                                      <Star
                                        className={cn('size-3.5', isFavorite(child.id) && 'fill-accent text-accent')}
                                        strokeWidth={2}
                                        aria-hidden="true"
                                      />
                                    </button>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <EmptyCategoryState />
                )}
              </ListSection>
            )}
          </div>

          <div className="border-t border-border px-5 py-3">
            <Button type="button" variant="outline" className="w-full" onClick={() => setOpen(false)}>
              Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function ListSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{title}</p>
      {children}
    </section>
  )
}

// Flat row used for favorites, search results, and standalone (mandiri) categories
function FlatCategoryRow({
  category,
  categories,
  label,
  subLabel,
  selected,
  isFavorite,
  onSelect,
  onToggleFavorite,
}: {
  category: TransactionCategory
  categories: TransactionCategory[]
  label: string
  subLabel?: string
  selected: boolean
  isFavorite: boolean
  onSelect: () => void
  onToggleFavorite: () => void
}) {
  return (
    <div className={cn(
      'flex items-center overflow-hidden rounded-xl border bg-surface transition-colors',
      selected ? 'border-accent' : 'border-border',
    )}>
      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/40"
      >
        <span
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: category.color || '#64748b' }}
          aria-hidden="true"
        >
          <CategoryIcon icon={category.icon ?? 'tag'} className="size-4 text-white" />
        </span>
        <div className="min-w-0 flex-1">
          <p className={cn('truncate text-sm font-semibold', selected && 'text-accent')}>{label}</p>
          <p className="truncate text-xs text-muted-foreground">
            {subLabel ?? CATEGORY_TYPE_LABELS[category.type]}
          </p>
        </div>
        {selected && <Check className="size-4 shrink-0 text-accent" strokeWidth={2.5} aria-hidden="true" />}
      </button>
      <button
        type="button"
        onClick={onToggleFavorite}
        className="flex size-10 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label={isFavorite
          ? `Hapus ${formatCategoryLabel(category, categories)} dari favorit`
          : `Tambahkan ${formatCategoryLabel(category, categories)} ke favorit`}
      >
        <Star
          className={cn('size-4', isFavorite && 'fill-accent text-accent')}
          strokeWidth={2}
          aria-hidden="true"
        />
      </button>
    </div>
  )
}

function EmptyCategoryState() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-surface px-4 py-6 text-center text-sm text-muted-foreground">
      Tidak ada kategori yang cocok.
    </div>
  )
}
