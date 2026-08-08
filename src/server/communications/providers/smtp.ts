import 'server-only'

export const smtpMailProvider = {
  name: 'smtp' as const,

  async send(opts: { to: string; subject: string; body: string; template?: string }) {
    // TODO: فاز ۵ — اتصال به SMTP (Resend/Amazon SES/SendGrid)
    console.log('[SmtpMailProvider] not implemented yet', opts.to, opts.template)
    return { success: false, messageId: '', error: 'SMTP not configured' }
  },
}
