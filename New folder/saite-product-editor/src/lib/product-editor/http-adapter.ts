import type { ProductEditorState } from '@/components/admin/products/product-editor.types';
import type { ProductEditorAdapter } from './adapter.types';

export function createHttpProductEditorAdapter(baseUrl = ''): ProductEditorAdapter {
  const json = async <T,>(url: string, init?: RequestInit): Promise<T> => { const response = await fetch(`${baseUrl}${url}`, init); if (!response.ok) throw new Error(`Request failed: ${response.status}`); return response.json() as Promise<T>; };
  return {
    saveDraft: state => json('/api/admin/products/draft', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...state, publish: false }) }),
    publish: state => json('/api/admin/products/draft', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...state, publish: true }) }),
    uploadImage: async file => { const body = new FormData(); body.append('file', file); return json('/api/admin/media', { method: 'POST', body }); },
    listEmojis: async () => (await json<{ emojis: string[] }>('/api/admin/emojis')).emojis,
    addEmoji: async emoji => (await json<{ emojis: string[] }>('/api/admin/emojis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ emoji }) })).emojis,
    getVersions: () => json('/api/admin/products/versions'),
    restoreVersion: versionId => json(`/api/admin/products/versions/${versionId}`, { method: 'POST' }).then(() => undefined),
    duplicate: state => json('/api/admin/products/duplicate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(state) }),
  };
}
