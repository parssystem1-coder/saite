'use client'

import {
  Laptop,
  MonitorSmartphone,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Tablet,
  Trash2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
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
import { cn } from '@/lib/utils'

const KIND_ICONS: Record<TrustedDevice['kind'], LucideIcon> = {
  mobile: Smartphone,
  tablet: Tablet,
  desktop: Laptop,
}

const KIND_LABELS: Record<TrustedDevice['kind'], string> = {
  mobile: 'موبایل',
  tablet: 'تبلت',
  desktop: 'رایانه',
}

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
 * ── پاسخ به پرسش «آیا حساب روی دستگاه دیگر باز مانده؟» ────────
 * هر ردیف صریح می‌گوید نشست آن دستگاه **فعال** است یا **بسته**.
 * اگر نشست فعالی روی دستگاه دیگری باشد، هشدار بالای فهرست
 * نمایش داده می‌شود تا کاربر بی‌درنگ متوجه شود.
 *
 * مرورگر و سیستم‌عامل جدا نمایش داده می‌شوند تا کاربر بتواند
 * ردیف را با دستگاه واقعی خودش تطبیق دهد.
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

  const otherDevices = devices.filter((d) => !isCurrentDevice(d.deviceId))
  const activeElsewhere = otherDevices.filter((d) => d.isActive)

  return (
    <section className="surface-3d rounded-2xl p-6 md:p-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/12">
            <MonitorSmartphone className="size-5 text-primary" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-foreground">دستگاه‌ها و نشست‌ها</h2>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              هر مرورگری که با آن وارد شده‌اید — حداکثر{' '}
              {formatNumber(MAX_TRUSTED_DEVICES)} دستگاه
            </p>
          </div>
        </div>

        {otherDevices.length > 0 && (
          <Button variant="secondary" size="sm" onClick={handleRevokeOthers}>
            خروج از سایر دستگاه‌ها
          </Button>
        )}
      </header>

      {/* هشدار نشست باز روی دستگاه دیگر */}
      {hydrated && activeElsewhere.length > 0 && (
        <p
          role="status"
          className="mb-5 flex items-start gap-2 rounded-xl border border-stock-low/30 bg-stock-low/10 p-3.5 text-xs leading-relaxed text-stock-low"
        >
          <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            حساب شما روی {formatNumber(activeElsewhere.length)} دستگاه دیگر هم باز است. اگر
            آن‌ها را نمی‌شناسید، خارجشان کنید و رمز عبور را تغییر دهید.
          </span>
        </p>
      )}

      {!hydrated ? (
        <div className="h-24 animate-pulse rounded-xl bg-surface-2" aria-hidden="true" />
      ) : devices.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface-0/50 p-4 text-xs leading-relaxed text-muted-foreground">
          هنوز دستگاهی ثبت نشده است.
        </p>
      ) : (
        <ul className="space-y-3">
          {devices.map((device) => {
            const current = isCurrentDevice(device.deviceId)
            const Icon = KIND_ICONS[device.kind]

            return (
              <li
                key={device.deviceId}
                className={cn(
                  'flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4',
                  current
                    ? 'border-primary/30 bg-primary/8'
                    : 'border-border bg-surface-0/50'
                )}
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    className={cn(
                      'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg',
                      current ? 'bg-primary/15 text-primary' : 'bg-surface-2 text-muted-foreground'
                    )}
                  >
                    <Icon className="size-4.5" aria-hidden="true" />
                  </span>

                  <div className="min-w-0">
                    {/* مرورگر برجسته — کاربر با همین ردیف را می‌شناسد */}
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-foreground">
                        {device.browser}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {KIND_LABELS[device.kind]} · {device.os}
                      </span>
                    </p>

                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      {current ? (
                        <span className="inline-flex items-center gap-1 rounded-md border border-stock-in/30 bg-stock-in/10 px-1.5 py-0.5 text-[10px] font-bold text-stock-in">
                          <ShieldCheck className="size-3" aria-hidden="true" />
                          دستگاه فعلی شما
                        </span>
                      ) : device.isActive ? (
                        <span className="inline-flex items-center gap-1 rounded-md border border-stock-low/30 bg-stock-low/10 px-1.5 py-0.5 text-[10px] font-bold text-stock-low">
                          <span className="size-1.5 rounded-full bg-stock-low" aria-hidden="true" />
                          نشست باز
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-2 px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                          خارج‌شده
                        </span>
                      )}

                      <span className="text-[11px] text-muted-foreground">
                        آخرین ورود: {formatRelative(device.lastSeenAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {!current && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRevoke(device.deviceId)}
                    aria-label={`حذف دستگاه ${device.browser} روی ${device.os}`}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                    حذف
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <p className="mt-5 text-[11px] leading-relaxed text-muted-foreground/80">
        حذف دستگاه یعنی دفعهٔ بعد از آن مرورگر، رمز عبور دوباره خواسته می‌شود.
      </p>
    </section>
  )
}
