import { getSheetsClient } from './client'
import { getRange, rowToObject, objectToRow, COLUMNS, columnToLetter } from './schema'
import type { TabName } from './schema'
import { env } from '@/lib/env'
import { logger } from '@/lib/logger'

export class SheetRepository<T extends Record<string, unknown>> {
  constructor(protected readonly tab: TabName) {}

  protected get spreadsheetId() {
    return env.GOOGLE_SHEETS_ID
  }

  async findAll(includeDeleted = false): Promise<T[]> {
    const sheets = await getSheetsClient()
    const range = getRange(this.tab, 2)

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range,
    })

    const rows = res.data.values ?? []
    const items = rows.map((row) => rowToObject<T>(this.tab, row))

    if (includeDeleted) return items
    return items.filter((item) => !(item as Record<string, unknown>).deleted_at)
  }

  async findById(id: string): Promise<T | null> {
    const all = await this.findAll(true)
    return all.find((item) => (item as Record<string, unknown>).id === id) ?? null
  }

  async findByField(field: string, value: string): Promise<T[]> {
    const all = await this.findAll()
    return all.filter((item) => (item as Record<string, unknown>)[field] === value)
  }

  async create(data: Record<string, unknown>): Promise<T> {
    const sheets = await getSheetsClient()
    const row = objectToRow(this.tab, data)

    await sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: `${this.tab}!A:A`,
      valueInputOption: 'RAW',
      requestBody: { values: [row] },
    })

    logger.info(`[${this.tab}] created`, { id: data.id })
    return data as T
  }

  async update(id: string, patch: Partial<Record<string, unknown>>): Promise<T | null> {
    const sheets = await getSheetsClient()
    const all = await this.findAll(true)
    const rowIndex = all.findIndex((item) => (item as Record<string, unknown>).id === id)
    if (rowIndex === -1) return null

    const current = all[rowIndex]
    const updated = { ...current, ...patch, updated_at: new Date().toISOString() }
    const row = objectToRow(this.tab, updated)

    const sheetRow = rowIndex + 2 // +1 for header, +1 for 1-indexing
    const lastCol = columnToLetter(COLUMNS[this.tab].length - 1)
    const range = `${this.tab}!A${sheetRow}:${lastCol}${sheetRow}`

    await sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range,
      valueInputOption: 'RAW',
      requestBody: { values: [row] },
    })

    logger.info(`[${this.tab}] updated`, { id })
    return updated as T
  }

  async softDelete(id: string): Promise<boolean> {
    const result = await this.update(id, { deleted_at: new Date().toISOString() })
    return !!result
  }
}
