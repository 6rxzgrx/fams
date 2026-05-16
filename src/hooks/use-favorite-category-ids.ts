'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'fams.favorite-category-ids'

function readFavoriteIds() {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []

    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []

    return parsed.filter((value): value is string => typeof value === 'string')
  } catch {
    return []
  }
}

export function useFavoriteCategoryIds() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>(readFavoriteIds)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favoriteIds))
    } catch {
      // Ignore localStorage failures and keep the UI usable.
    }
  }, [favoriteIds])

  function toggleFavorite(categoryId: string) {
    setFavoriteIds((current) => (
      current.includes(categoryId)
        ? current.filter((item) => item !== categoryId)
        : [categoryId, ...current].slice(0, 12)
    ))
  }

  return {
    favoriteIds,
    isFavorite: (categoryId: string) => favoriteIds.includes(categoryId),
    toggleFavorite,
  }
}
