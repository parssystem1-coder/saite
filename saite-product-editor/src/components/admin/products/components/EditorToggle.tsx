export function EditorToggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (value: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex min-h-10 cursor-pointer items-center gap-2">
      <input className="peer sr-only" type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} />
      <span className="relative h-5 w-9 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--surface-3))] transition peer-checked:bg-[hsl(var(--primary))] after:absolute after:right-0.5 after:top-0.5 after:h-3.5 after:w-3.5 after:rounded-full after:bg-[hsl(var(--muted-foreground))] after:transition peer-checked:after:-translate-x-4 peer-checked:after:bg-white" />
      <span className="text-xs">{label}{hint && <small className="block text-[10px] text-[hsl(var(--muted-foreground))]">{hint}</small>}</span>
    </label>
  );
}
