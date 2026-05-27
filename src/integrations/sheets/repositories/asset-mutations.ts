import { SheetRepository } from '../repository'
import type { AssetMutation } from '@/domain/types'

export class AssetMutationsRepository extends SheetRepository<AssetMutation> {
  constructor() {
    super('asset_mutations')
  }

  async findByAssetId(assetId: string): Promise<AssetMutation[]> {
    const all = await this.findAll()
    return all
      .filter((m) => m.asset_id === assetId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  }
}

export const assetMutationsRepo = new AssetMutationsRepository()
