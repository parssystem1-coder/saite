import 'server-only'

/**
 * کدهای وضعیت درگاه‌های پرداخت — برای خوانایی و جلوگیری از magic number.
 *
 * زرین‌پال: ۱۰۰ = پرداخت/درخواست موفق · ۱۰۱ = قبلاً verify شده
 * IDPay: ۱۰۰/۱۰۱/۲۰۰ = پرداخت موفق در verify
 */

export const ZARINPAL = {
  REQUEST_OK: 100,
  ALREADY_VERIFIED: 101,
} as const

export const IDPAY = {
  PAYMENT_SUCCESS_1: 100,
  PAYMENT_SUCCESS_2: 101,
  PAYMENT_SUCCESS_3: 200,
} as const
