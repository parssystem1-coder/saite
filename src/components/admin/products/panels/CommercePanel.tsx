import type { ChangeEvent } from 'react';
import type { ProductDraft } from '../product-editor.types';
import { EditorField, editorInputClass } from '../components/EditorField';
import { EditorSection, editorSurfaceClass } from '../components/EditorSection';
import { EditorToggle } from '../components/EditorToggle';
import { tomanToRial } from '../product-editor.utils';

export function CommercePanel({ draft, set }: { draft: ProductDraft; set: <K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) => void }) {
  const numeric = (key: 'priceToman' | 'salePriceToman' | 'costToman' | 'stock' | 'lowStockThreshold' | 'preparationDays') => (event: ChangeEvent<HTMLInputElement>) => set(key, event.target.value === '' ? '' : Number(event.target.value));
  return <>
    <EditorSection title="قیمت‌گذاری" hint="ذخیره در API به ریال، نمایش به تومان"><div className={`${editorSurfaceClass} grid gap-4 p-4 md:grid-cols-3`}>
      <EditorField label="قیمت مصرف‌کننده" required hint={draft.priceToman !== '' ? `${tomanToRial(draft.priceToman).toLocaleString('fa-IR')} ریال در API` : undefined}><input className={editorInputClass} type="number" value={draft.priceToman} onChange={numeric('priceToman')} /></EditorField>
      <EditorField label="قیمت تخفیف"><input className={editorInputClass} type="number" value={draft.salePriceToman} onChange={numeric('salePriceToman')} /></EditorField>
      <EditorField label="قیمت خرید"><input className={editorInputClass} type="number" value={draft.costToman} onChange={numeric('costToman')} /></EditorField>
    </div></EditorSection>
    <EditorSection title="موجودی و سفارش"><div className={`${editorSurfaceClass} grid gap-4 p-4 md:grid-cols-3`}>
      <EditorField label="وضعیت موجودی" required><select className={editorInputClass} value={draft.stockStatus} onChange={e => set('stockStatus', e.target.value as ProductDraft['stockStatus'])}><option value="in_stock">موجود</option><option value="out_of_stock">ناموجود</option><option value="on_request">تماس بگیرید</option><option value="pre_order">پیش‌سفارش</option><option value="coming_soon">به‌زودی</option></select></EditorField>
      <EditorField label="تعداد موجودی" required><input className={editorInputClass} type="number" value={draft.stock} onChange={numeric('stock')} /></EditorField>
      <EditorField label="آستانه هشدار"><input className={editorInputClass} type="number" value={draft.lowStockThreshold} onChange={numeric('lowStockThreshold')} /></EditorField>
      <EditorField label="زمان آماده‌سازی"><input className={editorInputClass} type="number" value={draft.preparationDays} onChange={numeric('preparationDays')} /></EditorField>
      <EditorToggle checked label="مدیریت خودکار موجودی" hint="بعد از سفارش کم شود" onChange={() => undefined} />
    </div></EditorSection>
  </>;
}
