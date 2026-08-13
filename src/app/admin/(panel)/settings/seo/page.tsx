import type { Metadata } from 'next'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { getGoogleConnectionStatus } from '@/lib/seo/google-connections'
import { getSeoToolConnectionStatus } from '@/lib/seo/seo-tool-connections'

export const metadata: Metadata = {
  title: 'اتصالات سئو',
  description: 'وضعیت اتصال ابزارهای سئو — بدون نمایش کلید',
  robots: { index: false, follow: false, nocache: true },
}

export const dynamic = 'force-dynamic'

function StatusBadge({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold ${
        ok ? 'bg-stock-in/15 text-stock-in' : 'bg-muted text-muted-foreground'
      }`}
    >
      {ok ? 'متصل' : 'نامتصل'}
    </span>
  )
}

function providerLabel(id: 'ahrefs' | 'semrush' | 'mock'): string {
  if (id === 'ahrefs') return 'Ahrefs'
  if (id === 'semrush') return 'SEMrush'
  return 'نمونهٔ آزمایشی (stub)'
}

export default function SeoConnectionsPage() {
  const status = getGoogleConnectionStatus()
  const tools = getSeoToolConnectionStatus()

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="اتصالات سئو"
        description="فقط وضعیت پیکربندی نمایش داده می‌شود. مقدار توکن یا شناسه هرگز در این صفحه نیست."
      />

      <section className="surface-3d overflow-hidden rounded-2xl">
        <table className="w-full text-right text-sm">
          <thead>
            <tr className="text-xs text-muted-foreground">
              <th className="p-4">ابزار</th>
              <th className="p-4">وضعیت</th>
              <th className="p-4">نحوهٔ اتصال</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-border">
              <td className="p-4">
                <b>Google Search Console</b>
                <small className="mt-1 block text-xs text-muted-foreground">
                  تأیید مالکیت از مسیر metadata.verification
                </small>
              </td>
              <td className="p-4">
                <StatusBadge ok={status.searchConsoleConfigured} />
              </td>
              <td className="p-4 text-xs text-muted-foreground">متغیر محیطی GOOGLE_SITE_VERIFICATION</td>
            </tr>
            <tr className="border-t border-border">
              <td className="p-4">
                <b>Google Analytics 4</b>
                <small className="mt-1 block text-xs text-muted-foreground">
                  اسنیپت رسمی پس از رضایت کوکی — بدون GTM
                </small>
              </td>
              <td className="p-4">
                <StatusBadge ok={status.ga4Configured} />
              </td>
              <td className="p-4 text-xs text-muted-foreground">متغیر محیطی GA4_MEASUREMENT_ID</td>
            </tr>
            <tr className="border-t border-border">
              <td className="p-4">
                <b>ابزارهای پولی سئو</b>
                <small className="mt-1 block text-xs text-muted-foreground">
                  kill-switch: {tools.enabled ? 'روشن' : 'خاموش'} — فعال: {providerLabel(tools.activeProvider)}
                </small>
              </td>
              <td className="p-4">
                <StatusBadge ok={tools.enabled && tools.activeProvider !== 'mock'} />
              </td>
              <td className="p-4 text-xs text-muted-foreground">SEO_TOOLS_ENABLED</td>
            </tr>
            <tr className="border-t border-border">
              <td className="p-4">
                <b>Ahrefs</b>
                <small className="mt-1 block text-xs text-muted-foreground">Keywords Explorer — فقط وضعیت</small>
              </td>
              <td className="p-4">
                <StatusBadge ok={tools.ahrefsConfigured} />
              </td>
              <td className="p-4 text-xs text-muted-foreground">متغیر محیطی AHREFS_API_KEY</td>
            </tr>
            <tr className="border-t border-border">
              <td className="p-4">
                <b>SEMrush</b>
                <small className="mt-1 block text-xs text-muted-foreground">Phrase overview — فقط وضعیت</small>
              </td>
              <td className="p-4">
                <StatusBadge ok={tools.semrushConfigured} />
              </td>
              <td className="p-4 text-xs text-muted-foreground">متغیر محیطی SEMRUSH_API_KEY</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5 text-sm">
        <b className="text-amber-200">قانون امنیتی</b>
        <p className="mt-2 text-muted-foreground">
          کلید API و توکن تأیید هرگز با پیشوند NEXT_PUBLIC ساخته نمی‌شوند، در پاسخ API برنمی‌گردند و
          در این صفحه دیده نمی‌شوند. بدون حساب، بررسی کلمهٔ کلیدی با stub کار می‌کند. GTM در فاز بعد
          اضافه می‌شود.
        </p>
      </section>
    </div>
  )
}
