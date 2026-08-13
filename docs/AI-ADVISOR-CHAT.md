# چتبات مشاور فروش هوشمند (AI Sales Advisor)

چتباتی که به‌صورت استریم (SSE) به گیتوی AI داخلی وصل است و به‌عنوان «مشاور فروش» محصول پیشنهاد می‌دهد — بدون هیچ دسترسی نوشتن روی سبد/سفارش/پرداخت/قیمت.

## معماری

```
کلاینت (ChatWidget, بدون iframe)
   │  POST /api/ai/advisor { message, sessionId? }
   ▼
route: rate-limit دو لایه → zod → detectInjection → redactPII
   │  session-store (سرور، رمزشده AES-256-GCM، owner-bound، TTL=6h)
   ▼
retrieval: جست‌وجوی کلیدواژه‌ای محصولات (سقف ۶) ─ fallback: منتخب‌ها
   ▼
gateway.streamChat (همان لایه‌های امنیتی callChat + cost-tracking)
   ▼
SSE: event session | delta | done | error
   └─ done: متن پاک‌شده + فقط محصولاتِ اعتبارسنجی‌شده با DB
```

## قوانین امنیتی (قرارداد)

1. **AI هیچ ابزاری ندارد** — فقط متن. «افزودن به سبد» اکشن کلاینتی استور cart است.
2. **ارجاع محصول فقط با اعتبارسنجی DB** — بلاک `<<SUGGESTED_PRODUCTS>>[...]<<END_SUGGESTED_PRODUCTS>>` خوانده، با zod و سپس با `validateSuggestions` در برابر دیتابیس چک می‌شود؛ شناسه‌های نامعتبر بی‌صدا حذف می‌شوند. بلاک هرگز در UI نمایش داده نمی‌شود.
3. **PII** — `redactPII` روی پیامِ پیش از ذخیره/ارسال، system و کل تاریخچه (در gateway).
4. **Injection** — `detectInjection` در route و دوباره در gateway روی تاریخچه.
5. **Rate-limit** — `advisor:b:` ‏(۶/دقیقه) و `advisor:h:` ‏(۴۰/ساعت) به‌ازای کاربر/IP.
6. **UI داخلی** — هیچ iframeای در کار نیست؛ متن AI فقط plain-text رندر می‌شود.

## فایل‌های کلیدی

| لایه | مسیر |
|---|---|
| روت SSE | `src/app/api/ai/advisor/route.ts` |
| پرامپت/پرسونا | `src/server/ai/features/sales-advisor/prompt.ts` |
| بازیابی کاتالوگ | `src/server/ai/features/sales-advisor/retrieval.ts` |
| پارس+اعتبارسنجی خروجی | `src/server/ai/features/sales-advisor/output.ts` |
| حافظهٔ گفتگو | `src/server/ai/features/sales-advisor/session-store.ts` |
| استریم گیتوی/پرووایدر | `src/server/ai/gateway.ts`, `providers/anthropic.ts`, `providers/mock.ts` |
| ویجت | `src/components/chat/*` |

## پیکربندی

- `ANTHROPIC_API_KEY` — بدون آن، فقط در غیر-production از mock استفاده می‌شود؛ در production روت با 503 امن می‌افتد.
- `ADVISOR_CHAT_SECRET` (اختیاری) یا `CUSTOMER_SESSION_SECRET` — کلید رمزنگاری حافظهٔ چت؛ حداقل ۱۶ کاراکتر (در production الزامی).

## توسعهٔ محلی بدون کلید

پرووایدر mock سه چانک استریم فارسی برمی‌گرداند تا UI/جریان SSE به‌صورت end-to-end قابل تست باشد.
