'use client'

import useSWR from 'swr'
import type { ApiResponse } from '@/domain/types'
import type { MutasiLogEntry } from '@/app/api/sheets/asset-mutations/log/route'

export type { MutasiLogEntry }

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useAssetMutationLog(month: string | null) {
  const url = `/api/sheets/asset-mutations/log${month ? `?month=${month}` : ''}`
  const { data, error, isLoading, mutate } = useSWR<ApiResponse<MutasiLogEntry[]>>(url, fetcher)
  return {
    entries: data?.ok ? data.data : [],
    isLoading,
    error: data?.ok === false ? data.error : error?.message,
    mutate,
  }
}
