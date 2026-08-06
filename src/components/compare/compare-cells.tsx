import { cn } from '@/lib/utils'

interface CompareRowProps {
  label: string
  children: React.ReactNode
  surface?: boolean
}

export function CompareRow({ label, children, surface }: CompareRowProps) {
  const bgClass = surface ? 'bg-surface-1' : 'bg-surface-0'
  return (
    <tr className={bgClass}>
      <th
        scope="row"
        className={cn(
          'sticky start-0 z-10 p-3 sm:p-4 text-right align-top text-xs font-bold text-muted-foreground shadow-[-4px_0_12px_rgba(0,0,0,0.35)]',
          bgClass
        )}
      >
        {label}
      </th>
      {children}
    </tr>
  )
}

export function CompareCell({ children }: { children: React.ReactNode }) {
  return <td className="p-3 sm:p-4 text-center align-top text-foreground">{children}</td>
}

export function CompareDash() {
  return <span className="text-muted-foreground/40">—</span>
}
