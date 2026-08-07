/**
 * کلیدهای localStorage ویرایشگر محصول — منبع واحد.
 *
 * الگوی نهایی کلید: `saite.product-editor.<name>` (پیشوند در mock-adapter).
 * هر کلید جدید ابتدا اینجا تعریف شود تا تداخل نام و migration ساده بماند.
 */
export const PRODUCT_EDITOR_STORAGE = {
  /** شناسهٔ محصولِ در حال ویرایش (متعلق به draft فعلی) */
  productId: 'product-id',
  /** آخرین پیش‌نویس ذخیره‌شده (storageKey پیش‌فرض) */
  draft: 'draft',
  /** آخرین نسخهٔ منتشرشده */
  published: 'published',
} as const
