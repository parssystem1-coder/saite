import type { ProductEditorState } from '@/components/admin/products/product-editor.types';

export type ProductEditorAdapter = {
  saveDraft: (state: ProductEditorState) => Promise<{ id: string; status: 'draft' | 'published' }>;
  publish: (state: ProductEditorState) => Promise<{ id: string; status: 'published' }>;
  uploadImage: (file: File) => Promise<{ url: string; name: string; width?: number; height?: number }>;
  listEmojis: () => Promise<string[]>;
  addEmoji: (emoji: string) => Promise<string[]>;
  getVersions: (productId?: string) => Promise<Array<{ id: string; label: string; createdAt: string }>>;
  restoreVersion: (versionId: string) => Promise<void>;
  duplicate: (state: ProductEditorState) => Promise<{ id: string }>;
};

export type ProductEditorAdapterOptions = {
  storageKey?: string;
  uploadDelayMs?: number;
};
