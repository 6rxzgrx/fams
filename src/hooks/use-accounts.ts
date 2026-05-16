'use client'

import useSWR from 'swr'
import useSWRMutation from 'swr/mutation'
import type {
  Account,
  ApiResponse,
  CreateAccountInput,
  UpdateAccountInput,
  CreateTransferInput,
} from '@/domain/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

async function postFetcher(url: string, { arg }: { arg: CreateAccountInput }) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(arg),
  })
  return res.json()
}

async function patchFetcher(url: string, { arg }: { arg: { id: string; data: UpdateAccountInput } }) {
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
  const { data, error, isLoading, mutate } = useSWR<ApiResponse<Account[]>>('/api/sheets/accounts', fetcher)
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
