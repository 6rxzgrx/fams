'use client'

import useSWR from 'swr'
import useSWRMutation from 'swr/mutation'
import type {
  Bill,
  BillPayment,
  ApiResponse,
  CreateBillInput,
  UpdateBillInput,
  CreateBillPaymentInput,
} from '@/domain/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

async function postBillFetcher(url: string, { arg }: { arg: CreateBillInput }) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(arg),
  })
  return res.json()
}

async function patchBillFetcher(
  url: string,
  { arg }: { arg: { id: string; data: UpdateBillInput } },
) {
  const res = await fetch(`${url}/${arg.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(arg.data),
  })
  return res.json()
}

async function deleteBillFetcher(url: string, { arg }: { arg: string }) {
  const res = await fetch(`${url}/${arg}`, { method: 'DELETE' })
  return res.json()
}

async function payBillFetcher(
  url: string,
  { arg }: { arg: { id: string } & CreateBillPaymentInput },
) {
  const { id, ...data } = arg
  const res = await fetch(`${url}/${id}/pay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return res.json()
}

export function useBills() {
  const { data, error, isLoading, mutate } = useSWR<ApiResponse<Bill[]>>(
    '/api/sheets/bills',
    fetcher,
  )
  return {
    bills: data?.ok ? data.data : [],
    isLoading,
    error: data?.ok === false ? data.error : error?.message,
    mutate,
  }
}

export function useBillPayments(month: string) {
  const { data, error, isLoading, mutate } = useSWR<ApiResponse<BillPayment[]>>(
    `/api/sheets/bill-payments?month=${month}`,
    fetcher,
  )
  return {
    payments: data?.ok ? data.data : [],
    isLoading,
    error: data?.ok === false ? data.error : error?.message,
    mutate,
  }
}

export function useCreateBill() {
  return useSWRMutation('/api/sheets/bills', postBillFetcher)
}

export function useUpdateBill() {
  return useSWRMutation('/api/sheets/bills', patchBillFetcher)
}

export function useDeleteBill() {
  return useSWRMutation('/api/sheets/bills', deleteBillFetcher)
}

export function usePayBill() {
  return useSWRMutation('/api/sheets/bills', payBillFetcher)
}
