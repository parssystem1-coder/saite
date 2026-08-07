import { beforeEach, describe, expect, it } from 'vitest'
import {
  createMockCommunicationsAdapter,
  extractTemplateVariables,
} from '@/lib/communications/mock-adapter'

describe('extractTemplateVariables', () => {
  it('متغیرها را استخراج می‌کند', () => {
    expect(extractTemplateVariables('کد: {{code}}')).toEqual(['code'])
    expect(
      extractTemplateVariables('سفارش {{orderId}} با کد {{trackingCode}}')
    ).toEqual(['orderId', 'trackingCode'])
  })

  it('تکراری‌ها را حذف می‌کند', () => {
    expect(
      extractTemplateVariables('{{a}} و باز {{a}} با {{b}}')
    ).toEqual(['a', 'b'])
  })

  it('روی متن بدون متغیر آرایه خالی می‌دهد', () => {
    expect(extractTemplateVariables('متن ساده')).toEqual([])
  })
})

describe('inquiries adapter', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('تغییر وضعیت درخواست ذخیره می‌شود', () => {
    const adapter = createMockCommunicationsAdapter()
    const initial = adapter.listInquiries()
    const first = initial[0]!
    const after = adapter.saveInquiry({ ...first, status: 'converted' })
    expect(after.find((i) => i.id === first.id)?.status).toBe('converted')
  })
})
