import { beforeEach, describe, expect, it } from 'vitest'
import {
  generateOrderRef,
  isValidOrderRef,
  PAYMENT_METHOD_LABELS,
  readLastOrder,
  readLastOrderRef,
  saveLastOrder,
  type LastOrder,
} from '@/lib/checkout/last-order'

const sample: LastOrder = {
  ref: '123456',
  receiverName: 'رضا کریمی',
  itemCount: 3,
  total: 12_500_000,
  paymentMethod: 'online',
}

beforeEach(() => {
  sessionStorage.clear()
})

describe('isValidOrderRef', () => {
  it('فقط ۶ رقم را می‌پذیرد', () => {
    expect(isValidOrderRef('123456')).toBe(true)
    expect(isValidOrderRef('12345')).toBe(false)
    expect(isValidOrderRef('1234567')).toBe(false)
    expect(isValidOrderRef('abcdef')).toBe(false)
    expect(isValidOrderRef(null)).toBe(false)
    expect(isValidOrderRef(undefined)).toBe(false)
  })
})

describe('generateOrderRef', () => {
  it('همیشه شمارهٔ معتبر تولید می‌کند', () => {
    for (let i = 0; i < 50; i++) {
      expect(isValidOrderRef(generateOrderRef())).toBe(true)
    }
  })
})

describe('saveLastOrder / readLastOrder', () => {
  it('رفت‌وبرگشت کامل داده', () => {
    saveLastOrder(sample)
    expect(readLastOrder()).toEqual(sample)
    expect(readLastOrderRef()).toBe('123456')
  })

  it('روش پرداخت انتخابی کاربر حفظ می‌شود', () => {
    // این همان باگی بود که رفع شد: انتخاب کاربر به مقصد نمی‌رسید
    saveLastOrder({ ...sample, paymentMethod: 'cod' })
    expect(readLastOrder()?.paymentMethod).toBe('cod')
  })

  it('بدون داده null برمی‌گرداند', () => {
    expect(readLastOrder()).toBeNull()
    expect(readLastOrderRef()).toBeNull()
  })
})

describe('readLastOrder — مقاومت در برابر دادهٔ خراب', () => {
  const writeRaw = (value: string) => sessionStorage.setItem('saite:last-order-meta', value)

  it('JSON نامعتبر را نادیده می‌گیرد', () => {
    writeRaw('{ not json')
    expect(readLastOrder()).toBeNull()
  })

  it('مقدار غیرشیء را رد می‌کند', () => {
    writeRaw('"just a string"')
    expect(readLastOrder()).toBeNull()
    writeRaw('null')
    expect(readLastOrder()).toBeNull()
  })

  it('شمارهٔ پیگیری نامعتبر را رد می‌کند', () => {
    writeRaw(JSON.stringify({ ...sample, ref: 'abc' }))
    expect(readLastOrder()).toBeNull()
  })

  it('روش پرداخت جعلی را رد می‌کند', () => {
    // کاربر می‌تواند sessionStorage را دستکاری کند
    writeRaw(JSON.stringify({ ...sample, paymentMethod: 'free' }))
    expect(readLastOrder()).toBeNull()
  })

  it('فیلد عددی غیرعدد را رد می‌کند', () => {
    writeRaw(JSON.stringify({ ...sample, total: 'رایگان' }))
    expect(readLastOrder()).toBeNull()
    writeRaw(JSON.stringify({ ...sample, itemCount: NaN }))
    expect(readLastOrder()).toBeNull()
  })

  it('فیلد جاافتاده را رد می‌کند', () => {
    const { receiverName: _omit, ...incomplete } = sample
    writeRaw(JSON.stringify(incomplete))
    expect(readLastOrder()).toBeNull()
  })
})

describe('PAYMENT_METHOD_LABELS', () => {
  it('برای هر روش برچسب فارسی دارد', () => {
    expect(PAYMENT_METHOD_LABELS.online).toBeTruthy()
    expect(PAYMENT_METHOD_LABELS.cod).toBeTruthy()
  })
})
