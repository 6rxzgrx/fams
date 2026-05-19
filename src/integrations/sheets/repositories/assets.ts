import { SheetRepository } from '../repository'
import type { Asset } from '@/domain/types'

export class AssetsRepository extends SheetRepository<Asset> {
  constructor() {
    super('assets')
  }

  async applyBalanceDelta(id: string, delta: number): Promise<void> {
    if (delta === 0) return
    const asset = await this.findById(id)
    if (!asset) return
    const current = parseInt(asset.current_balance, 10) || 0
    await this.update(id, { current_balance: String(current + delta) })
  }
}

export const assetsRepo = new AssetsRepository()
