export type TabKey =
  | 'base'
  | 'commerce'
  | 'specs'
  | 'media'
  | 'content'
  | 'seo'
  | 'logistics';

export type ProductCondition = 'new' | 'used' | 'refurbished' | 'stock';
export type StockStatus = 'in_stock' | 'out_of_stock' | 'pre_order' | 'coming_soon';

export type ProductImage = {
  id: string;
  file?: File;
  preview: string;
  alt: string;
  title: string;
  sortOrder: number;
};

export type Attribute = {
  id: string;
  group: string;
  name: string;
  value: string;
  unit: string;
  filterable: boolean;
  comparable: boolean;
  inSchema: boolean;
};

export type ProductFaq = {
  id: string;
  question: string;
  answer: string;
  visible: boolean;
  inSchema: boolean;
};

export type ProductDraft = {
  name: string;
  nameEn: string;
  slug: string;
  sku: string;
  mpn: string;
  gtin: string;
  iranCode: string;
  category: string;
  subCategory: string;
  brand: string;
  series: string;
  model: string;
  condition: ProductCondition;
  priceToman: number | '';
  salePriceToman: number | '';
  costToman: number | '';
  stockStatus: StockStatus;
  stock: number | '';
  lowStockThreshold: number | '';
  preparationDays: number | '';
  focusKeyword: string;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  shortDescription: string;
  longDescription: string;
  priceCurrency: 'IRR';
  activeSchemas: string[];
  customEmojis: string[];
};

export type ProductEditorState = {
  draft: ProductDraft;
  attributes: Attribute[];
  images: ProductImage[];
  faqs: ProductFaq[];
};

export type SeoChecks = Record<string, boolean>;

export type ProductEditorProps = {
  initialValue?: Partial<ProductEditorState>;
  onSave?: (state: ProductEditorState) => Promise<void> | void;
  onPublish?: (state: ProductEditorState) => Promise<void> | void;
};

export type EditorTable = { rows: number; columns: number; headerRow: boolean };
