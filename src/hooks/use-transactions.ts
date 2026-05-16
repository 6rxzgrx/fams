'use client'

import useSWR from 'swr'
import useSWRMutation from 'swr/mutation'
import type { Transaction, CreateTransactionInput, UpdateTransactionInput, ApiResponse } from '@/domain/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

async function postFetcher(url: string, { arg }: { arg: CreateTransactionInput }) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(arg),
  })
  return res.json()
}

async function patchFetcher(url: string, { arg }: { arg: { id: string; data: UpdateTransactionInput } }) {
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

export function useTransactions(params?: { account_id?: string; from?: string; to?: string; limit?: number }) {
  const query = new URLSearchParams()
  if (params?.account_id) query.set('account_id', params.account_id)
  if (params?.from) query.set('from', params.from)
  if (params?.to) query.set('to', params.to)
  if (params?.limit) query.set('limit', String(params.limit))

  const key = `/api/sheets/transactions?${query}`

  const { data, error, isLoading, mutate } = useSWR<ApiResponse<Transaction[]>>(key, fetcher)

  return {
    transactions: data?.ok ? data.data : [],
    isLoading,
    error: data?.ok === false ? data.error : error?.message,
    mutate,
  }
}

export function useCreateTransaction() {
  return useSWRMutation('/api/sheets/transactions', postFetcher)
}

export function useUpdateTransaction() {
  return useSWRMutation('/api/sheets/transactions', patchFetcher)
}

export function useDeleteTransaction() {
  return useSWRMutation('/api/sheets/transactions', deleteFetcher)
}
