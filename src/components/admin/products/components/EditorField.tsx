import type { ReactNode } from 'react';

export function EditorField({
  label,
  required,
  hint,
  children,
  className = '',
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <span className="text-xs font-medium text-[hsl(240_5%_78%)]">
        {label} {required && <b className="text-[hsl(var(--primary-bright))]">*</b>}
      </span>
      {children}
      {hint && <span className="text-[11px] leading-5 text-[hsl(var(--muted-foreground))]">{hint}</span>}
    </label>
  );
}

export const editorInputClass = 'min-h-10 w-full rounded-[var(--radius-md)] border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-3 text-sm text-[hsl(var(--foreground))] outline-none transition focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary)/.16)]';
