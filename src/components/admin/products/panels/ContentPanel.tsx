'use client'

import dynamic from 'next/dynamic'
import type { ProductDraft } from '../product-editor.types'
import { EditorField, editorInputClass } from '../components/EditorField'
import { EditorSection, editorSurfaceClass } from '../components/EditorSection'
import { wordCount } from '../product-editor.utils'

const RichTextEditor = dynamic(
  () => import('../components/RichTextEditor').then((m) => m.RichTextEditor),
  {
    ssr: false,
    loading: () => <div className="min-h-[220px] animate-pulse rounded-xl bg-surface-2" aria-busy="true" aria-label="در حال بارگذاری ویرایشگر" />,
  }
)

type ContentPanelProps = {
  draft: ProductDraft;
  set: <K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) => void;
  uploadImage?: (file: File) => Promise<string>;
  customEmojis?: string[];
  onAddEmoji?: (emoji: string) => Promise<void> | void;
};

export function ContentPanel({ draft, set, uploadImage, customEmojis, onAddEmoji }: ContentPanelProps) {
  return (
    <EditorSection title="محتوای فروش" hint="H1 داخل ادیتور ممنوع است">
      <div className={`${editorSurfaceClass} grid gap-4 p-4`}>
        <EditorField label="توضیح کوتاه" required>
          <textarea
            className={editorInputClass}
            value={draft.shortDescription}
            onChange={(e) => set('shortDescription', e.target.value)}
            placeholder="پرینتر لیزری تک‌رنگ HP M402dne..."
          />
        </EditorField>
        <EditorField
          label="توضیح کامل"
          required
          hint={`${wordCount(draft.longDescription).toLocaleString('fa-IR')} کلمه، حداقل پیشنهادی ۸۰۰ کلمه`}
        >
          <RichTextEditor
            value={draft.longDescription}
            onChange={(html) => set('longDescription', html)}
            uploadImage={uploadImage}
            customEmojis={customEmojis}
            onAddEmoji={onAddEmoji}
          />
        </EditorField>
      </div>
    </EditorSection>
  );
}
