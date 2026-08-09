import 'server-only'
import { logger } from '@/server/shared/logger'

export const consoleMailProvider = {
  name: 'console' as const,

  async send(opts: { to: string; subject: string; body: string; template?: string }) {
    logger.info('[ConsoleMailProvider] ──────────────────────────')
    logger.info(`To: ${opts.to}`)
    logger.info(`Subject: ${opts.subject}`)
    logger.info(`Template: ${opts.template || 'none'}`)
    logger.info('Body:')
    logger.info(opts.body)
    logger.info('─────────────────────────────────────────────')
    return { success: true, messageId: `console-${Date.now()}`, error: undefined }
  },
}

export const consoleSmsProvider = {
  name: 'console' as const,

  async send(opts: { to: string; body: string; template?: string }) {
    logger.info('[ConsoleSmsProvider] ─────────────────────────')
    logger.info(`To: ${opts.to}`)
    logger.info(`Template: ${opts.template || 'none'}`)
    logger.info('Body:')
    logger.info(opts.body)
    logger.info('─────────────────────────────────────────────')
    return { success: true, messageId: `console-sms-${Date.now()}`, error: undefined }
  },
}
