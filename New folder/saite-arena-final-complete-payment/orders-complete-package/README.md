# بسته کامل سفارش‌ها، ارسال، چندبسته‌ای و مرجوعی Saite

- `orders-fulfillment-preview.html`: پیش‌نمایش تعاملی کامل
- `src/types/order-fulfillment.ts`: مدل TypeScript
- `src/lib/orders/label.ts`: ساخت داده لیبل استاندارد A6
- `src/lib/orders/return-policy.ts`: transition مرجوعی و محاسبه refund
- `docs/POSTAL-LABEL-STANDARD.md`: قالب و بارکد
- `docs/RETURNS-AND-REVERSE-LOGISTICS.md`: مدل مرجوعی
- `docs/ORDER-AREA-COMPLETENESS.md`: چک‌لیست کمبودها

این بسته push انجام نمی‌دهد. Arena باید UI را با کامپوننت‌های پروژه یکپارچه و adapter را به API واقعی وصل کند.
