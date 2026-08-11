import type { ProductEditorAdapter } from './adapter.types'
import { retryAsync } from '@/lib/retry-utils'

export function createHttpProductEditorAdapter(baseUrl = '', timeoutMs = 15_000): ProductEditorAdapter {
  const json = async <T,>(url: string, init?: RequestInit): Promise<T> => {
    return await retryAsync(
      async () => {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), timeoutMs)
        try {
          const response = await fetch(`${baseUrl}${url}`, { ...init, signal: controller.signal })
          if (!response.ok) {
            let detail: unknown
            try { detail = await response.json() } catch { detail = await response.text().catch(() => undefined) }
            const error = new Error(`Request failed: ${response.status}`) as Error & { status?: number; detail?: unknown }
            error.status = response.status
            error.detail = detail
            throw error
          }
          return (await response.json()) as T
        } catch (cause) {
          if (cause instanceof Error && cause.name === 'AbortError') {
            throw new Error(`Request timeout after ${timeoutMs}ms: ${url}`)
          }
          throw cause
        } finally {
          clearTimeout(timer)
        }
      },
      { maxRetries: 3, initialDelayMs: 500, maxDelayMs: 5000 }
    )
  }
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
