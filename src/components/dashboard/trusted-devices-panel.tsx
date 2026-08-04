'use client'

import { Laptop, MonitorSmartphone, ShieldCheck, Smartphone, Trash2 } from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { useHasHydrated } from '@/hooks/use-has-hydrated'
import {
  getTrustedDevicesServerSnapshot,
  getTrustedDevicesSnapshot,
  isCurrentDevice,
  MAX_TRUSTED_DEVICES,
  normalizeAccountKey,
  revokeDevice,
  revokeOtherDevices,
  subscribeTrustedDevices,
  type TrustedDevice,
} from '@/lib/auth/trusted-devices'
import { formatNumber } from '@/lib/format'

/** تاریخ نسبی خوانا — «۳ ساعت پیش» */
function formatRelative(iso: string): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return '—'

  const diffMinutes = Math.round((Date.now() - then) / 60_000)
  if (diffMinutes < 1) return 'همین حالا'
  if (diffMinutes < 60) return `${formatNumber(diffMinutes)} دقیقه پیش`

  const hours = Math.round(diffMinutes / 60)
  if (hours < 24) return `${formatNumber(hours)} ساعت پیش`

  const days = Math.round(hours / 24)
  return `${formatNumber(days)} روز پیش`
}

/**
 * فهرست دستگاه‌های واردشده به حساب.
 *
 * ── چرا این بخش لازم است؟ ─────────────────────────────────────
 * تشخیص دستگاه بدون شفافیت، کاربر را نگران می‌کند («چه کسی وارد
 * شده؟»). این جدول کنترل را به خود کاربر می‌دهد: می‌بیند چند
 * دستگاه وارد شده‌اند و می‌تواند هرکدام را قطع کند.
 *
 * حذف دستگاه یعنی دفعهٔ بعد از آن مرورگر، رمز خواسته می‌شود.
 */
export function TrustedDevicesPanel({ accountKey }: { accountKey: string }) {
  const hydrated = useHasHydrated()

  /*
    منبع خارجی به‌جای useState + useEffect.
    مزیت: با هر تغییر (ورود، حذف دستگاه، حتی از تب دیگر) خودکار
    به‌روز می‌شود و setState زنجیره‌ای داخل effect لازم نیست.
  */
  const all = React.useSyncExternalStore(
    subscribeTrustedDevices,
    getTrustedDevicesSnapshot,
    getTrustedDevicesServerSnapshot
  )

  const devices = React.useMemo<readonly TrustedDevice[]>(() => {
    if (!accountKey) return []
    const key = normalizeAccountKey(accountKey)
    return all
      .filter((d) => d.accountKey === key)
      .slice()
      .sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt))
  }, [all, accountKey])

  const handleRevoke = (deviceId: string) => revokeDevice(accountKey, deviceId)
  const handleRevokeOthers = () => revokeOtherDevices(accountKey)

  const otherCount = devices.filter((d) => !isCurrentDevice(d.deviceId)).length

  return (
    <section className="surface-3d rounded-2xl p-6 md:p-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/12">
            <MonitorSmartphone className="size-5 text-primary" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-foreground">دستگاه‌های من</h2>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              دستگاه‌هایی که با آن‌ها وارد شده‌اید — حداکثر{' '}
              {formatNumber(MAX_TRUSTED_DEVICES)} دستگاه
            </p>
          </div>
        </div>

        {otherCount > 0 && (
          <Button variant="secondary" size="sm" onClick={handleRevokeOthers}>
            خروج از سایر دستگاه‌ها
          </Button>
        )}
      </header>

      {!hydrated ? (
        <div className="h-20 animate-pulse rounded-xl bg-surface-2" aria-hidden="true" />
      ) : devices.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface-0/50 p-4 text-xs leading-relaxed text-muted-foreground">
          هنوز دستگاهی ثبت نشده است.
        </p>
      ) : (
        <ul className="space-y-3">
          {devices.map((device) => {
            const current = isCurrentDevice(device.deviceId)
            const Icon = device.kind === 'mobile' ? Smartphone : Laptop

            return (
              <li
                key={device.deviceId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface-0/50 p-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Icon className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-foreground">
                      {device.label}
                      {current && (
                        <span className="inline-flex items-center gap-1 rounded-md border border-stock-in/30 bg-stock-in/10 px-1.5 py-0.5 text-[10px] font-bold text-stock-in">
                          <ShieldCheck className="size-3" aria-hidden="true" />
                          این دستگاه
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      آخرین ورود: {formatRelative(device.lastSeenAt)}
                    </p>
                  </div>
                </div>

                {!current && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRevoke(device.deviceId)}
                    aria-label={`خروج از ${device.label}`}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                    خروج
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <p className="mt-5 text-[11px] leading-relaxed text-muted-foreground/80">
        اگر دستگاهی را نمی‌شناسید، از آن خارج شوید و رمز عبور خود را تغییر دهید.
      </p>
    </section>
  )
}
