# فاز پرداخت برای Arena

این فاز در مسیر `پنل مدیریت → تنظیمات → پرداخت و درگاه‌ها` قرار می‌گیرد و باید با `08-domain-foundation` یکپارچه شود.

## اولویت

پرداخت بعد از Order Snapshot، Shipping Quote و Inventory Reservation و قبل از UI نهایی سفارش اجرا شود. دلیل: payment نباید به totalPrice، localStorage یا mock state اعتماد کند.

## فایل‌های این فاز

- `09-payment-gateways/src/types/payment.ts`
- `09-payment-gateways/src/lib/payments/payment-rules.ts`
- `09-payment-gateways/src/lib/payments/provider-contract.ts`
- `09-payment-gateways/src/app/admin/(panel)/settings/payments/page.tsx`
- `09-payment-gateways/src/components/admin/payments/payment-settings-page.tsx`
- `09-payment-gateways/tests/payment-rules.test.ts`
- `09-payment-gateways/docs/PAYMENT-GATEWAY-SCENARIO.md`

مسیر `09-payment-gateways/src/...` را به `src/...` پروژه منتقل کن.

## ممنوع

secret واقعی در env عمومی، client bundle، database plaintext، URL، log یا HTML قرار نگیرد. فقط reference به secret manager ذخیره شود.
