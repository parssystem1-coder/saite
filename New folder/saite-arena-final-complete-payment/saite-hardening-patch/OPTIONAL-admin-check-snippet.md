# افزودنی اختیاری به `scripts/admin-setup.mjs`

کل فایل بازنویسی نشد چون تغییر کوچک است و ادغام دستی‌اش امن‌تر از
جایگزینی ۴۰۰ خط.

## ۱. تشخیص نشت `NEXT_PUBLIC`

داخل تابع `cmdCheck()`، بعد از بررسی «رمز عبور» این را اضافه کنید:

```js
  /*
    بدترین حالت ممکن: پیشوند NEXT_PUBLIC یعنی مقدار داخل باندل
    مرورگر می‌نشیند و برای هر بازدیدکننده قابل خواندن است. این
    اشتباه یک‌بار در تاریخچهٔ همین پروژه رخ داده، پس ابزار باید
    فعالانه دنبالش بگردد.
  */
  const leakedKeys = Object.keys(env).filter(
    (key) => key.startsWith('NEXT_PUBLIC_') && /PASSWORD|SECRET|TOKEN|KEY/i.test(key)
  )

  checks.push({
    label: 'نشت به باندل مرورگر',
    ok: leakedKeys.length === 0,
    good: 'هیچ متغیر حساسی پیشوند NEXT_PUBLIC ندارد',
    bad: `این متغیرها وارد جاوااسکریپت مرورگر می‌شوند: ${leakedKeys.join('، ')}`,
    critical: true,
  })
```

## ۲. یادآوری پراکسی

```js
  checks.push({
    label: 'پراکسی مورد اعتماد',
    ok: Boolean(env.TRUSTED_PROXY_HOPS?.trim()),
    good: `${env.TRUSTED_PROXY_HOPS} لایه`,
    bad: 'تنظیم نشده — اگر پشت nginx/Cloudflare هستید، محدودیت نرخ با جعل هدر دور می‌خورد',
    critical: false,
  })
```

## ۳. اسکریپت‌های پیشنهادی `package.json`

```jsonc
"scripts": {
  // تحلیل حجم باندل — برای دیدن اینکه mock-data (۴۰KB) کجا می‌رود
  "analyze": "ANALYZE=true next build",
  // پیش از هر انتشار
  "preflight": "npm run admin:check && npm run verify"
}
```

و `@types/node` را از `^20` به `^22` ببرید — پروژه Node ≥ ۲۲ لازم
دارد، پس تایپ‌های نسخهٔ ۲۰ با محیط واقعی هم‌راستا نیستند.
