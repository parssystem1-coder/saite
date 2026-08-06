import type { Attribute, ProductDraft, ProductFaq, TabKey } from './product-editor.types';

export const PRODUCT_TABS: Array<{ id: TabKey; label: string }> = [
  { id: 'base', label: 'پایه' },
  { id: 'commerce', label: 'قیمت و موجودی' },
  { id: 'specs', label: 'مشخصات فنی' },
  { id: 'media', label: 'رسانه' },
  { id: 'content', label: 'محتوا' },
  { id: 'seo', label: 'سئو و اسکیما' },
  { id: 'logistics', label: 'خدمات و ارتباطات' },
];

export const INITIAL_DRAFT: ProductDraft = {
  name: '',
  nameEn: '',
  slug: '',
  sku: '',
  mpn: 'C5J91A',
  gtin: '',
  iranCode: '',
  category: 'printer-laser-hp',
  brand: 'HP',
  series: 'LaserJet Pro',
  model: 'M402dne',
  condition: 'new',
  priceToman: 72000000,
  salePriceToman: '',
  costToman: '',
  stockStatus: 'in_stock',
  stock: '',
  lowStockThreshold: 3,
  preparationDays: 1,
  focusKeyword: 'پرینتر اچ پی M402dne',
  seoTitle: '',
  seoDescription: '',
  canonicalUrl: '',
  shortDescription: '',
  longDescription: '',
  priceCurrency: 'IRR',
  activeSchemas: ['Product', 'Offer', 'BreadcrumbList', 'FAQPage'],
  customEmojis: [],
};

export const INITIAL_ATTRIBUTES: Attribute[] = [
  { id: 'print-tech', group: 'چاپ و عملکرد', name: 'تکنولوژی چاپ', value: 'لیزری', unit: '', filterable: true, comparable: true, inSchema: true },
  { id: 'print-type', group: 'چاپ و عملکرد', name: 'نوع چاپ', value: 'تک‌رنگ', unit: '', filterable: true, comparable: true, inSchema: true },
  { id: 'speed', group: 'چاپ و عملکرد', name: 'سرعت چاپ A4', value: '38', unit: 'ppm', filterable: true, comparable: true, inSchema: true },
  { id: 'resolution', group: 'چاپ و عملکرد', name: 'رزولوشن چاپ', value: '1200 × 1200', unit: 'dpi', filterable: false, comparable: true, inSchema: true },
  { id: 'duplex', group: 'چاپ و عملکرد', name: 'چاپ دورو خودکار', value: 'دارد', unit: '', filterable: true, comparable: true, inSchema: true },
  { id: 'network', group: 'اتصالات', name: 'اتصال شبکه', value: 'Gigabit Ethernet', unit: '', filterable: true, comparable: true, inSchema: true },
  { id: 'wifi', group: 'اتصالات', name: 'وای‌فای', value: 'ندارد', unit: '', filterable: true, comparable: true, inSchema: true },
  { id: 'paper-size', group: 'کاغذ', name: 'سایز چاپ', value: 'A4', unit: '', filterable: true, comparable: true, inSchema: true },
];

export const INITIAL_FAQS: ProductFaq[] = [
  {
    id: 'faq-1',
    question: 'آیا پرینتر HP M402dne وای‌فای دارد؟',
    answer: 'خیر. این مدل از شبکه گیگابیت اترنت و USB استفاده می‌کند.',
    visible: true,
    inSchema: true,
  },
];
