import { google } from 'googleapis'
import { env } from '@/lib/env'

function createAuth() {
  const privateKey = env.GOOGLE_SA_PRIVATE_KEY.replace(/\\n/g, '\n')
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: env.GOOGLE_SA_EMAIL,
      private_key: privateKey,
    },
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/calendar',
    ],
  })
}

let _auth: ReturnType<typeof createAuth> | null = null

export function getSheetsAuth() {
  if (!_auth) _auth = createAuth()
  return _auth
}

export async function getSheetsClient() {
  const auth = getSheetsAuth()
  return google.sheets({ version: 'v4', auth })
}

export async function getDriveClient() {
  const auth = getSheetsAuth()
  return google.drive({ version: 'v3', auth })
}

export async function getCalendarClient() {
  const auth = getSheetsAuth()
  return google.calendar({ version: 'v3', auth })
}
