export function JsonLdPreview({ value, caption }: { value: unknown; caption?: string }) {
  return (
    <div className="space-y-2">
      {caption ? <p className="text-xs text-[hsl(var(--muted-foreground))]">{caption}</p> : null}
      <pre dir="ltr" className="max-h-96 overflow-auto rounded-[var(--radius-md)] border border-[hsl(var(--border))] bg-[hsl(var(--surface-0))] p-4 text-left text-xs leading-6 text-[hsl(var(--muted-foreground))]">{JSON.stringify(value, null, 2)}</pre>
    </div>
  );
}
