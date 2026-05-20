'use client'

import useSWR from 'swr'
import useSWRMutation from 'swr/mutation'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export interface ReportInsightSummary {
  month_label: string
  income: number
  expense: number
  net: number
  savings_rate: number
  transaction_count: number
  top_expense_categories: { name: string; amount: number }[]
  biggest_expense_day: { date: string; amount: number } | null
  spending_streak: number
  trend: { label: string; income: number; expense: number }[]
}

async function postFetcher(
  url: string,
  { arg }: { arg: { month: string; summary: ReportInsightSummary } },
) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(arg),
  })
  return res.json()
}

export function useReportInsight(month: string) {
  const key = `/api/ai/report-insight?month=${month}`
  const { data, isLoading, mutate } = useSWR(key, fetcher)
  return {
    insight: data?.ok ? (data.data.insight as string) : '',
    generatedAt: data?.ok ? (data.data.generated_at as string) : '',
    isLoading,
    mutate,
  }
}

export function useGenerateReportInsight() {
  return useSWRMutation('/api/ai/report-insight', postFetcher)
}
