# سناریو و معماری درگاه پرداخت

## جایگاه منو

`پنل مدیریت → تنظیمات → پرداخت و درگاه‌ها`

زیرتب‌ها: درگاه‌ها، تراکنش‌ها، بازپرداخت‌ها، تنظیمات عمومی. سفارش‌ها فقط نتیجه PaymentIntent را مصرف می‌کنند.

## مدل داده

- `PaymentProvider`: نام، provider code، sandbox/production، فعال، اولویت fallback، currency، حداقل/حداکثر مبلغ، timeout، fee، callback، refund capability و health.
- `PaymentIntent`: order، amount، currency، idempotency key، authority، redirect، transaction، وضعیت و expiry.
- `PaymentEvent`: رویدادهای append-only مثل callback، verify، failure و refund.
- `Refund`: بازپرداخت کامل/جزئی با reason، status، provider refund id و actor.

## جریان امن خرید

1. سرور Order Snapshot و amount را می‌سازد.
2. سرور یک PaymentIntent با idempotency key می‌سازد.
3. provider سالم و واجد شرایط بر اساس priority انتخاب می‌شود.
4. create payment فقط از server adapter اجرا می‌شود.
5. مشتری به redirectUrl می‌رود.
6. callback فقط authority را نمی‌پذیرد: amount و order را از سرور می‌خواند، verify را با provider انجام می‌دهد و provider event id را deduplicate می‌کند.
7. در transaction، PaymentIntent succeeded، Order paid و InventoryReservation confirmed می‌شوند.
8. retry callback نباید order یا payment event تکراری بسازد.

## خطاها و fallback

- timeout: PaymentIntent pending، job برای verify مجدد، نه پرداخت موفق فرضی.
- callback نامعتبر: failed و audit.
- provider down: درگاه بعدی فقط قبل از redirect انتخاب شود؛ وسط تراکنش بی‌دلیل provider عوض نشود.
- پرداخت ناموفق: order pending_payment یا payment_failed، reservation طبق policy release شود.
- chargeback: وضعیت مستقل، توقف fulfillment بعدی و alert مالی.

## بازپرداخت

Refund از پنل سفارش و پروفایل مشتری قابل شروع است، اما از endpoint سرور. مبلغ refund از مبلغ پرداخت‌شده بیشتر نشود، partial refund پشتیبانی شود و transitionها کنترل شوند. بازپرداخت و chargeback باید timeline مشتری و audit مالی بسازند.

## فیلدهای مدیریتی

نام، provider، محیط، secret references، فعال، اولویت، ارز، min/max، timeout، callback، کارمزد درصدی/ثابت، پشتیبانی refund و partial refund، سلامت، آخرین health check و یادداشت داخلی. secret واقعی هرگز داخل UI، HTML، localStorage یا لاگ چاپ نشود.

## اتصال به checkout

در checkout فقط درگاه‌های فعال، سالم و سازگار با currency/amount نمایش داده شوند. انتخاب درگاه نباید مبلغ را از کلاینت تعیین کند. Order Snapshot باید provider id، payment intent id، fee و status نهایی را نگه دارد.

## Definition of Done

adapter واقعی برای provider، secret manager، transaction دیتابیس، idempotency، callback verify، retry job، refund، chargeback، audit، تست concurrency و E2E پرداخت باید وجود داشته باشد. صفحه UI به تنهایی اتصال پرداخت محسوب نمی‌شود.
