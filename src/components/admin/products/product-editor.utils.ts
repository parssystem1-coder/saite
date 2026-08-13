import { tomanToRial } from '@/lib/money';
import { buildProductOfferLd } from '@/lib/seo/product-offer';
import type { Attribute, ProductDraft, ProductFaq, ProductImage, SeoChecks } from './product-editor.types';

export { tomanToRial };

export const uid = () => Math.random().toString(36).slice(2, 10);

export const wordCount = (value: string) => value.trim() ? value.trim().split(/\s+/).length : 0;

export const isValidSlug = (slug: string) => /^[a-z0-9-]{3,}$/.test(slug);

export const getSeoChecks = (
  draft: ProductDraft,
  images: ProductImage[],
  faqs: ProductFaq[],
): SeoChecks => ({
  'کلمه کلیدی اصلی': Boolean(draft.focusKeyword.trim()),
  'عنوان سئو مناسب': draft.seoTitle.length >= 45 && draft.seoTitle.length <= 60 && draft.seoTitle.includes(draft.focusKeyword),
  'توضیحات متا مناسب': draft.seoDescription.length >= 110 && draft.seoDescription.length <= 160 && draft.seoDescription.includes(draft.focusKeyword),
  'نامک معتبر': isValidSlug(draft.slug),
  'کلمه در نام محصول': draft.name.includes(draft.focusKeyword),
  'محتوای کامل': wordCount(draft.longDescription) >= 800,
  'حداقل ۳ تصویر': images.length >= 3,
  'Alt تصاویر': images.length > 0 && images.every(image => image.alt.trim().length > 2),
  'سوالات متداول': faqs.filter(faq => faq.question.trim() && faq.answer.trim()).length >= 3,
});

export const getSeoScore = (checks: SeoChecks) => {
  const values = Object.values(checks);
  return values.length ? Math.round(values.filter(Boolean).length / values.length * 100) : 0;
};

export const buildProductSchema = (
  draft: ProductDraft,
  attributes: Attribute[],
  images: ProductImage[],
) => {
  const offers = buildProductOfferLd({
    priceToman: draft.priceToman,
    salePriceToman: draft.salePriceToman,
    stockStatus: draft.stockStatus,
    condition: draft.condition,
    url: draft.canonicalUrl.trim() || undefined,
  });

  return {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: draft.name || undefined,
    alternateName: draft.nameEn || undefined,
    sku: draft.sku || undefined,
    mpn: draft.mpn || undefined,
    gtin13: draft.gtin || undefined,
    brand: { '@type': 'Brand', name: draft.brand },
    // blob: URLs فقط پیش‌نمایش جلسه هستند — نباید وارد JSON-LD منتشرشده شوند
    image: images.map(image => image.preview).filter(url => !url.startsWith('blob:')),
    description: draft.shortDescription || undefined,
    additionalProperty: attributes
      .filter(attribute => attribute.inSchema && attribute.name.trim())
      .map(attribute => ({
        '@type': 'PropertyValue',
        name: attribute.name,
        value: `${attribute.value}${attribute.unit ? ` ${attribute.unit}` : ''}`,
      })),
    ...(offers ? { offers } : {}),
  };
};
