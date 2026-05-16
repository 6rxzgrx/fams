'use client'

import useSWR from 'swr'
import useSWRMutation from 'swr/mutation'
import type { Reminder, CreateReminderInput, UpdateReminderInput, ApiResponse } from '@/domain/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

async function postFetcher(url: string, { arg }: { arg: CreateReminderInput }) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(arg),
  })
  return res.json()
}

async function patchFetcher(
  url: string,
  { arg }: { arg: { id: string; data: UpdateReminderInput } },
) {
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

export function useReminders(done?: boolean) {
  const query = new URLSearchParams()
  if (done !== undefined) query.set('done', String(done))

  const key = `/api/sheets/reminders?${query}`
  const { data, error, isLoading, mutate } = useSWR<ApiResponse<Reminder[]>>(key, fetcher)

  return {
    reminders: data?.ok ? data.data : [],
    isLoading,
    error: data?.ok === false ? data.error : error?.message,
    mutate,
  }
}

export function useCreateReminder() {
  return useSWRMutation('/api/sheets/reminders', postFetcher)
}

export function useUpdateReminder() {
  return useSWRMutation('/api/sheets/reminders', patchFetcher)
}

export function useDeleteReminder() {
  return useSWRMutation('/api/sheets/reminders', deleteFetcher)
}
