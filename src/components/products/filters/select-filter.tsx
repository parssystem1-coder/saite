'use client'

interface SelectOption {
  value: string
  label: string
}

interface SelectFilterProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
}

export function SelectFilter({ id, label, value, onChange, options }: SelectFilterProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-xs font-bold text-muted-foreground">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-xl border border-border bg-input px-3 text-sm shadow-[inset_0_2px_4px_hsl(0_0%_0%/0.35)] outline-none focus-visible:border-primary/60"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}
