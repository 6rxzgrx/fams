'use client'

import useSWR from 'swr'
import useSWRMutation from 'swr/mutation'
import type {
  Asset,
  ApiResponse,
  CreateAssetInput,
  UpdateAssetInput,
  CreateTransferInput,
} from '@/domain/types'

// Backward-compat aliases so existing callers don't need to change
export type Account = Asset
export type CreateAccountInput = CreateAssetInput
export type UpdateAccountInput = UpdateAssetInput

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

async function transferFetcher(url: string, { arg }: { arg: CreateTransferInput }) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(arg),
  })
  return res.json()
}

export function useAccounts() {
  const { data, error, isLoading, mutate } = useSWR<ApiResponse<Asset[]>>('/api/sheets/accounts', fetcher)
  return {
    accounts: data?.ok ? data.data : [],
    isLoading,
    error: data?.ok === false ? data.error : error?.message,
    mutate,
  }
}

export function useCreateAccount() {
  return useSWRMutation('/api/sheets/accounts', postFetcher)
}

export function useUpdateAccount() {
  return useSWRMutation('/api/sheets/accounts', patchFetcher)
}

export function useDeleteAccount() {
  return useSWRMutation('/api/sheets/accounts', deleteFetcher)
}

export function useCreateTransfer() {
  return useSWRMutation('/api/sheets/transactions/transfer', transferFetcher)
}

async function moveBalanceFetcher(url: string, { arg }: { arg: { from_id: string; to_id: string; amount: number; date?: string; description?: string } }) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(arg),
  })
  return res.json()
}

export function useMoveBalance() {
  return useSWRMutation('/api/sheets/accounts/move', moveBalanceFetcher)
}
