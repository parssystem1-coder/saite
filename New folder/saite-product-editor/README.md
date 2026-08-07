# Saite Product Editor

## Install

```bash
npm i lucide-react
```

## Included

- Modular Next.js + TypeScript ProductEditor
- Product tabs, commerce, specifications, media, content, SEO, logistics
- Drag and drop image preview with Alt fields
- SEO score and JSON-LD preview
- API-ready onSave/onPublish callbacks

Copy the `src` folder into your project. The page is available at `/admin/products/new`.

## نسخه اصلاح‌شده

- حذف props استفاده‌نشده از SeoPanel برای سازگاری با noUnusedParameters
- استفاده از ChangeEvent type در CommercePanel
- فیلتر کردن blob URL از JSON-LD
- فعال شدن مرتب‌سازی واقعی تصاویر با Drag & Drop

## جدول و ایموجی در ادیتور

```bash
npm i @tiptap/extension-table @tiptap/extension-table-row @tiptap/extension-table-header @tiptap/extension-table-cell
```

ویرایشگر شامل درج جدول با تعداد سطر و ستون دلخواه، ردیف عنوان، ویرایش مستقیم سلول‌ها، پنل ایموجی با ایموجی‌های پیش‌فرض و افزودن ایموجی سفارشی در همان محتواست. برای حذف یا افزودن سطر و ستون در نسخه بعدی، commandهای Table Tiptap را به منوی context متصل کن.

## منوی راست‌کلیک جدول

با راست‌کلیک داخل جدول، منوی عملیات باز می‌شود: افزودن یا حذف سطر و ستون، تبدیل ردیف عنوان، ادغام و جداسازی سلول‌ها و حذف جدول. این عملیات با commandهای رسمی Tiptap اجرا می‌شوند.

## ذخیره جدول و ایموجی سفارشی

- HTML ادیتور، شامل جدول و محتوای ایموجی، همراه state محصول در route ذخیره پیش‌نویس ذخیره می‌شود.
- `GET/POST /api/admin/emojis` کتابخانه ایموجی‌های سفارشی را نگه می‌دارد.
- جدول در HTML ذخیره می‌شود و هنگام بارگذاری دوباره، Tiptap همان جدول را بازسازی می‌کند.
- ذخیره‌سازی فایل‌محور برای توسعه است؛ در production، این route را به دیتابیس و دسترسی ادمین وصل کن.

## مرحله فعلی: Mock Adapter

این نسخه برای UI بدون بکند و دیتابیس تنظیم شده است. از `createMockProductEditorAdapter()` استفاده کن؛ داده‌ها در localStorage می‌مانند. قرارداد adapter ثابت است و بعداً با `createHttpProductEditorAdapter()` جایگزین می‌شود. راهنمای کامل در `MOCK-ADAPTER-GUIDE.txt` و فهرست وابستگی‌ها در `DEPENDENCIES.txt` است.
