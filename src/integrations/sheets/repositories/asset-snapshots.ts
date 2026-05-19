import { SheetRepository } from '../repository'
import type { AssetSnapshot } from '@/domain/types'

export class AssetSnapshotsRepository extends SheetRepository<AssetSnapshot> {
  constructor() {
    super('asset_snapshots')
  }

  async findByMonth(month: string): Promise<AssetSnapshot | null> {
    const all = await this.findAll()
    return all.find((s) => s.month === month) ?? null
  }

  async upsert(data: AssetSnapshot): Promise<AssetSnapshot> {
    const existing = await this.findByMonth(data.month)
    if (existing) {
      return (await this.update(existing.id, data as unknown as Record<string, unknown>)) as AssetSnapshot
    }
    return this.create(data as unknown as Record<string, unknown>) as Promise<AssetSnapshot>
  }

  async findRecent(months: number): Promise<AssetSnapshot[]> {
    const all = await this.findAll()
    return all
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-months)
  }
}

export const assetSnapshotsRepo = new AssetSnapshotsRepository()
