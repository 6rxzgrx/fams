'use client'

import useSWR, { useSWRConfig } from 'swr'
import type { PriceRate, CreatePriceRateInput, UpdatePriceRateInput, ApiResponse } from '@/domain/types'

const KEY = '/api/sheets/price-rates'

async function fetcher(url: string): Promise<PriceRate[]> {
  const res = await fetch(url)
  const json: ApiResponse<PriceRate[]> = await res.json()
  if (!json.ok) throw new Error(json.error)
  return json.data
}

export function usePriceRates() {
  const { data, error, isLoading, mutate } = useSWR<PriceRate[]>(KEY, fetcher, {
    dedupingInterval: 60 * 60 * 1000, // 1 hour — server handles staleness check
    revalidateOnFocus: false,
  })

  const { mutate: globalMutate } = useSWRConfig()

  async function createRate(input: CreatePriceRateInput): Promise<void> {
    const res = await fetch(KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    const json: ApiResponse<PriceRate> = await res.json()
    if (!json.ok) throw new Error(json.error)
    await mutate()
  }

  async function updateRate(id: string, input: UpdatePriceRateInput): Promise<void> {
    const res = await fetch(`${KEY}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    const json: ApiResponse<PriceRate> = await res.json()
    if (!json.ok) throw new Error(json.error)
    await mutate()
  }

  async function deleteRate(id: string): Promise<void> {
    const res = await fetch(`${KEY}/${id}`, { method: 'DELETE' })
    const json: ApiResponse<{ id: string }> = await res.json()
    if (!json.ok) throw new Error(json.error)
    await mutate()
  }

  async function forceRefresh(): Promise<void> {
    await globalMutate(KEY, undefined, { revalidate: true })
  }

  return {
    rates: data ?? [],
    isLoading,
    error: error?.message ?? null,
    createRate,
    updateRate,
    deleteRate,
    forceRefresh,
    mutate,
  }
}
