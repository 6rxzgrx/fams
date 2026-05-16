'use client'

import useSWR from 'swr'
import useSWRMutation from 'swr/mutation'
import type { Budget, ApiResponse, CreateBudgetInput, UpdateBudgetInput } from '@/domain/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

async function postFetcher(url: string, { arg }: { arg: CreateBudgetInput }) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(arg),
  })
  return res.json()
}

async function patchFetcher(url: string, { arg }: { arg: { id: string; data: UpdateBudgetInput } }) {
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

export function useBudgets(month: string) {
  const { data, error, isLoading, mutate } = useSWR<ApiResponse<Budget[]>>(
    `/api/sheets/budgets?month=${month}`,
    fetcher,
  )
  return {
    budgets: data?.ok ? data.data : [],
    isLoading,
    error: data?.ok === false ? data.error : error?.message,
    mutate,
  }
}

export function useCreateBudget() {
  return useSWRMutation('/api/sheets/budgets', postFetcher)
}

export function useUpdateBudget() {
  return useSWRMutation('/api/sheets/budgets', patchFetcher)
}

export function useDeleteBudget() {
  return useSWRMutation('/api/sheets/budgets', deleteFetcher)
}
