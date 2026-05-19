// Thin wrapper over assetsRepo — filters to kind='liquid'.
// All existing callers (transactions, bills, cron, Telegram bot) remain unchanged.
import { assetsRepo } from './assets'
import type { Asset } from '@/domain/types'

class AccountsRepository {
  async findAll(): Promise<Asset[]> {
    const all = await assetsRepo.findAll()
    return all.filter((a) => a.kind === 'liquid')
  }

  async findById(id: string): Promise<Asset | null> {
    const asset = await assetsRepo.findById(id)
    if (!asset || asset.kind !== 'liquid') return null
    return asset
  }

  async findByField(field: string, value: string): Promise<Asset[]> {
    const results = await assetsRepo.findByField(field, value)
    return results.filter((a) => a.kind === 'liquid')
  }

  async create(data: Asset): Promise<Asset> {
    return assetsRepo.create({ ...data, kind: 'liquid' })
  }

  async update(id: string, data: Partial<Asset>): Promise<Asset | null> {
    return assetsRepo.update(id, data)
  }

  async softDelete(id: string): Promise<boolean> {
    return assetsRepo.softDelete(id)
  }

  async applyBalanceDelta(id: string, delta: number): Promise<void> {
    await assetsRepo.applyBalanceDelta(id, delta)
  }
}

export const accountsRepo = new AccountsRepository()
