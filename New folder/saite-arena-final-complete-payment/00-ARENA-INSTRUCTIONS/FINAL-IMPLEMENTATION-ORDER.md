# اولویت نهایی اجرا برای Arena.ai

## اولویت P0, اول انجام بده

1. اعتبارسنجی baseline و ساخت branch
2. احراز هویت server-side و حذف credential leak
3. security headers، cookie، session revocation، rate limit
4. مدل دامنه و دیتابیس: Customer، Address، Product، Order، Package، Return، ShippingMethod، Carrier، Zone، AuditEvent

بدون این‌ها UIهای بعدی ظاهراً خوب ولی ناامن و ناسازگار می‌مانند.

## اولویت P1, هسته تجاری

5. API و server authority برای قیمت، موجودی و checkout
6. حساب مشتری، ثبت‌نام، login، address book و snapshot آدرس
7. تنظیمات حمل‌ونقل، شرکت‌ها، مناطق و قوانین، شامل پیش‌کرایه، پس‌کرایه و رایگان
8. checkout چندمرحله‌ای و idempotent payment/order creation

این فاز باید قبل از اتصال واقعی پنل سفارش انجام شود، چون سفارش بدون قرارداد shipping ناقص است.

## اولویت P2, عملیات پنل

9. صفحه مشتریان و filterهای واقعی
10. صفحه سفارش‌ها و fulfillment
11. چندبسته‌ای، وزن/ابعاد، بیمه، لیبل A6 و barcode
12. مرجوعی، QC، refund و لجستیک معکوس

## اولویت P3, کیفیت و مقیاس

13. اتصال شرکت حمل و tracking
14. اعلان SMS/email/WhatsApp
15. export امن، audit کامل، retention و RBAC جزئی
16. Playwright E2E، coverage، CodeQL، Dependabot و مانیتورینگ

## Definition of Done

هر فاز فقط وقتی تمام است که type-check، lint، unit test، build و سناریوی دستی آن سبز باشد. Mock فقط adapter موقت است و نباید به‌عنوان backend واقعی پذیرفته شود.
