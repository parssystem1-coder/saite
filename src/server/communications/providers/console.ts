import 'server-only'

export const consoleMailProvider = {
  name: 'console' as const,

  async send(opts: { to: string; subject: string; body: string; template?: string }) {
    console.log('[ConsoleMailProvider] ──────────────────────────')
    console.log(`To: ${opts.to}`)
    console.log(`Subject: ${opts.subject}`)
    console.log(`Template: ${opts.template || 'none'}`)
    console.log('Body:')
    console.log(opts.body)
    console.log('─────────────────────────────────────────────')
    return { success: true, messageId: `console-${Date.now()}`, error: undefined }
  },
}

export const consoleSmsProvider = {
  name: 'console' as const,

  async send(opts: { to: string; body: string; template?: string }) {
    console.log('[ConsoleSmsProvider] ─────────────────────────')
    console.log(`To: ${opts.to}`)
    console.log(`Template: ${opts.template || 'none'}`)
    console.log('Body:')
    console.log(opts.body)
    console.log('─────────────────────────────────────────────')
    return { success: true, messageId: `console-sms-${Date.now()}`, error: undefined }
  },
}
