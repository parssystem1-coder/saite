# برنامه ادغام با پروژه موجود

1. `src/types/checkout-order.ts` و `src/lib/checkout/address-label.ts` را اضافه کنید.
2. CheckoutForm را به بخش‌های آدرس، آدرس‌های ذخیره‌شده و روش ارسال تقسیم کنید.
3. `CheckoutClient` را از setTimeout و totalPrice کلاینت جدا کنید و `createOrder` API/Server Action صدا بزنید.
4. `CartSummary` را به نمایش shipping estimate، stale state و مبلغ server-confirmed مجهز کنید.
5. auth کلاینتی را فقط برای UX نگه دارید، ولی endpoint سفارش `getCustomerSession()` سروری بخواهد.
6. order snapshot را به admin fulfillment وصل کنید.
7. label renderer واقعی A6 با SVG/PDF و Code 128 بسازید.
8. تست‌های schema، redirect، stale price، idempotency و E2E checkout اضافه کنید.
