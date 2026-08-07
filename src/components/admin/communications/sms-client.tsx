'use client'

import * as React from 'react'
import { MessageSquare, FileText, CheckCircle2, XCircle, Save, Trash2 } from 'lucide-react'
import { createMockCommunicationsAdapter, extractTemplateVariables } from '@/lib/communications/mock-adapter'
import type { SmsLogEntry, SmsLogStatus, SmsTemplate } from '@/types/communications'
import { Badge, Stat, formatJalaliDate } from '@/components/admin/finance/finance-shared'

const STATUS_LABEL: Record<SmsLogStatus, string> = {
  queued: 'در صف',
  sent: 'ارسال شده',
  delivered: 'تحویل شده',
  failed: 'ناموفق',
}
const STATUS_TONE: Record<SmsLogStatus, 'default' | 'success' | 'warn' | 'danger' | 'info'> = {
  queued: 'warn',
  sent: 'info',
  delivered: 'success',
  failed: 'danger',
}

export default function SmsClient() {
  const adapter = React.useMemo(() => createMockCommunicationsAdapter(), [])
  const [tab, setTab] = React.useState<'logs' | 'templates'>('logs')

  const [logs, setLogs] = React.useState<SmsLogEntry[]>([])
  const [templates, setTemplates] = React.useState<SmsTemplate[]>([])

  const [tplName, setTplName] = React.useState('')
  const [tplContent, setTplContent] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage sync
    setLogs(adapter.listSmsLogs())
    setTemplates(adapter.listSmsTemplates())
  }, [adapter])

  const stats = React.useMemo(() => {
    const delivered = logs.filter((l) => l.status === 'delivered').length
    const failed = logs.filter((l) => l.status === 'failed').length
    const total = logs.length
    const rate = total > 0 ? Math.round((delivered / total) * 100) : 0
    return { delivered, failed, total, rate }
  }, [logs])

  const handleSaveTemplate = () => {
    if (!tplName.trim() || tplName.length < 3) {
      setError('نام قالب حداقل ۳ حرف')
      return
    }
    if (!tplContent.trim() || tplContent.length < 5) {
      setError('متن قالب حداقل ۵ حرف')
      return
    }
    setError(null)
    const tpl: SmsTemplate = {
      id: `t-${Date.now()}`,
      name: tplName.trim(),
      content: tplContent.trim(),
      variables: extractTemplateVariables(tplContent),
    }
    setTemplates(adapter.saveSmsTemplate(tpl))
    setTplName('')
    setTplContent('')
  }

  const handleRemoveTemplate = (id: string) => {
    setTemplates(adapter.removeSmsTemplate(id))
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={MessageSquare} label="کل ارسالی" value={stats.total.toLocaleString('fa-IR')} />
        <Stat icon={CheckCircle2} label="تحویل شده" value={stats.delivered.toLocaleString('fa-IR')} tone="success" />
        <Stat icon={XCircle} label="ناموفق" value={stats.failed.toLocaleString('fa-IR')} tone="danger" />
        <Stat icon={MessageSquare} label="نرخ تحویل" value={`${stats.rate.toLocaleString('fa-IR')}٪`} />
      </div>

      <section className="surface-3d overflow-hidden rounded-2xl">
        <div className="flex border-b border-border">
          <button
            onClick={() => setTab('logs')}
            className={`whitespace-nowrap border-b-2 px-5 py-3 text-sm ${tab === 'logs' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'}`}
          >
            لاگ ارسالی ({logs.length.toLocaleString('fa-IR')})
          </button>
          <button
            onClick={() => setTab('templates')}
            className={`whitespace-nowrap border-b-2 px-5 py-3 text-sm ${tab === 'templates' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'}`}
          >
            قالب‌ها ({templates.length.toLocaleString('fa-IR')})
          </button>
        </div>

        {tab === 'logs' && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-right text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground">
                  <th className="p-3">گیرنده</th>
                  <th className="p-3">نوع</th>
                  <th className="p-3">پیام</th>
                  <th className="p-3">وضعیت</th>
                  <th className="p-3">زمان</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-t border-border">
                    <td className="p-3">
                      <div className="font-mono text-xs">{l.toPhone}</div>
                      {l.toName && <div className="text-xs text-muted-foreground">{l.toName}</div>}
                    </td>
                    <td className="p-3 text-xs">
                      {l.kind === 'otp' ? 'OTP' : l.kind === 'transactional' ? 'تراکنشی' : 'کمپین'}
                    </td>
                    <td className="max-w-xs p-3 text-xs text-muted-foreground">
                      <div className="truncate" title={l.message}>{l.message}</div>
                      {l.errorReason && (
                        <div className="mt-1 text-destructive">خطا: {l.errorReason}</div>
                      )}
                    </td>
                    <td className="p-3">
                      <Badge tone={STATUS_TONE[l.status]}>{STATUS_LABEL[l.status]}</Badge>
                    </td>
                    <td className="p-3 text-xs">{formatJalaliDate(l.sentAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'templates' && (
          <div className="p-4">
            <div className="mb-4 rounded-xl border border-border bg-surface-1 p-4">
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <FileText className="size-4" aria-hidden />
                قالب جدید
              </h4>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  value={tplName}
                  onChange={(e) => setTplName(e.target.value)}
                  placeholder="نام قالب"
                  className="rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm"
                />
                <div className="text-xs text-muted-foreground self-center">
                  {`متغیرها با {{name}} — مثال: {{orderId}}, {{code}}`}
                </div>
              </div>
              <textarea
                value={tplContent}
                onChange={(e) => setTplContent(e.target.value)}
                placeholder="متن قالب"
                rows={3}
                className="mt-3 w-full resize-y rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm"
              />
              {tplContent && (
                <div className="mt-2 text-xs text-muted-foreground">
                  متغیرهای شناسایی‌شده: {extractTemplateVariables(tplContent).map((v) => `{{${v}}}`).join('، ') || 'هیچ'}
                </div>
              )}
              <button
                onClick={handleSaveTemplate}
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground"
              >
                <Save className="size-4" aria-hidden />
                ذخیرهٔ قالب
              </button>
              {error && (
                <p className="mt-2 text-xs text-destructive" role="alert">{error}</p>
              )}
            </div>

            <div className="space-y-2">
              {templates.map((t) => (
                <div key={t.id} className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
                  <div className="flex-1">
                    <div className="mb-1 text-sm font-medium">{t.name}</div>
                    <div className="mb-1 font-mono text-xs text-muted-foreground">{t.content}</div>
                    {t.variables.length > 0 && (
                      <div className="text-xs text-primary/80">
                        متغیرها: {t.variables.map((v) => `{{${v}}}`).join('، ')}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveTemplate(t.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-destructive/30 px-2.5 py-1 text-xs text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                    حذف
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
