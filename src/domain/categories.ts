import type { CategoryType, TransactionCategory } from '@/domain/types'

export const CATEGORY_TYPE_LABELS: Record<CategoryType, string> = {
  expense: 'Pengeluaran',
  income: 'Pemasukan',
  transfer: 'Transfer',
}

export interface CategoryBranch {
  parent: TransactionCategory
  children: TransactionCategory[]
}

function normalize(text: string) {
  return text.trim().toLocaleLowerCase('id-ID')
}

export function sortCategoriesByName<T extends { name: string }>(categories: T[]) {
  return [...categories].sort((left, right) => left.name.localeCompare(right.name, 'id-ID'))
}

export function buildCategoryMaps(categories: TransactionCategory[]) {
  const byId = new Map(categories.map((category) => [category.id, category]))
  const childrenByParentId = new Map<string, TransactionCategory[]>()

  for (const category of categories) {
    if (!category.parent_id) continue
    const children = childrenByParentId.get(category.parent_id) ?? []
    children.push(category)
    childrenByParentId.set(category.parent_id, children)
  }

  for (const [parentId, children] of childrenByParentId.entries()) {
    childrenByParentId.set(parentId, sortCategoriesByName(children))
  }

  return { byId, childrenByParentId }
}

export function getCategoryChildren(categories: TransactionCategory[], categoryId: string) {
  return buildCategoryMaps(categories).childrenByParentId.get(categoryId) ?? []
}

export function hasCategoryChildren(categories: TransactionCategory[], categoryId: string) {
  return getCategoryChildren(categories, categoryId).length > 0
}

export function getRootCategories(categories: TransactionCategory[], type?: CategoryType) {
  return sortCategoriesByName(
    categories.filter((category) => category.parent_id === '' && (!type || category.type === type))
  )
}

export function getCategoryBranches(categories: TransactionCategory[], type: CategoryType): CategoryBranch[] {
  const { childrenByParentId } = buildCategoryMaps(categories)

  return getRootCategories(categories, type).map((parent) => ({
    parent,
    children: childrenByParentId.get(parent.id) ?? [],
  }))
}

export function isLeafCategory(category: TransactionCategory, categories: TransactionCategory[]) {
  return !hasCategoryChildren(categories, category.id)
}

export function isSelectableCategory(category: TransactionCategory, categories: TransactionCategory[]) {
  return isLeafCategory(category, categories)
}

export function getSelectableCategories(categories: TransactionCategory[], type?: CategoryType) {
  return sortCategoriesByName(
    categories.filter((category) => {
      if (type && category.type !== type) return false
      return isSelectableCategory(category, categories)
    })
  )
}

export function getCategoryPath(category: TransactionCategory, categories: TransactionCategory[]) {
  const { byId } = buildCategoryMaps(categories)
  const parent = category.parent_id ? byId.get(category.parent_id) : undefined
  return parent ? [parent, category] : [category]
}

export function formatCategoryLabel(category: TransactionCategory, categories: TransactionCategory[]) {
  return getCategoryPath(category, categories).map((item) => item.name).join(' • ')
}

export function searchSelectableCategories(
  categories: TransactionCategory[],
  query: string,
  type: CategoryType,
) {
  const normalizedQuery = normalize(query)

  if (!normalizedQuery) {
    return getSelectableCategories(categories, type)
  }

  return getSelectableCategories(categories, type).filter((category) => {
    const path = getCategoryPath(category, categories)
    const haystack = [
      category.name,
      ...path.map((item) => item.name),
      formatCategoryLabel(category, categories),
    ]
      .join(' ')
      .toLocaleLowerCase('id-ID')

    return haystack.includes(normalizedQuery)
  })
}

export function getCategoryTypeFromId(categories: TransactionCategory[], categoryId: string) {
  return categories.find((category) => category.id === categoryId)?.type
}

export function getAvailableParentCategories(
  categories: TransactionCategory[],
  type: CategoryType,
  currentCategoryId?: string,
) {
  if (type === 'transfer') return []

  return getRootCategories(categories, type).filter((category) => category.id !== currentCategoryId)
}

export function validateCategoryHierarchy(
  categories: TransactionCategory[],
  input: Pick<TransactionCategory, 'type' | 'parent_id'>,
  currentCategoryId?: string,
) {
  const { byId, childrenByParentId } = buildCategoryMaps(categories)
  const currentChildren = currentCategoryId ? childrenByParentId.get(currentCategoryId) ?? [] : []

  if (input.type === 'transfer' && input.parent_id) {
    return 'Kategori transfer tidak bisa punya induk.'
  }

  if (currentChildren.length > 0 && input.parent_id) {
    return 'Kategori yang sudah punya turunan tidak bisa dijadikan anak kategori lain.'
  }

  if (currentChildren.length > 0 && currentChildren.some((child) => child.type !== input.type)) {
    return 'Jenis kategori induk harus sama dengan semua turunannya.'
  }

  if (!input.parent_id) {
    if (input.type === 'transfer' && currentChildren.length > 0) {
      return 'Kategori transfer tidak bisa punya turunan.'
    }
    return null
  }

  const parent = byId.get(input.parent_id)
  if (!parent) {
    return 'Induk kategori tidak ditemukan.'
  }

  if (currentCategoryId && parent.id === currentCategoryId) {
    return 'Kategori tidak bisa menjadi induk untuk dirinya sendiri.'
  }

  if (parent.parent_id) {
    return 'Induk kategori harus berada di level pertama.'
  }

  if (parent.type !== input.type) {
    return 'Jenis kategori harus sama dengan induknya.'
  }

  if (parent.type === 'transfer') {
    return 'Kategori transfer tidak bisa punya turunan.'
  }

  return null
}

export function validateFinalCategorySelection(
  categories: TransactionCategory[],
  categoryId: string,
  expectedType?: CategoryType,
) {
  const category = categories.find((item) => item.id === categoryId)

  if (!category) {
    return { category: null, error: 'Kategori tidak ditemukan.' }
  }

  if (expectedType && category.type !== expectedType) {
    return { category: null, error: 'Kategori tidak cocok dengan jenis transaksi.' }
  }

  if (!isSelectableCategory(category, categories)) {
    return { category: null, error: 'Pilih kategori akhir, bukan kategori induk.' }
  }

  return { category, error: null }
}
