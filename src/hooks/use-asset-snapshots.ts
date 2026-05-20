'use client'

import useSWR from 'swr'
import useSWRMutation from 'swr/mutation'
import type { AssetSnapshot, ApiResponse } from '@/domain/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useAssetSnapshots(months = 6) {
  const { data, error, isLoading, mutate } = useSWR<ApiResponse<AssetSnapshot[]>>(
    `/api/sheets/asset-snapshots?months=${months}`,
    fetcher,
    { refreshInterval: 30_000 },
  )
  return {
    snapshots: data?.ok ? data.data : [],
    isLoading,
    error: data?.ok === false ? data.error : (error?.message ?? null),
    mutate,
  }
}

export function useTakeSnapshot() {
  return useSWRMutation(
    '/api/sheets/asset-snapshots',
    async (url: string, { arg }: { arg?: { month?: string } }) => {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(arg ?? {}),
      })
      return res.json() as Promise<ApiResponse<AssetSnapshot>>
    },
  )
}
