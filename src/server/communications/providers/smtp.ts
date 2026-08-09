import 'server-only'
import { logger } from '@/server/shared/logger'

export const smtpMailProvider = {
  name: 'smtp' as const,

  async send(opts: { to: string; subject: string; body: string; template?: string }) {
    // TODO: فاز ۵ — اتصال به SMTP (Resend/Amazon SES/SendGrid)
    logger.info({ to: opts.to, template: opts.template }, '[SmtpMailProvider] not implemented yet')
    return { success: false, messageId: '', error: 'SMTP not configured' }
  },
}
