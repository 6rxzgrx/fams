'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'fams.favorite-account-ids'

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

export function useFavoriteAccountIds() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>(readFavoriteIds)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favoriteIds))
    } catch {}
  }, [favoriteIds])

  function toggleFavorite(accountId: string) {
    setFavoriteIds((current) =>
      current.includes(accountId)
        ? current.filter((item) => item !== accountId)
        : [accountId, ...current],
    )
  }

  return {
    favoriteIds,
    isFavorite: (accountId: string) => favoriteIds.includes(accountId),
    toggleFavorite,
  }
}
