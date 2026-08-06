export function JsonLdPreview({ value }: { value: unknown }) {
  return <pre dir="ltr" className="max-h-96 overflow-auto rounded-[var(--radius-md)] border border-[hsl(var(--border))] bg-[hsl(var(--surface-0))] p-4 text-left text-xs leading-6 text-[hsl(var(--muted-foreground))]">{JSON.stringify(value, null, 2)}</pre>;
}
