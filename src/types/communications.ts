/**
 * قراردادهای دامنهٔ ارتباطات — لاگ پیامک و لیدهای استعلام.
 */

export type SmsLogStatus = 'queued' | 'sent' | 'delivered' | 'failed'
export type SmsLogKind = 'transactional' | 'campaign' | 'otp'

export interface SmsLogEntry {
  id: string
  toPhone: string
  toName?: string
  message: string
  kind: SmsLogKind
  status: SmsLogStatus
  templateId?: string
  /** ISO */
  sentAt: string
  /** ISO — از سمت اپراتور */
  deliveredAt?: string
  errorReason?: string
}

export interface SmsTemplate {
  id: string
  name: string
  content: string
  variables: string[]
}

export type InquiryStatus = 'new' | 'in_progress' | 'contacted' | 'converted' | 'archived'
export type InquiryChannel = 'contact_form' | 'whatsapp' | 'phone' | 'email'

export interface Inquiry {
  id: string
  customerName: string
  phone: string
  email?: string
  channel: InquiryChannel
  productInterest?: string
  message: string
  status: InquiryStatus
  assignedTo?: string
  internalNote?: string
  /** ISO */
  receivedAt: string
  updatedAt: string
}
