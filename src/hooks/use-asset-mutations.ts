'use client'

import useSWR from 'swr'
import type { AssetMutation, ApiResponse } from '@/domain/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useAssetMutations(assetId: string | null) {
  const url = assetId
    ? `/api/sheets/asset-mutations?asset_id=${assetId}`
    : '/api/sheets/asset-mutations'
  const { data, error, isLoading, mutate } = useSWR<ApiResponse<AssetMutation[]>>(url, fetcher)
  return {
    mutations: data?.ok ? data.data : [],
    isLoading,
    error: data?.ok === false ? data.error : error?.message,
    mutate,
  }
}
