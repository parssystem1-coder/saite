# بسته بازآرایی Cart → Checkout → Admin Fulfillment

- `cart-checkout-shipping-preview.html`: پیش‌نمایش تعاملی جریان کامل
- `src/types/checkout-order.ts`: قرارداد داده checkout
- `src/lib/checkout/address-label.ts`: formatter آدرس چاپی
- `docs/CART-CHECKOUT-ORDER-REVIEW.md`: بازبینی عمیق و پیشنهادهای محصول/امنیت
- `docs/INTEGRATION-PLAN.md`: مسیر اتصال به پروژه فعلی

این بسته push انجام نمی‌دهد. Arena باید فایل‌های فعلی را با قراردادهای این بسته یکپارچه کند، نه اینکه checkout را دوباره به localStorage و totalPrice کلاینت وصل کند.
