import 'server-only'
import { commsRepository } from './repository'
import { consoleMailProvider, consoleSmsProvider } from './providers/console'
import { smtpMailProvider } from './providers/smtp'

const mailProvider = process.env.SMTP_HOST ? smtpMailProvider : consoleMailProvider
const smsProvider = consoleSmsProvider // فاز ۱: فقط console

export const commsService = {
  async sendEmail(opts: {
    to: string
    subject: string
    body: string
    template?: string
  }) {
    const result = await mailProvider.send(opts)
    await commsRepository.logEmail({
      ...opts,
      provider: mailProvider.name,
      status: result.success ? 'sent' : 'failed',
      error: result.error,
      sentAt: result.success ? new Date() : undefined,
    })
    return result
  },

  async sendSms(opts: {
    to: string
    body: string
    template?: string
  }) {
    const result = await smsProvider.send(opts)
    await commsRepository.logSms({
      ...opts,
      provider: smsProvider.name,
      status: result.success ? 'sent' : 'failed',
      error: result.error,
      sentAt: result.success ? new Date() : undefined,
    })
    return result
  },

  async sendOrderConfirmation(opts: { to: string; orderId: string; totalAmount: number }) {
    return this.sendEmail({
      to: opts.to,
      subject: `تأیید سفارش #${opts.orderId}`,
      body: `سفارش شما با شماره ${opts.orderId} به مبلغ ${opts.totalAmount} ریال ثبت شد.`,
      template: 'order_confirmation',
    })
  },

  async sendInvoiceNotification(opts: { to: string; invoiceNumber: string; amount: number }) {
    return this.sendEmail({
      to: opts.to,
      subject: `فاکتور ${opts.invoiceNumber}`,
      body: `فاکتور شما به مبلغ ${opts.amount} ریال صادر شد.`,
      template: 'invoice_notification',
    })
  },

  async sendShipmentUpdate(opts: { to: string; orderId: string; status: string; trackingNumber?: string | null }) {
    return this.sendEmail({
      to: opts.to,
      subject: `به‌روزرسانی ارسال سفارش #${opts.orderId}`,
      body: `وضعیت ارسال: ${opts.status}\nکد رهگیری: ${opts.trackingNumber || 'ندارد'}`,
      template: 'shipment_update',
    })
  },

  async listEmailLogs(opts: Parameters<typeof commsRepository.listEmailLogs>[0]) {
    return commsRepository.listEmailLogs(opts)
  },

  async listSmsLogs(opts: Parameters<typeof commsRepository.listSmsLogs>[0]) {
    return commsRepository.listSmsLogs(opts)
  },
}
