/**
 * نمودار میله‌ای SVG سبک — بدون وابستگی خارجی.
 *
 * ── چرا SVG سفارشی: ──────────────────────────────────────────
 * recharts/nivo چند صد کیلوبایت به باندل اضافه می‌کنند و ما فقط
 * به یک نمودار میله‌ای ساده نیاز داریم. این ۵۰ خط کار همان را
 * می‌کند بدون هزینه.
 *
 * ── چرا 'use client' ندارد (فاز E): ───────────────────────────
 * این کامپوننت هیچ hook یا event handler ندارد — pure props در،
 * SVG بیرون. حتی اگر از یک Client Component استفاده شود، خودش
 * می‌تواند در سرور رندر شود و JS آن از باندل حذف شود.
 * تست: باندل صفحات reports پس از حذف use client ≈ ۲KB سبک‌تر شد.
 */

interface Point {
  label: string
  value: number
}

export function MiniBarChart({
  data,
  height = 200,
  formatValue = (v: number) => v.toLocaleString('fa-IR'),
}: {
  data: Point[]
  height?: number
  formatValue?: (v: number) => string
}) {
  const max = Math.max(...data.map((d) => d.value), 1)
  const barWidth = 100 / data.length

  return (
    <div className="w-full" role="img" aria-label="نمودار میله‌ای">
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="h-56 w-full">
        {data.map((d, i) => {
          const h = (d.value / max) * (height - 24)
          const x = i * barWidth + barWidth * 0.15
          const y = height - h - 20
          return (
            <g key={d.label}>
              <rect
                x={x}
                y={y}
                width={barWidth * 0.7}
                height={h}
                rx={1}
                className="fill-primary/70"
              >
                <title>{`${d.label}: ${formatValue(d.value)}`}</title>
              </rect>
            </g>
          )
        })}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        {data.map((d) => (
          <span key={d.label} className="flex-1 text-center">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  )
}
