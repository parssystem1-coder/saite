'use client';

import { useMemo, useState } from 'react';
import type { ProductEditorProps, ProductEditorState, ProductDraft, TabKey } from './product-editor.types';
import { INITIAL_ATTRIBUTES, INITIAL_DRAFT, INITIAL_FAQS } from './product-editor.constants';
import { buildProductSchema, getSeoChecks, getSeoScore } from './product-editor.utils';
import { ProductTabs } from './components/ProductTabs';
import { ProductSidebar } from './components/ProductSidebar';
import { BasePanel } from './panels/BasePanel';
import { CommercePanel } from './panels/CommercePanel';
import { SpecsPanel } from './panels/SpecsPanel';
import { MediaPanel } from './panels/MediaPanel';
import { ContentPanel } from './panels/ContentPanel';
import { SeoPanel } from './panels/SeoPanel';
import { LogisticsPanel } from './panels/LogisticsPanel';

export default function ProductEditor({ initialValue, onSave, onPublish }: ProductEditorProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('base');
  const [draft, setDraft] = useState<ProductDraft>({ ...INITIAL_DRAFT, ...initialValue?.draft });
  const [attributes, setAttributes] = useState(initialValue?.attributes ?? INITIAL_ATTRIBUTES);
  const [images, setImages] = useState(initialValue?.images ?? []);
  const [faqs, setFaqs] = useState(initialValue?.faqs ?? INITIAL_FAQS);
  const [status, setStatus] = useState('پیش‌نویس');
  const [saving, setSaving] = useState(false);
  const [customEmojis, setCustomEmojis] = useState<string[]>(initialValue?.draft?.customEmojis ?? []);
  const uploadImage = async (file: File) => { const form = new FormData(); form.append('file', file); const response = await fetch('/api/admin/media', { method: 'POST', body: form }); if (!response.ok) throw new Error('آپلود تصویر ناموفق بود'); const data = await response.json() as { url: string }; return data.url; };
  const addCustomEmoji = async (emoji: string) => { const response = await fetch('/api/admin/emojis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ emoji }) }); if (!response.ok) throw new Error('ذخیره ایموجی ناموفق بود'); const data = await response.json() as { emojis: string[] }; setCustomEmojis(data.emojis); };

  const set = <K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) => setDraft(current => ({ ...current, [key]: value }));
  const state: ProductEditorState = { draft: { ...draft, customEmojis }, attributes, images, faqs };
  const checks = useMemo(() => getSeoChecks(draft, images, faqs), [draft, images, faqs]);
  const score = useMemo(() => getSeoScore(checks), [checks]);
  const schema = useMemo(() => buildProductSchema(draft, attributes, images), [draft, attributes, images]);
  const badges = { base: 0, commerce: draft.priceToman === '' || draft.stock === '' ? 1 : 0, specs: attributes.filter(attribute => !attribute.value).length, media: Math.max(0, 3 - images.length) + images.filter(image => !image.alt).length, content: draft.longDescription ? 0 : 1, seo: Object.values(checks).filter(value => !value).length, logistics: 0 };

  const save = async (publish = false) => {
    setSaving(true);
    try {
      if (publish) await onPublish?.(state);
      else await onSave?.(state);
      setStatus(publish ? 'منتشر شده' : 'پیش‌نویس');
    } finally { setSaving(false); }
  };

  return <div dir="rtl" className="min-h-screen bg-[hsl(var(--background))] pb-24 text-[hsl(var(--foreground))]">
    <header className="sticky top-0 z-30 border-b border-[hsl(var(--border))] bg-[hsl(var(--surface-1)/.96)]"><div className="mx-auto flex max-w-[1540px] items-center gap-4 px-4 py-3 lg:px-8"><b>Saite Admin</b><div className="h-6 w-px bg-[hsl(var(--border))]" /><div className="min-w-0 flex-1"><h1 className="truncate text-base font-bold">{draft.name || 'افزودن محصول جدید'}</h1><p className="text-[11px] text-[hsl(var(--muted-foreground))]">محصول تک‌کاره، لیزری، تک‌رنگ</p></div><span className="text-xs text-[hsl(var(--muted-foreground))]">{saving ? 'در حال ذخیره...' : 'ذخیره خودکار فعال'}</span></div></header>
    <div className="mx-auto grid max-w-[1540px] gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:px-8"><main className="min-w-0"><ProductTabs activeTab={activeTab} onChange={setActiveTab} badges={badges} />{activeTab === 'base' && <BasePanel draft={draft} set={set} />}{activeTab === 'commerce' && <CommercePanel draft={draft} set={set} />}{activeTab === 'specs' && <SpecsPanel attributes={attributes} onChange={setAttributes} />}{activeTab === 'media' && <MediaPanel images={images} onChange={setImages} />}{activeTab === 'content' && <ContentPanel draft={draft} set={set} uploadImage={uploadImage} customEmojis={customEmojis} onAddEmoji={addCustomEmoji} />}{activeTab === 'seo' && <SeoPanel draft={draft} set={set} faqs={faqs} onFaqsChange={setFaqs} schema={schema} />}{activeTab === 'logistics' && <LogisticsPanel />}</main><ProductSidebar score={score} checks={checks} imageCount={images.length} attributeCount={attributes.length} schemaCount={draft.activeSchemas.length} status={status} onStatusChange={setStatus} /></div>
    <footer className="fixed bottom-0 right-0 left-0 z-30 border-t border-[hsl(var(--border))] bg-[hsl(var(--surface-1)/.97)]"><div className="mx-auto flex max-w-[1540px] items-center gap-2 px-4 py-3 lg:px-8"><span className="text-xs text-[hsl(var(--muted-foreground))]">{score < 70 ? `${Object.values(checks).filter(value => !value).length} مورد تا انتشار باقی مانده` : 'آماده انتشار'}</span><span className="flex-1" /><button type="button" disabled={saving} onClick={() => save(false)} className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface-3))] px-4 py-2 text-xs">ذخیره پیش‌نویس</button><button type="button" disabled={saving || score < 70} onClick={() => save(true)} className="rounded-md bg-[hsl(var(--primary))] px-4 py-2 text-xs font-bold text-[hsl(var(--primary-foreground))]">انتشار محصول</button></div></footer>
  </div>;
}
