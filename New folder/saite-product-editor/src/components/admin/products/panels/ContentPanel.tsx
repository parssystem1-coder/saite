import type { ProductDraft } from '../product-editor.types';
import { EditorField, editorInputClass } from '../components/EditorField';
import { EditorSection, editorSurfaceClass } from '../components/EditorSection';
import { wordCount } from '../product-editor.utils';

export function ContentPanel({ draft, set }: { draft: ProductDraft; set: <K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) => void }) {
  return <EditorSection title="محتوای فروش" hint="H1 داخل ادیتور ممنوع است"><div className={`${editorSurfaceClass} grid gap-4 p-4`}>
    <EditorField label="توضیح کوتاه" required><textarea className={editorInputClass} value={draft.shortDescription} onChange={e => set('shortDescription', e.target.value)} placeholder="پرینتر لیزری تک‌رنگ HP M402dne..." /></EditorField>
    <EditorField label="توضیح کامل" required hint={`${wordCount(draft.longDescription).toLocaleString('fa-IR')} کلمه، حداقل پیشنهادی ۸۰۰ کلمه`}><textarea className={`${editorInputClass} min-h-64`} value={draft.longDescription} onChange={e => set('longDescription', e.target.value)} placeholder="H2: بررسی پرینتر HP M402dne..." /></EditorField>
  </div></EditorSection>;
}
