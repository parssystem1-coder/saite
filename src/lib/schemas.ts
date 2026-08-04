import { z } from 'zod'

/**
 * Schemaهای اعتبارسنجی — منبع واحد حقیقت.
 *
 * همین تعریف‌ها هم در فرم سمت کلاینت (از طریق React Hook Form) و هم
 * بعداً در Server Action سمت سرور استفاده می‌شوند. یک تعریف، اعتبارسنجی
 * در هر دو سو، به‌همراه استنتاج خودکار تایپ.
 *
 * ⚠️ قاعدهٔ امنیتی: اعتبارسنجی کلاینت فقط برای تجربهٔ کاربری است.
 * هنگام اتصال بک‌اند، همین schemaها باید روی سرور دوباره اجرا شوند.
 */

/** موبایل ایران: با ۰۹ شروع می‌شود و ۱۱ رقم است */
const iranMobile = z
  .string()
  .trim()
  .regex(/^09\d{9}$/, 'شمارهٔ موبایل باید با ۰۹ شروع شود و ۱۱ رقم باشد')

const persianName = z
  .string()
  .trim()
  .min(3, 'نام باید حداقل ۳ کاراکتر باشد')
  .max(60, 'نام بیش از حد طولانی است')

const email = z
  .string()
  .trim()
  .min(1, 'پست الکترونیک الزامی است')
  .email('قالب پست الکترونیک معتبر نیست')

/** ایمیل اختیاری — رشتهٔ خالی هم پذیرفته می‌شود */
const optionalEmail = z.union([z.literal(''), email]).optional()

/**
 * شناسهٔ ورود: ایمیل **یا** شمارهٔ موبایل.
 *
 * چرا؟ بخش بزرگی از مشتریان ایرانی ایمیل فعال ندارند یا آن را
 * به خاطر نمی‌آورند، اما شمارهٔ موبایلشان را همیشه می‌دانند.
 * اجبار به ایمیل یعنی از دست دادن همان کاربر در لحظهٔ خرید.
 */
const loginIdentifier = z
  .string()
  .trim()
  .min(1, 'ایمیل یا شمارهٔ موبایل را وارد کنید')
  .refine(
    (v) => /^09\d{9}$/.test(v) || z.string().email().safeParse(v).success,
    'ایمیل معتبر یا شمارهٔ موبایل ۱۱ رقمی وارد کنید'
  )

/** آیا این رشته شمارهٔ موبایل است؟ — برای انتخاب مسیر ورود */
export function isMobileIdentifier(value: string): boolean {
  return /^09\d{9}$/.test(value.trim())
}

const password = z
  .string()
  .min(8, 'رمز عبور باید حداقل ۸ کاراکتر باشد')
  .max(72, 'رمز عبور بیش از حد طولانی است')

// ── احراز هویت ──────────────────────────────────────────
export const loginSchema = z.object({
  identifier: loginIdentifier,
  password: z.string().min(1, 'رمز عبور الزامی است'),
})
export type LoginInput = z.infer<typeof loginSchema>

/**
 * ورود مدیر — عمداً جدا از `loginSchema` مشتریان.
 *
 * تفاوت‌ها و دلیلشان:
 *  • «نام کاربری» به‌جای ایمیل: حساب مدیر در پنل ساخته می‌شود، نه
 *    با ثبت‌نام عمومی. ایمیل‌محور بودن این توهم را می‌سازد که
 *    می‌توان با آن ثبت‌نام کرد.
 *  • پیام‌های اعتبارسنجی عمداً کلی‌اند و نمی‌گویند کدام فیلد در
 *    سیستم وجود دارد.
 */
export const adminLoginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, 'نام کاربری را وارد کنید')
    .max(64, 'نام کاربری بیش از حد طولانی است'),
  password: z
    .string()
    .min(1, 'رمز عبور را وارد کنید')
    .max(128, 'رمز عبور بیش از حد طولانی است'),
})
export type AdminLoginInput = z.infer<typeof adminLoginSchema>

/** رمز مدیر سخت‌گیرانه‌تر از رمز مشتری است */
const adminPassword = z
  .string()
  .min(10, 'رمز مدیر باید حداقل ۱۰ کاراکتر باشد')
  .max(128, 'رمز عبور بیش از حد طولانی است')
  .regex(/[a-zA-Z]/, 'رمز باید حداقل یک حرف داشته باشد')
  .regex(/[0-9]/, 'رمز باید حداقل یک رقم داشته باشد')

export const changeAdminPasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'رمز فعلی را وارد کنید'),
    newPassword: adminPassword,
    confirmPassword: z.string().min(1, 'تکرار رمز الزامی است'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'رمز جدید و تکرار آن یکسان نیستند',
    path: ['confirmPassword'],
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    message: 'رمز جدید باید با رمز فعلی متفاوت باشد',
    path: ['newPassword'],
  })
export type ChangeAdminPasswordInput = z.infer<typeof changeAdminPasswordSchema>

/*
  ثبت‌نام مشتری.

  موبایل الزامی است و ایمیل اختیاری — نه برعکس. دلیل: موبایل
  کانال اصلی اطلاع‌رسانی سفارش در ایران است و برای پیگیری مرسوله
  لازم می‌شود، در حالی که بسیاری از خریداران ایمیل فعال ندارند.
*/
export const registerSchema = z
  .object({
    name: persianName,
    phone: iranMobile,
    email: optionalEmail,
    password,
    confirmPassword: z.string().min(1, 'تکرار رمز عبور الزامی است'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'رمز عبور و تکرار آن یکسان نیستند',
    path: ['confirmPassword'],
  })
export type RegisterInput = z.infer<typeof registerSchema>

// ── تماس / استعلام قیمت / درخواست تعمیر ─────────────────
export const CONTACT_SUBJECTS = ['consult', 'quote', 'repair', 'other'] as const
export type ContactSubject = (typeof CONTACT_SUBJECTS)[number]

export const contactSchema = z.object({
  subject: z.enum(CONTACT_SUBJECTS),
  name: persianName,
  phone: iranMobile,
  email: z.union([z.literal(''), email]).optional(),
  deviceModel: z.string().trim().max(60, 'مدل دستگاه بیش از حد طولانی است').optional(),
  message: z
    .string()
    .trim()
    .min(10, 'توضیحات باید حداقل ۱۰ کاراکتر باشد')
    .max(1000, 'توضیحات نباید بیش از ۱۰۰۰ کاراکتر باشد'),
})
export type ContactInput = z.infer<typeof contactSchema>

// ── تسویه‌حساب ──────────────────────────────────────────

/**
 * روش‌های پرداخت.
 *
 * ⚠️ `cod` (پرداخت در محل) در UI غیرفعال است اما در schema می‌ماند،
 * چون هنگام فعال‌سازی نباید قرارداد داده عوض شود. اعتبارسنجی
 * «آیا این روش الان مجاز است؟» کار سرور است نه فرم.
 */
export const PAYMENT_METHODS = ['online', 'cod'] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

/** روش‌هایی که در فاز فعلی واقعاً قابل انتخاب‌اند */
export const ENABLED_PAYMENT_METHODS: readonly PaymentMethod[] = ['online']

export const checkoutSchema = z.object({
  receiverName: persianName,
  phone: iranMobile,
  province: z.string().trim().min(2, 'استان را وارد کنید'),
  city: z.string().trim().min(2, 'شهر را وارد کنید'),
  address: z.string().trim().min(10, 'آدرس باید کامل و دقیق باشد'),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{10}$/, 'کد پستی باید دقیقاً ۱۰ رقم باشد'),
  note: z.string().trim().max(500).optional(),
  /**
   * پیش از این، رادیوی روش پرداخت خارج از react-hook-form بود و
   * انتخاب کاربر هرگز به onSubmit نمی‌رسید — باگی خاموش که در فاز
   * بک‌اند همهٔ سفارش‌ها را «آنلاین» ثبت می‌کرد.
   */
  paymentMethod: z.enum(PAYMENT_METHODS).refine(
    (m) => ENABLED_PAYMENT_METHODS.includes(m),
    { message: 'این روش پرداخت در حال حاضر فعال نیست' }
  ),
})
export type CheckoutInput = z.infer<typeof checkoutSchema>

// ── فرم ادمین ───────────────────────────────────────────
export const productFormSchema = z.object({
  name: z.string().trim().min(5, 'نام محصول باید حداقل ۵ کاراکتر باشد'),
  brand: z.string().min(1, 'برند را انتخاب کنید'),
  model: z.string().trim().min(2, 'مدل الزامی است'),
  category: z.string().min(1, 'دسته‌بندی را انتخاب کنید'),
  /**
   * فیلد خالی با coerce به ۰ تبدیل می‌شود و پیام «بزرگ‌تر از صفر»
   * می‌گیرد — گمراه‌کننده است. این پیش‌پردازش، خالی‌بودن را جدا
   * تشخیص می‌دهد.
   */
  price: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.coerce
      .number({ message: 'قیمت را وارد کنید' })
      .int('قیمت باید عدد صحیح باشد')
      .positive('قیمت باید بزرگ‌تر از صفر باشد')
  ),
  description: z.string().trim().max(2000).optional(),
})
/**
 * خروجی پس از اعتبارسنجی — `price` قطعاً number است.
 * برای onSubmit و لایهٔ داده استفاده شود.
 */
export type ProductFormInput = z.infer<typeof productFormSchema>

/**
 * ورودی خام فرم — `price` هنوز رشتهٔ داخل input است.
 *
 * چرا دو تایپ؟ `z.coerce.number()` ورودی را `unknown` و خروجی را
 * `number` می‌بیند. react-hook-form هر دو را جدا می‌خواهد، وگرنه
 * useForm با خطای Resolver ناسازگار شکست می‌خورد.
 */
export type ProductFormValues = z.input<typeof productFormSchema>
