'use client'

import useSWR from 'swr'
import useSWRMutation from 'swr/mutation'
import type { Asset, ApiResponse, CreateAssetInput, UpdateAssetInput } from '@/domain/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

async function postFetcher(url: string, { arg }: { arg: CreateAssetInput }) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(arg),
  })
  return res.json()
}

async function patchFetcher(url: string, { arg }: { arg: { id: string; data: UpdateAssetInput } }) {
  const res = await fetch(`${url}/${arg.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(arg.data),
  })
  return res.json()
}

async function deleteFetcher(url: string, { arg }: { arg: string }) {
  const res = await fetch(`${url}/${arg}`, { method: 'DELETE' })
  return res.json()
}

export function useAssets() {
  const { data, error, isLoading, mutate } = useSWR<ApiResponse<Asset[]>>('/api/sheets/assets', fetcher)
  return {
    assets: data?.ok ? data.data : [],
    isLoading,
    error: data?.ok === false ? data.error : error?.message,
    mutate,
  }
}

export function useCreateAsset() {
  return useSWRMutation('/api/sheets/assets', postFetcher)
}

export function useUpdateAsset() {
  return useSWRMutation('/api/sheets/assets', patchFetcher)
}

export function useDeleteAsset() {
  return useSWRMutation('/api/sheets/assets', deleteFetcher)
}
