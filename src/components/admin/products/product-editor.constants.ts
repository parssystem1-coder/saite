import type { Attribute, ProductDraft, ProductFaq, TabKey } from './product-editor.types';

export const PRODUCT_TABS: Array<{ id: TabKey; label: string }> = [
  { id: 'base', label: 'پایه' },
  { id: 'commerce', label: 'قیمت و موجودی' },
  { id: 'specs', label: 'مشخصات فنی' },
  { id: 'media', label: 'رسانه' },
  { id: 'content', label: 'محتوا' },
  { id: 'seo', label: 'سئو و اسکیما' },
  { id: 'logistics', label: 'خدمات و ارتباطات' },
  { id: 'seo-ai', label: 'دستیار سئو (AI)' },
];

/** محصول جدید — هویت و محتوا خالی؛ قیمت و خدمات را دستیار پر نمی‌کند. */
export const INITIAL_DRAFT: ProductDraft = {
  name: '',
  nameEn: '',
  slug: '',
  sku: '',
  mpn: '',
  gtin: '',
  iranCode: '',
  category: '',
  subCategory: '',
  brand: '',
  series: '',
  model: '',
  condition: 'new',
  priceToman: '',
  salePriceToman: '',
  costToman: '',
  stockStatus: 'in_stock',
  stock: '',
  lowStockThreshold: 3,
  preparationDays: 1,
  focusKeyword: '',
  seoTitle: '',
  seoDescription: '',
  canonicalUrl: '',
  shortDescription: '',
  longDescription: '',
  priceCurrency: 'IRR',
  activeSchemas: ['Product', 'Offer', 'BreadcrumbList', 'FAQPage'],
  customEmojis: [],
};

export const INITIAL_ATTRIBUTES: Attribute[] = [];

export const INITIAL_FAQS: ProductFaq[] = [];
