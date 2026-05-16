type Level = 'info' | 'warn' | 'error' | 'debug'

function log(level: Level, msg: string, data?: unknown) {
  const ts = new Date().toISOString()
  const line = data ? `[${ts}] ${level.toUpperCase()} ${msg} ${JSON.stringify(data)}` : `[${ts}] ${level.toUpperCase()} ${msg}`
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.log(line)
}

export const logger = {
  info: (msg: string, data?: unknown) => log('info', msg, data),
  warn: (msg: string, data?: unknown) => log('warn', msg, data),
  error: (msg: string, data?: unknown) => log('error', msg, data),
  debug: (msg: string, data?: unknown) => {
    if (process.env.NODE_ENV === 'development') log('debug', msg, data)
  },
}
