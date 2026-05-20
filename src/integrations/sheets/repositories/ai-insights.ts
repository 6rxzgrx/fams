import { SheetRepository } from '../repository'
import { generateId } from '@/lib/ulid'

export type AiInsight = {
  id: string
  month: string
  insight: string
  model: string
  generated_by: string
  generated_at: string
  [key: string]: unknown
}

export class AiInsightsRepository extends SheetRepository<AiInsight> {
  constructor() {
    super('ai_insights')
  }

  async findByMonth(month: string): Promise<AiInsight | null> {
    const all = await this.findAll()
    return all.filter((r) => r.month === month).sort((a, b) =>
      b.generated_at.localeCompare(a.generated_at),
    )[0] ?? null
  }

  async upsert(month: string, data: Omit<AiInsight, 'id'>): Promise<AiInsight> {
    const existing = await this.findByMonth(month)
    if (existing) {
      return (await this.update(existing.id, data)) as AiInsight
    }
    return this.create({ id: generateId('ai_insight'), ...data }) as Promise<AiInsight>
  }
}

export const aiInsightsRepo = new AiInsightsRepository()
