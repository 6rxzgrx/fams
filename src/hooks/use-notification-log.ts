'use client'

import useSWR from 'swr'
import type { NotificationLog, ApiResponse } from '@/domain/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useNotificationLog() {
  const { data, error, isLoading, mutate } = useSWR<ApiResponse<NotificationLog[]>>(
    '/api/notifications/log',
    fetcher,
    { refreshInterval: 60_000 },
  )

  return {
    logs: data?.ok ? data.data : [],
    isLoading,
    error: data?.ok === false ? data.error : error?.message,
    mutate,
  }
}
