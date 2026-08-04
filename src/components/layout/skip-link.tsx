/**
 * پرش به محتوای اصلی.
 *
 * چرا لازم است؟ هدر این سایت پیش از محتوا شامل نوار تماس، لوگو،
 * مگامنو، جستجو و پنج آیکون کنش است. بدون این لینک، کاربر کیبورد یا
 * screen reader باید در هر صفحه از همهٔ آن‌ها عبور کند.
 *
 * تا زمانی که فوکوس نگرفته `sr-only` است و دیده نمی‌شود؛ با Tab اول
 * ظاهر می‌شود. Server Component است — نیازی به JS ندارد.
 */
export function SkipLink({ targetId = 'main-content' }: { targetId?: string }) {
  return (
    <a
      href={`#${targetId}`}
      className="
        sr-only
        focus-visible:fixed focus-visible:top-4 focus-visible:right-4 focus-visible:z-[100]
        focus-visible:not-sr-only focus-visible:inline-flex focus-visible:items-center
        focus-visible:rounded-xl focus-visible:bg-primary focus-visible:px-5 focus-visible:py-3
        focus-visible:text-sm focus-visible:font-bold focus-visible:text-primary-foreground
        focus-visible:shadow-depth-3 focus-visible:outline-none
        focus-visible:ring-2 focus-visible:ring-primary-bright focus-visible:ring-offset-2
        focus-visible:ring-offset-background
      "
    >
      پرش به محتوای اصلی
    </a>
  )
}
