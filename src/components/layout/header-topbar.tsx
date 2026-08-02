import { Clock, Phone } from 'lucide-react'
import Link from 'next/link'
import { SITE } from '@/lib/constants'

/** نوار باریک بالای هدر — ساعات کاری و تماس (فقط دسکتاپ) */
export function HeaderTopbar() {
  return (
    <div className="hidden border-b border-border bg-surface-0/90 backdrop-blur-md md:block">
      <div className="container mx-auto flex h-9 items-center justify-between px-4 text-xs">
        <p className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="size-3.5" aria-hidden="true" />
          {SITE.workingHours}
        </p>
        <div className="flex items-center gap-4">
          <Link
            href="/contact"
            className="text-muted-foreground transition-colors hover:text-primary"
          >
            استعلام قیمت
          </Link>
          <a
            href={`tel:${SITE.phoneLtr}`}
            className="flex items-center gap-1.5 font-bold text-primary transition-colors hover:text-primary-bright"
          >
            <Phone className="size-3.5" aria-hidden="true" />
            {SITE.phone}
          </a>
        </div>
      </div>
    </div>
  )
}
