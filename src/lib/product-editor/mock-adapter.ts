import type { ProductEditorAdapter, ProductEditorAdapterOptions } from './adapter.types';
import { PRODUCT_EDITOR_STORAGE } from './constants';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const key = (name: string) => `saite.product-editor.${name}`;
const read = <T,>(name: string, fallback: T): T => { if (typeof window === 'undefined') return fallback; try { const raw = localStorage.getItem(key(name)); return raw ? JSON.parse(raw) as T : fallback; } catch { return fallback; } };
const write = (name: string, value: unknown) => { if (typeof window !== 'undefined') localStorage.setItem(key(name), JSON.stringify(value)); };

export function createMockProductEditorAdapter(options: ProductEditorAdapterOptions = {}): ProductEditorAdapter {
  const delay = options.uploadDelayMs ?? 450;
  return {
    async saveDraft(state) { await wait(250); const id = read<string>(PRODUCT_EDITOR_STORAGE.productId, crypto.randomUUID()); write(PRODUCT_EDITOR_STORAGE.productId, id); write(options.storageKey ?? PRODUCT_EDITOR_STORAGE.draft, { ...state, savedAt: new Date().toISOString() }); return { id, status: 'draft' }; },
    async publish(state) { await wait(300); const id = read<string>(PRODUCT_EDITOR_STORAGE.productId, crypto.randomUUID()); write(PRODUCT_EDITOR_STORAGE.productId, id); write(PRODUCT_EDITOR_STORAGE.published, { ...state, publishedAt: new Date().toISOString() }); return { id, status: 'published' }; },
    async uploadImage(file) { await wait(delay); const url = URL.createObjectURL(file); return { url, name: file.name }; },
    async listEmojis() { return read<string[]>('emojis', ['⚡','✅','⭐','📦','🖨️','📄','🚚','💡','🔥','🎯','🛒']); },
    async addEmoji(emoji) { await wait(100); const emojis = Array.from(new Set([...read<string[]>('emojis', []), emoji])); write('emojis', emojis); return emojis; },
    async getVersions() { return read('versions', [{ id: 'local-current', label: 'نسخه فعلی', createdAt: new Date().toISOString() }]); },
    async restoreVersion() { await wait(150); },
    async duplicate(state) { await wait(250); const id = crypto.randomUUID(); write(`duplicate-${id}`, state); return { id }; },
  };
}
