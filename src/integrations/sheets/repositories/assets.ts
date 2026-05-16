import { SheetRepository } from '../repository'
import type { Asset } from '@/domain/types'

export class AssetsRepository extends SheetRepository<Asset> {
  constructor() {
    super('assets')
  }
}

export const assetsRepo = new AssetsRepository()
