import { cn } from '@/lib/utils'

interface CompareRowProps {
  label: string
  children: React.ReactNode
  surface?: boolean
}

export function CompareRow({ label, children, surface }: CompareRowProps) {
  return (
    <tr className={cn(surface ? 'bg-surface-1/60' : 'bg-surface-0/40')}>
      <th scope="row" className="p-4 text-right align-top text-xs font-bold text-muted-foreground">
        {label}
      </th>
      {children}
    </tr>
  )
}

export function CompareCell({ children }: { children: React.ReactNode }) {
  return <td className="p-4 text-center align-top text-foreground">{children}</td>
}

export function CompareDash() {
  return <span className="text-muted-foreground/40">—</span>
}
