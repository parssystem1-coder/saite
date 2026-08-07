# نقشه نهایی اجرای Saite برای Arena.ai

## نتیجه بررسی

بخش بزرگی از پروژه فعلی یک frontend mock با معماری خوب است. خطر اصلی این نیست که صفحه کم داریم؛ خطر این است که UI قبل از authority داده ساخته شود. بنابراین ترتیب زیر اجباری است.

## فاز P0، پایه و امنیت

- baseline و branch
- server auth، cookie، session revocation
- security headers، rate limit و secret validation
- customer/order/shipping permissions
- جلوگیری از credential leak
- اجرای verify بعد از هر تغییر

## فاز P1، هسته دامنه و دیتابیس

Source: `08-domain-foundation`

- Order Snapshot
- Inventory Reservation
- Shipping Quote
- Customer Timeline
- Return/Refund lifecycle
- transaction و idempotency
- migration واقعی برای PostgreSQL/ORM

تا این فاز تمام نشود، هیچ مبلغ یا وضعیت سفارش production-ready نیست.

## فاز P2، checkout واقعی

Source: `cart-checkout-shipping-package`

- ثبت‌نام/ورود فقط برای checkout
- address book و address snapshot
- shipping settings با prepaid، COD، free و flat rate
- server-side repricing
- پرداخت و callback idempotent

## فاز P3، عملیات مدیر

Source: `orders-complete-package`, `order-fulfillment-package`, `customers-module-package`

- مشتریان با filter واقعی و CRM timeline
- سفارش‌ها و fulfillment
- split shipment و package tracking
- A6 label و barcode server renderer
- return، QC، refund و reverse logistics

## فاز P4، حمل و اتوماسیون

Source: `07-shipping-settings`

- carrier adapters
- zone/rate engine
- shipping exceptions
- notification و tracking sync
- print queue و reprint audit

## فاز P5، کیفیت production

- Playwright برای login، checkout، پرداخت، فیلتر مشتری، split shipment و return
- تست race condition رزرو موجودی
- مانیتورینگ payment/carrier failure
- RBAC برای مالی، انبار، پشتیبانی و مدیر
- export امن، retention و backup
- CodeQL، Dependabot، coverage threshold

## معیار نهایی

هر فاز باید این چهار خروجی را داشته باشد: کد واقعی مسیرمحور، تست، migration/API contract و مستندات. HTML preview فقط برای تصمیم UI است و نباید به‌جای implementation server استفاده شود.
