import { tomanToRial } from '@/lib/money';
import { resolveOfferPriceToman } from '@/lib/seo/product-offer';
import type { ProductDraft, ProductFaq } from '../product-editor.types';
import { EditorField, editorInputClass } from '../components/EditorField';
import { EditorSection, editorSurfaceClass } from '../components/EditorSection';
import { FaqEditor } from '../components/FaqEditor';
import { JsonLdPreview } from '../components/JsonLdPreview';

function jsonLdPriceHint(draft: ProductDraft): string {
  const toman = resolveOfferPriceToman(draft.priceToman, draft.salePriceToman);
  if (toman === undefined) {
    return 'تا قیمت در تب قیمت و موجودی وارد نشود، بلوک offers ساخته نمی‌شود.';
  }
  return `${toman.toLocaleString('fa-IR')} تومان → ${tomanToRial(toman).toLocaleString('fa-IR')} ریال در offers.price`;
}

export function SeoPanel({ draft, set, faqs, onFaqsChange, schema }: { draft: ProductDraft; set: <K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) => void; faqs: ProductFaq[]; onFaqsChange: (faqs: ProductFaq[]) => void; schema: unknown }) {
  return <>
    <EditorSection title="متا و کنترل ایندکس" hint="پیش‌نمایش زنده نتیجه جستجو"><div className={`${editorSurfaceClass} grid gap-4 p-4`}>
      <EditorField label="عنوان سئو" required hint={`${draft.seoTitle.length.toLocaleString('fa-IR')} از ۶۰ کاراکتر`}><input className={editorInputClass} maxLength={60} value={draft.seoTitle} onChange={e => set('seoTitle', e.target.value)} /></EditorField>
      <EditorField label="توضیحات متا" required hint={`${draft.seoDescription.length.toLocaleString('fa-IR')} از ۱۶۰ کاراکتر`}><textarea className={editorInputClass} maxLength={160} value={draft.seoDescription} onChange={e => set('seoDescription', e.target.value)} /></EditorField>
      <EditorField label="کلمه کلیدی اصلی" required><input className={editorInputClass} value={draft.focusKeyword} onChange={e => set('focusKeyword', e.target.value)} /></EditorField>
      <EditorField label="Canonical URL"><input dir="ltr" className={editorInputClass} value={draft.canonicalUrl} onChange={e => set('canonicalUrl', e.target.value)} placeholder="خالی = self-canonical" /></EditorField>
    </div></EditorSection>
    <EditorSection title="JSON-LD" hint="خودکار از قیمت و موجودی؛ دستی ویرایش نکنید">
      <JsonLdPreview value={schema} caption={jsonLdPriceHint(draft)} />
    </EditorSection>
    <EditorSection title="سوالات متداول" hint="فقط سوالات نمایش‌داده‌شده به FAQ Schema بروند"><FaqEditor faqs={faqs} onChange={onFaqsChange} /></EditorSection>
  </>;
}
