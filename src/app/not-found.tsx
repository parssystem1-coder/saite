import { FileQuestion, Home, Search } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'

/**
 * صفحهٔ ۴۰۴ — هم‌زبان با سیستم طراحی، بدون لحن سایبر/AI.
 */
export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-16 md:py-24">
      <div className="surface-3d mx-auto max-w-xl rounded-2xl">
        <EmptyState
          icon={FileQuestion}
          title="صفحه پیدا نشد"
          description="آدرسی که وارد کرده‌اید وجود ندارد یا جابه‌جا شده است. می‌توانید به صفحهٔ اصلی برگردید یا در فروشگاه جستجو کنید."
          action={
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" asChild>
                <Link href="/">
                  <Home />
                  بازگشت به خانه
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/products">
                  <Search />
                  مشاهدهٔ محصولات
                </Link>
              </Button>
            </div>
          }
        />
      </div>
      <p className="mt-6 text-center font-mono text-xs text-muted-foreground/50" dir="ltr">
        404
      </p>
    </div>
  )
}
