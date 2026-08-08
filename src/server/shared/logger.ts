import 'server-only'
import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  base: { pid: process.pid },
})

export function childLogger(bindings: Record<string, unknown>) {
  return logger.child(bindings)
}
