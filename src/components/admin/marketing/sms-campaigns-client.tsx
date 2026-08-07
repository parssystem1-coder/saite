'use client'

import * as React from 'react'
import { MessageSquare, Send, Users, CheckCircle2, XCircle, Plus, Trash2 } from 'lucide-react'
import { createMockMarketingAdapter } from '@/lib/marketing/mock-adapter'
import type { SmsCampaign, SmsCampaignStatus } from '@/types/marketing'
import { Badge, Stat, formatJalaliDate } from '@/components/admin/finance/finance-shared'

const STATUS_LABEL: Record<SmsCampaignStatus, string> = {
  draft: 'پیش‌نویس',
  scheduled: 'زمان‌بندی شده',
  sending: 'در حال ارسال',
  sent: 'ارسال شده',
  failed: 'ناموفق',
}
const STATUS_TONE: Record<SmsCampaignStatus, 'default' | 'success' | 'warn' | 'danger' | 'info'> = {
  draft: 'default',
  scheduled: 'info',
  sending: 'warn',
  sent: 'success',
  failed: 'danger',
}

const SEGMENT_LABEL = {
  all: 'همهٔ مشتریان',
  vip: 'VIP',
  repeat: 'تکراری',
  new: 'جدید',
  at_risk: 'در معرض ریزش',
} as const

const SEGMENT_COUNT = { all: 1240, vip: 24, repeat: 156, new: 89, at_risk: 68 } as const

export default function SmsCampaignsClient() {
  const adapter = React.useMemo(() => createMockMarketingAdapter(), [])
  const [campaigns, setCampaigns] = React.useState<SmsCampaign[]>([])

  const [name, setName] = React.useState('')
  const [message, setMessage] = React.useState('')
  const [segment, setSegment] = React.useState<SmsCampaign['audienceSegment']>('all')
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCampaigns(adapter.listCampaigns())
  }, [adapter])

  const stats = React.useMemo(() => {
    const draft = campaigns.filter((c) => c.status === 'draft').length
    const scheduled = campaigns.filter((c) => c.status === 'scheduled').length
    const sent = campaigns.filter((c) => c.status === 'sent').length
    const delivered = campaigns.reduce((s, c) => s + c.deliveredCount, 0)
    return { draft, scheduled, sent, delivered }
  }, [campaigns])

  const handleAdd = () => {
    if (!name.trim() || name.length < 3) {
      setError('نام کمپین باید حداقل ۳ حرف باشد')
      return
    }
    if (!message.trim() || message.length < 10 || message.length > 500) {
      setError('متن پیام باید بین ۱۰ تا ۵۰۰ کاراکتر باشد')
      return
    }
    setError(null)
    const draft: SmsCampaign = {
      id: `cmp-${Date.now()}`,
      name: name.trim(),
      message: message.trim(),
      audienceSegment: segment,
      audienceCount: SEGMENT_COUNT[segment],
      deliveredCount: 0,
      failedCount: 0,
      status: 'draft',
      createdAt: new Date().toISOString(),
    }
    setCampaigns(adapter.saveCampaign(draft))
    setName('')
    setMessage('')
  }

  const handleSend = (id: string) => {
    const target = campaigns.find((c) => c.id === id)
    if (!target) return
    // شبیه‌سازی: ۹۵٪ موفقیت
    const delivered = Math.floor(target.audienceCount * 0.95)
    setCampaigns(
      adapter.saveCampaign({
        ...target,
        status: 'sent',
        sentAt: new Date().toISOString(),
        deliveredCount: delivered,
        failedCount: target.audienceCount - delivered,
      })
    )
  }

  const handleRemove = (id: string) => {
    setCampaigns(adapter.removeCampaign(id))
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={MessageSquare} label="پیش‌نویس" value={stats.draft.toLocaleString('fa-IR')} />
        <Stat icon={Send} label="زمان‌بندی شده" value={stats.scheduled.toLocaleString('fa-IR')} tone="warn" />
        <Stat icon={CheckCircle2} label="ارسال شده" value={stats.sent.toLocaleString('fa-IR')} tone="success" />
        <Stat icon={Users} label="کل تحویل" value={stats.delivered.toLocaleString('fa-IR')} />
      </div>

      <section className="surface-3d rounded-2xl p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Plus className="size-4" aria-hidden />
          کمپین جدید
        </h3>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="نام داخلی کمپین"
            className="rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm"
          />
          <select
            value={segment}
            onChange={(e) => setSegment(e.target.value as SmsCampaign['audienceSegment'])}
            className="rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm"
          >
            {(Object.keys(SEGMENT_LABEL) as SmsCampaign['audienceSegment'][]).map((s) => (
              <option key={s} value={s}>
                {SEGMENT_LABEL[s]} ({SEGMENT_COUNT[s].toLocaleString('fa-IR')} نفر)
              </option>
            ))}
          </select>
        </div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="متن پیامک (۱۰ تا ۵۰۰ کاراکتر)"
          rows={3}
          className="mt-3 w-full resize-y rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm"
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {message.length.toLocaleString('fa-IR')} / ۵۰۰ کاراکتر
          </span>
          <button
            onClick={handleAdd}
            className="inline-flex items-center rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            <Plus className="me-2 size-4" aria-hidden />
            ذخیرهٔ پیش‌نویس
          </button>
        </div>
        {error && (
          <p className="mt-2 text-xs text-destructive" role="alert">
            {error}
          </p>
        )}
      </section>

      <section className="surface-3d overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-right text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground">
                <th className="p-3">نام</th>
                <th className="p-3">مخاطبان</th>
                <th className="p-3">متن</th>
                <th className="p-3">تحویل / خطا</th>
                <th className="p-3">وضعیت</th>
                <th className="p-3">تاریخ</th>
                <th className="p-3">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} className="border-t border-border align-top">
                  <td className="p-3">
                    <div className="font-medium">{c.name}</div>
                  </td>
                  <td className="p-3 text-xs">
                    <div>{SEGMENT_LABEL[c.audienceSegment]}</div>
                    <div className="text-muted-foreground">
                      {c.audienceCount.toLocaleString('fa-IR')} نفر
                    </div>
                  </td>
                  <td className="max-w-xs p-3 text-xs text-muted-foreground">
                    <div className="truncate" title={c.message}>
                      {c.message}
                    </div>
                  </td>
                  <td className="p-3 text-xs">
                    <div className="text-emerald-300">
                      <CheckCircle2 className="me-1 inline size-3" aria-hidden />
                      {c.deliveredCount.toLocaleString('fa-IR')}
                    </div>
                    <div className="text-destructive">
                      <XCircle className="me-1 inline size-3" aria-hidden />
                      {c.failedCount.toLocaleString('fa-IR')}
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge tone={STATUS_TONE[c.status]}>{STATUS_LABEL[c.status]}</Badge>
                  </td>
                  <td className="p-3 text-xs">
                    {c.sentAt
                      ? formatJalaliDate(c.sentAt)
                      : c.scheduledAt
                        ? `⏰ ${formatJalaliDate(c.scheduledAt)}`
                        : formatJalaliDate(c.createdAt)}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      {(c.status === 'draft' || c.status === 'scheduled') && (
                        <button
                          onClick={() => handleSend(c.id)}
                          className="inline-flex items-center gap-1 rounded-lg bg-primary/15 px-2.5 py-1 text-xs text-primary hover:bg-primary/25"
                        >
                          <Send className="size-3.5" aria-hidden />
                          ارسال
                        </button>
                      )}
                      <button
                        onClick={() => handleRemove(c.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-destructive/30 px-2.5 py-1 text-xs text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
