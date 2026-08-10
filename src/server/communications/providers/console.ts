import 'server-only'
import { logger } from '@/server/shared/logger'

/**
 * Console Provider — فقط برای development
 *
 * در production، اگر SMTP تنظیم نشده باشد، این provider استفاده می‌شود
 * و PII (email, phone, body) را لاگ می‌کند که نقض حریم خصوصی است.
 *
 * پس در production، اگر SMTP تنظیم نشده باشد، fail می‌کنیم.
 */

export const consoleMailProvider = {
  name: 'console' as const,

  async send(opts: { to: string; subject: string; body: string; template?: string }) {
    // ── Security: در production، PII لاگ نکن ──
    if (process.env.NODE_ENV === 'production') {
      logger.error(
        { to: opts.to, template: opts.template },
        '[ConsoleMailProvider] SMTP not configured in production! Email sending blocked.'
      )
      return {
        success: false,
        messageId: '',
        error: 'SMTP provider not configured in production',
      }
    }

    // ── Development: لاگ کامل ──
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
    // ── Security: در production، PII لاگ نکن ──
    if (process.env.NODE_ENV === 'production') {
      logger.error(
        { to: opts.to, template: opts.template },
        '[ConsoleSmsProvider] SMS provider not configured in production! SMS sending blocked.'
      )
      return {
        success: false,
        messageId: '',
        error: 'SMS provider not configured in production',
      }
    }

    // ── Development: لاگ کامل ──
    logger.info('[ConsoleSmsProvider] ─────────────────────────')
    logger.info(`To: ${opts.to}`)
    logger.info(`Template: ${opts.template || 'none'}`)
    logger.info('Body:')
    logger.info(opts.body)
    logger.info('─────────────────────────────────────────────')
    return { success: true, messageId: `console-sms-${Date.now()}`, error: undefined }
  },
}
