import type { ProductDraft } from '../product-editor.types';
import { EditorField, editorInputClass } from '../components/EditorField';
import { EditorSection, editorSurfaceClass } from '../components/EditorSection';
import { BRANDS, CATEGORIES } from '@/lib/constants';

export function BasePanel({ draft, set }: { draft: ProductDraft; set: <K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) => void }) {
  return <>
    <EditorSection title="شناسه و نام‌گذاری" hint="اطلاعات پایه برای URL و داده ساختاریافته"><div className={`${editorSurfaceClass} grid gap-4 p-4 md:grid-cols-2`}>
      <EditorField label="نام فارسی محصول" required className="md:col-span-2" hint="این مقدار H1 صفحه می‌شود."><input className={editorInputClass} value={draft.name} onChange={e => set('name', e.target.value)} placeholder="پرینتر لیزری اچ پی مدل LaserJet Pro M402dne" /></EditorField>
      <EditorField label="نام انگلیسی" required><input dir="ltr" className={editorInputClass} value={draft.nameEn} onChange={e => set('nameEn', e.target.value)} placeholder="HP LaserJet Pro M402dne Laser Printer" /></EditorField>
      <EditorField label="نامک (Slug)" required hint="فقط حروف انگلیسی، عدد و خط تیره"><input dir="ltr" className={editorInputClass} value={draft.slug} onChange={e => set('slug', e.target.value)} placeholder="hp-laserjet-pro-m402dne" /></EditorField>
      <EditorField label="SKU" required><input dir="ltr" className={editorInputClass} value={draft.sku} onChange={e => set('sku', e.target.value)} placeholder="BP-HP-M402DNE" /></EditorField>
      <EditorField label="MPN"><input dir="ltr" className={editorInputClass} value={draft.mpn} onChange={e => set('mpn', e.target.value)} /></EditorField>
      <EditorField label="GTIN-13"><input dir="ltr" className={editorInputClass} value={draft.gtin} onChange={e => set('gtin', e.target.value)} /></EditorField>
    </div></EditorSection>
    <EditorSection title="دسته، برند و وضعیت"><div className={`${editorSurfaceClass} grid gap-4 p-4 md:grid-cols-2`}>
      <EditorField label="دسته اصلی" required>
        <select
          className={editorInputClass}
          value={draft.category}
          onChange={(e) => {
            const newCat = e.target.value
            set('category', newCat)
            const catObj = CATEGORIES.find((c) => c.slug === newCat)
            const firstSub = catObj?.subCategories?.[0]?.slug ?? ''
            set('subCategory', firstSub)
          }}
        >
          <option value="">انتخاب دسته‌بندی اصلی...</option>
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name} ({c.slug})
            </option>
          ))}
        </select>
      </EditorField>
      <EditorField label="زیردسته (تخصصی)" hint="مرتبط با دسته اصلی انتخاب‌شده">
        <select
          className={editorInputClass}
          value={draft.subCategory || ''}
          onChange={(e) => set('subCategory', e.target.value)}
        >
          <option value="">بدون زیردسته / عمومی</option>
          {CATEGORIES.find((c) => c.slug === draft.category)?.subCategories?.map((sub) => (
            <option key={sub.slug} value={sub.slug}>
              {sub.name} ({sub.slug})
            </option>
          ))}
        </select>
      </EditorField>
      <EditorField label="برند" required>
        <select className={editorInputClass} value={draft.brand} onChange={e => set('brand', e.target.value)}>
          <option value="">انتخاب برند...</option>
          {BRANDS.map(b => <option key={b.slug} value={b.displayName}>{b.displayName} / {b.name}</option>)}
        </select>
      </EditorField>
      <EditorField label="سری محصول"><input className={editorInputClass} value={draft.series} onChange={e => set('series', e.target.value)} /></EditorField>
      <EditorField label="مدل" className="md:col-span-2"><input dir="ltr" className={editorInputClass} value={draft.model} onChange={e => set('model', e.target.value)} /></EditorField>
    </div></EditorSection>
  </>;
}
