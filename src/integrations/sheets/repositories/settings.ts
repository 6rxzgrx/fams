import { getSheetsClient } from '../client'
import { env } from '@/lib/env'

export class SettingsRepository {
  private get spreadsheetId() {
    return env.GOOGLE_SHEETS_ID
  }

  async get(key: string): Promise<string | null> {
    const sheets = await getSheetsClient()
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: 'settings!A:B',
    })
    const rows = res.data.values ?? []
    const row = rows.find((r) => r[0] === key)
    return row ? row[1] ?? null : null
  }

  async set(key: string, value: string): Promise<void> {
    const sheets = await getSheetsClient()
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: 'settings!A:A',
    })
    const rows = res.data.values ?? []
    const rowIndex = rows.findIndex((r) => r[0] === key)
    const now = new Date().toISOString()

    if (rowIndex === -1) {
      await sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'settings!A:A',
        valueInputOption: 'RAW',
        requestBody: { values: [[key, value, now]] },
      })
    } else {
      const sheetRow = rowIndex + 1
      await sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `settings!A${sheetRow}:C${sheetRow}`,
        valueInputOption: 'RAW',
        requestBody: { values: [[key, value, now]] },
      })
    }
  }
}

export const settingsRepo = new SettingsRepository()
