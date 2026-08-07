import type { ReactNode } from 'react';

export function EditorSection({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="mb-8">
      <div className="mb-4 flex items-baseline gap-2 border-b border-[hsl(var(--border))] pb-2.5">
        <h2 className="text-base font-bold">{title}</h2>
        {hint && <span className="text-xs text-[hsl(var(--muted-foreground))]">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

export const editorSurfaceClass = 'rounded-[var(--radius-lg)] border border-[hsl(var(--border))] bg-[hsl(var(--surface-1))] shadow-[var(--shadow-depth-2)]';
