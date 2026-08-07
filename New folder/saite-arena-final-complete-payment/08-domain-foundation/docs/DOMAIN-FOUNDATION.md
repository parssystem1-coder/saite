# هسته دامنه، چیزی که UI را به محصول واقعی تبدیل می‌کند

این فاز عمداً قبل از زیباسازی بیشتر اضافه شده است. هدفش این است که checkout، سفارش، حمل، انبار، مرجوعی و CRM از یک قرارداد واحد استفاده کنند.

## چرا این فاز P0/P1 است

در نسخه اولیه، cart و checkout به Zustand/localStorage و `totalPrice()` متکی بودند. این برای prototype خوب است، اما مبلغ، موجودی، پرداخت و هویت قابل اعتماد نیستند. این قراردادها مرز را مشخص می‌کنند:

- قیمت و نام کالا در `OrderLineSnapshot` هنگام ایجاد سفارش freeze می‌شوند.
- آدرس خرید در `AddressSnapshot` freeze می‌شود و تغییر address book سفارش قدیمی را عوض نمی‌کند.
- هزینه حمل، subsidy فروشگاه و مبلغ پرداختی مشتری جدا هستند.
- `idempotencyKey` جلوی ثبت سفارش دوباره در retry و callback درگاه را می‌گیرد.
- `InventoryReservation` پیش از پرداخت یا در لحظه policy‌شده رزرو و بعد confirm/release می‌شود.
- timeline مشتری از order، payment، shipment، return و refund رویداد می‌گیرد.

## جریان واقعی ثبت سفارش

1. سرور session مشتری را می‌خواند.
2. cart فقط `{productId, quantity}` ارسال می‌کند.
3. سرور قیمت، موجودی، محدودیت و کالاهای quote-only را دوباره می‌خواند.
4. shipping quote بر اساس آدرس، وزن، ابعاد و قوانین فعال ساخته می‌شود.
5. client روش حمل را انتخاب می‌کند، اما سرور quote را دوباره verify می‌کند.
6. با idempotency key، Order Snapshot و Inventory Reservation داخل transaction ساخته می‌شوند.
7. برای پرداخت آنلاین authority ساخته می‌شود، سپس callback verify می‌شود.
8. فقط پس از پرداخت معتبر، سفارش paid و reservation confirmed می‌شود.
9. fulfillment بر اساس packageها انجام می‌شود و هر package label و tracking مستقل دارد.
10. return و refund فقط با transitionهای مجاز و audit انجام می‌شوند.

## مواردی که Arena نباید انجام دهد

- مبلغ نهایی را از localStorage قبول نکند.
- status پرداخت را از query string یا client state قبول نکند.
- آدرس را از پروفایل live هنگام چاپ سفارش قدیمی نخواند.
- پس‌کرایه را با ارسال رایگان یکی نکند.
- یک order چندبسته‌ای را با یک tracking code مدل نکند.
- با refresh callback سفارش جدید بسازد.
- اطلاعات PII را در URL یا log عمومی بگذارد.

## Definition of Done

این فاز فقط وقتی کامل است که migration/ORM واقعی، transaction، API سروری، تست concurrency و تست idempotency داشته باشد. فایل‌های این پوشه قرارداد و rule قابل تست‌اند؛ جای دیتابیس و gateway واقعی را نمی‌گیرند.
