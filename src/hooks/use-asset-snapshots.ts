'use client'

import useSWR from 'swr'
import type { AssetSnapshot, ApiResponse } from '@/domain/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useAssetSnapshots(months = 6) {
  const { data, error, isLoading } = useSWR<ApiResponse<AssetSnapshot[]>>(
    `/api/sheets/asset-snapshots?months=${months}`,
    fetcher,
    { refreshInterval: 30_000 },
  )
  return {
    snapshots: data?.ok ? data.data : [],
    isLoading,
    error: data?.ok === false ? data.error : (error?.message ?? null),
  }
}
