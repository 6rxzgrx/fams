'use client'

import useSWR from 'swr'
import useSWRMutation from 'swr/mutation'
import type { ApiResponse } from '@/domain/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

async function putFetcher(url: string, { arg }: { arg: { month: string; content: string } }) {
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(arg),
  })
  return res.json()
}

export function useReportNote(month: string) {
  const key = `/api/sheets/report-notes?month=${month}`
  const { data, error, isLoading, mutate } = useSWR<ApiResponse<{ month: string; content: string }>>(key, fetcher)
  return {
    content: data?.ok ? data.data.content : '',
    isLoading,
    error: data?.ok === false ? data.error : error?.message,
    mutate,
  }
}

export function useSaveReportNote() {
  return useSWRMutation('/api/sheets/report-notes', putFetcher)
}
