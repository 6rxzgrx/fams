'use client'

import useSWR from 'swr'
import useSWRMutation from 'swr/mutation'
import type {
  TransactionCategory,
  ApiResponse,
  CreateTransactionCategoryInput,
  UpdateTransactionCategoryInput,
} from '@/domain/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

async function postFetcher(url: string, { arg }: { arg: CreateTransactionCategoryInput }) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(arg),
  })
  return res.json()
}

async function patchFetcher(url: string, { arg }: { arg: { id: string; data: UpdateTransactionCategoryInput } }) {
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

export function useCategories() {
  const { data, error, isLoading, mutate } = useSWR<ApiResponse<TransactionCategory[]>>('/api/sheets/categories', fetcher)
  return {
    categories: data?.ok ? data.data : [],
    isLoading,
    error: data?.ok === false ? data.error : error?.message,
    mutate,
  }
}

export function useCreateCategory() {
  return useSWRMutation('/api/sheets/categories', postFetcher)
}

export function useUpdateCategory() {
  return useSWRMutation('/api/sheets/categories', patchFetcher)
}

export function useDeleteCategory() {
  return useSWRMutation('/api/sheets/categories', deleteFetcher)
}

export function useSeedCategories() {
  return useSWRMutation(
    '/api/sheets/categories/seed',
    (url: string) => fetch(url, { method: 'POST' }).then((r) => r.json()),
  )
}
