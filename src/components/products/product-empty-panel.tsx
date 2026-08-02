import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface ProductEmptyPanelProps {
  title: string
  body: string
}

/** حالت خالی تب‌های محصول (نظرات / FAQ بدون محتوا) */
export function ProductEmptyPanel({ title, body }: ProductEmptyPanelProps) {
  return (
    <div className="surface-3d max-w-2xl rounded-2xl p-8 text-center">
      <p className="text-sm font-bold text-foreground">{title}</p>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{body}</p>
      <Button variant="outline" size="sm" className="mt-5" asChild>
        <Link href="/contact">تماس با کارشناسان</Link>
      </Button>
    </div>
  )
}
