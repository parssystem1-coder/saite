import { describe, expect, it } from 'vitest'
import {
  checkoutSchema,
  isMobileIdentifier,
  contactSchema,
  loginSchema,
  productFormSchema,
  registerSchema,
} from '@/lib/schemas'

/** اولین پیام خطای مربوط به یک فیلد */
function errFor(result: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }, field: string) {
  if (result.success) return undefined
  return result.error?.issues.find((i) => i.path[0] === field)?.message
}

describe('loginSchema — ورود با ایمیل یا موبایل', () => {
  it('ایمیل معتبر را می‌پذیرد', () => {
    expect(
      loginSchema.safeParse({ identifier: 'a@b.com', password: 'secret12' }).success
    ).toBe(true)
  })

  it('🔑 شمارهٔ موبایل را هم می‌پذیرد — ایمیل اجباری نیست', () => {
    expect(
      loginSchema.safeParse({ identifier: '09123456789', password: 'secret12' }).success
    ).toBe(true)
  })

  it('رشتهٔ بی‌معنا را رد می‌کند', () => {
    const r = loginSchema.safeParse({ identifier: 'not-an-email', password: 'x' })
    expect(r.success).toBe(false)
    expect(errFor(r, 'identifier')).toBe('ایمیل معتبر یا شمارهٔ موبایل ۱۱ رقمی وارد کنید')
  })

  it('شمارهٔ موبایل با طول اشتباه رد می‌شود', () => {
    expect(loginSchema.safeParse({ identifier: '0912345', password: 'x' }).success).toBe(false)
    expect(loginSchema.safeParse({ identifier: '091234567890', password: 'x' }).success).toBe(
      false
    )
  })

  it('شناسهٔ خالی پیام اختصاصی می‌دهد', () => {
    const r = loginSchema.safeParse({ identifier: '', password: 'x' })
    expect(errFor(r, 'identifier')).toBe('ایمیل یا شمارهٔ موبایل را وارد کنید')
  })
})

describe('isMobileIdentifier', () => {
  it('موبایل ایرانی را تشخیص می‌دهد', () => {
    expect(isMobileIdentifier('09123456789')).toBe(true)
    expect(isMobileIdentifier('  09123456789  ')).toBe(true)
  })

  it('ایمیل و ورودی نامعتبر را موبایل نمی‌داند', () => {
    expect(isMobileIdentifier('a@b.com')).toBe(false)
    expect(isMobileIdentifier('0912345')).toBe(false)
    expect(isMobileIdentifier('')).toBe(false)
  })
})

describe('registerSchema', () => {
  const valid = {
    name: 'علی رضایی',
    email: 'ali@example.com',
    phone: '09123456789',
    password: 'abcd1234',
    confirmPassword: 'abcd1234',
  }

  it('ورودی کامل و درست را می‌پذیرد', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true)
  })

  it('عدم تطابق رمز را روی فیلد درست گزارش می‌کند', () => {
    const r = registerSchema.safeParse({ ...valid, confirmPassword: 'different' })
    expect(r.success).toBe(false)
    expect(errFor(r, 'confirmPassword')).toBe('رمز عبور و تکرار آن یکسان نیستند')
  })

  it('شمارهٔ موبایل غیرایرانی را رد می‌کند', () => {
    for (const bad of ['12345', '9123456789', '08123456789', '091234567890']) {
      const r = registerSchema.safeParse({ ...valid, phone: bad })
      expect(r.success).toBe(false)
    }
  })

  it('موبایل درست را می‌پذیرد', () => {
    expect(registerSchema.safeParse({ ...valid, phone: '09301234567' }).success).toBe(true)
  })

  it('🔑 ثبت‌نام بدون ایمیل ممکن است — بسیاری از مشتریان ایمیل ندارند', () => {
    const { email: _omit, ...withoutEmail } = valid
    expect(registerSchema.safeParse(withoutEmail).success).toBe(true)
    expect(registerSchema.safeParse({ ...valid, email: '' }).success).toBe(true)
  })

  it('اگر ایمیل داده شود، باید معتبر باشد', () => {
    const r = registerSchema.safeParse({ ...valid, email: 'not-an-email' })
    expect(r.success).toBe(false)
  })

  it('🔑 موبایل همچنان الزامی است — کانال اصلی اطلاع‌رسانی سفارش', () => {
    const { phone: _omit, ...withoutPhone } = valid
    expect(registerSchema.safeParse(withoutPhone).success).toBe(false)
  })

  it('رمز کوتاه‌تر از ۸ کاراکتر را رد می‌کند', () => {
    const r = registerSchema.safeParse({ ...valid, password: 'abc', confirmPassword: 'abc' })
    expect(errFor(r, 'password')).toBe('رمز عبور باید حداقل ۸ کاراکتر باشد')
  })

  it('فاصله‌های اضافی نام را حذف می‌کند', () => {
    const r = registerSchema.safeParse({ ...valid, name: '  علی رضایی  ' })
    expect(r.success && r.data.name).toBe('علی رضایی')
  })
})

describe('contactSchema', () => {
  const valid = {
    subject: 'quote' as const,
    name: 'سارا محمدی',
    phone: '09121112233',
    message: 'لطفاً قیمت این دستگاه را اعلام کنید',
  }

  it('ورودی معتبر را می‌پذیرد', () => {
    expect(contactSchema.safeParse(valid).success).toBe(true)
  })

  it('ایمیل خالی مجاز است (فیلد اختیاری)', () => {
    expect(contactSchema.safeParse({ ...valid, email: '' }).success).toBe(true)
  })

  it('ایمیل نامعتبر در فیلد اختیاری رد می‌شود', () => {
    expect(contactSchema.safeParse({ ...valid, email: 'bad' }).success).toBe(false)
  })

  it('پیام کوتاه را رد می‌کند', () => {
    const r = contactSchema.safeParse({ ...valid, message: 'کوتاه' })
    expect(errFor(r, 'message')).toBe('توضیحات باید حداقل ۱۰ کاراکتر باشد')
  })

  it('موضوع نامعتبر را رد می‌کند', () => {
    expect(contactSchema.safeParse({ ...valid, subject: 'hack' }).success).toBe(false)
  })
})

describe('checkoutSchema', () => {
  const valid = {
    receiverName: 'رضا کریمی',
    phone: '09123456789',
    province: 'تهران',
    city: 'تهران',
    address: 'خیابان ولیعصر، پلاک ۱۲۳، واحد ۴',
    postalCode: '1234567890',
    paymentMethod: 'online',
  }

  it('ورودی معتبر را می‌پذیرد', () => {
    expect(checkoutSchema.safeParse(valid).success).toBe(true)
  })

  it('روش پرداخت الزامی است — بدون آن سفارش ثبت نمی‌شود', () => {
    const { paymentMethod: _omit, ...withoutPayment } = valid
    expect(checkoutSchema.safeParse(withoutPayment).success).toBe(false)
  })

  it('روش پرداخت ناشناخته را رد می‌کند', () => {
    expect(checkoutSchema.safeParse({ ...valid, paymentMethod: 'bitcoin' }).success).toBe(false)
  })

  it('روش غیرفعال (cod) از سمت کلاینت قابل ارسال نیست', () => {
    // معتبر در enum ولی خارج از ENABLED_PAYMENT_METHODS
    const r = checkoutSchema.safeParse({ ...valid, paymentMethod: 'cod' })
    expect(r.success).toBe(false)
  })

  it('کد پستی باید دقیقاً ۱۰ رقم باشد', () => {
    for (const bad of ['123', '12345678901', 'abcdefghij']) {
      expect(checkoutSchema.safeParse({ ...valid, postalCode: bad }).success).toBe(false)
    }
  })

  it('آدرس کوتاه را رد می‌کند', () => {
    const r = checkoutSchema.safeParse({ ...valid, address: 'تهران' })
    expect(errFor(r, 'address')).toBe('آدرس باید کامل و دقیق باشد')
  })
})

describe('productFormSchema', () => {
  const valid = {
    name: 'پرینتر لیزری کانن',
    brand: 'canon',
    model: 'LBP-2900',
    category: 'printer',
    price: 4850000,
  }

  it('قیمت رشته‌ای را به عدد تبدیل می‌کند', () => {
    const r = productFormSchema.safeParse({ ...valid, price: '4850000' })
    expect(r.success).toBe(true)
    expect(r.success && r.data.price).toBe(4850000)
  })

  it('قیمت منفی یا صفر را رد می‌کند', () => {
    expect(productFormSchema.safeParse({ ...valid, price: -100 }).success).toBe(false)
    expect(productFormSchema.safeParse({ ...valid, price: 0 }).success).toBe(false)
  })

  it('قیمت اعشاری را رد می‌کند', () => {
    expect(productFormSchema.safeParse({ ...valid, price: 100.5 }).success).toBe(false)
  })

  it('قیمت غیرعددی را رد می‌کند', () => {
    expect(productFormSchema.safeParse({ ...valid, price: 'رایگان' }).success).toBe(false)
  })

  it('قیمت خالی پیام «وارد کنید» می‌دهد نه «بزرگ‌تر از صفر»', () => {
    // بدون preprocess، رشتهٔ خالی به ۰ تبدیل و پیام گمراه‌کننده می‌شد
    const r = productFormSchema.safeParse({ ...valid, price: '' })
    expect(errFor(r, 'price')).toBe('قیمت را وارد کنید')
  })

  it('برند و دستهٔ انتخاب‌نشده رد می‌شوند', () => {
    expect(errFor(productFormSchema.safeParse({ ...valid, brand: '' }), 'brand')).toBe(
      'برند را انتخاب کنید'
    )
    expect(errFor(productFormSchema.safeParse({ ...valid, category: '' }), 'category')).toBe(
      'دسته‌بندی را انتخاب کنید'
    )
  })
})
