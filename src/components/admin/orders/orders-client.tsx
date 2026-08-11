'use client'

import * as React from 'react'
import { Package, Search, AlertTriangle, Printer, Save, X, CreditCard } from 'lucide-react'
import { buildPostalLabelData } from '@/lib/orders/label'
import { canTransitionReturn } from '@/lib/orders/return-policy'
import { createMockOrdersAdapter } from '@/lib/orders/mock-adapter'
import type { OrderFulfillment, FulfillmentOrderStatus, OrderPaymentInfo } from '@/types/order-fulfillment'

const STATUS_LABEL: Record<FulfillmentOrderStatus, string> = {
  pending: 'در انتظار پرداخت',
  paid: 'پرداخت شده',
  packing: 'نیازمند بسته‌بندی',
  ready_to_ship: 'آماده ارسال',
  handed_to_carrier: 'تحویل به حمل',
  in_transit: 'در مسیر',
  delivered: 'تحویل شده',
  return_requested: 'درخواست مرجوعی',
  return_approved: 'تایید مرجوعی',
  returned: 'مرجوع شده',
  refunded: 'بازپرداخت شده',
  cancelled: 'لغو شده',
}

const STATUS_TONE: Record<FulfillmentOrderStatus, string> = {
  pending: 'bg-amber-400/15 text-amber-300',
  paid: 'bg-violet-500/15 text-violet-300',
  packing: 'bg-amber-400/15 text-amber-300',
  ready_to_ship: 'bg-violet-500/15 text-violet-300',
  handed_to_carrier: 'bg-sky-500/15 text-sky-300',
  in_transit: 'bg-sky-500/15 text-sky-300',
  delivered: 'bg-emerald-500/15 text-emerald-300',
  return_requested: 'bg-amber-400/15 text-amber-300',
  return_approved: 'bg-sky-500/15 text-sky-300',
  returned: 'bg-zinc-500/15 text-zinc-300',
  refunded: 'bg-emerald-500/15 text-emerald-300',
  cancelled: 'bg-red-500/15 text-red-300',
}

const PAYMENT_METHOD_LABEL: Record<NonNullable<OrderPaymentInfo['method']>, string> = {
  online: 'آنلاین',
  cod: 'پرداخت در محل',
  card: 'کارت به کارت',
}

const PAYMENT_STATUS_LABEL: Record<NonNullable<OrderPaymentInfo['status']>, string> = {
  paid: 'پرداخت شده',
  pending: 'در انتظار',
  failed: 'ناموفق',
  refunded: 'بازگشت داده شده',
}

const PAYMENT_TONE: Record<NonNullable<OrderPaymentInfo['status']>, string> = {
  paid: 'bg-emerald-500/15 text-emerald-300',
  pending: 'bg-amber-400/15 text-amber-300',
  failed: 'bg-red-500/15 text-red-300',
  refunded: 'bg-violet-500/15 text-violet-300',
}

export default function OrdersClient() {
  const adapter = React.useMemo(() => createMockOrdersAdapter(), [])
  const [orders, setOrders] = React.useState<OrderFulfillment[]>([])
  const [q, setQ] = React.useState('')
  const [status, setStatus] = React.useState<FulfillmentOrderStatus | 'all'>('all')
  const [selected, setSelected] = React.useState<OrderFulfillment | null>(null)

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync with localStorage
    setOrders(adapter.list())
  }, [adapter])

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase()
    return orders.filter((o) => {
      const matchesStatus = status === 'all' || o.status === status
      const hay = [o.orderId, o.recipient.fullName, o.recipient.phone, o.packages[0]?.trackingCode ?? '', o.payment?.authority ?? ''].join(' ').toLowerCase()
      const matchesQ = !needle || hay.includes(needle)
      return matchesStatus && matchesQ
    })
  }, [orders, q, status])

  const kpiPacking = orders.filter((o) => o.status === 'packing').length
  const kpiReady = orders.filter((o) => o.status === 'ready_to_ship').length
  const kpiTransit = orders.filter((o) => o.status === 'in_transit').length

  const openDrawer = (order: OrderFulfillment) => setSelected(order)
  const closeDrawer = () => setSelected(null)

  const handleStatusChange = (order: OrderFulfillment, nextStatus: FulfillmentOrderStatus) => {
    const updated: OrderFulfillment = { ...order, status: nextStatus, updatedAt: new Date().toISOString(), updatedBy: 'admin' }
    const nextList = adapter.save(updated)
    setOrders(nextList)
    setSelected(updated)
  }

  const handlePaymentChange = (order: OrderFulfillment, patch: Partial<OrderPaymentInfo>) => {
    const updated: OrderFulfillment = {
      ...order,
      payment: { ...(order.payment ?? { method: 'online', status: 'pending' }), ...patch } as OrderPaymentInfo,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin',
    }
    const nextList = adapter.save(updated)
    setOrders(nextList)
    setSelected(updated)
  }

  const handleReturnTransition = (order: OrderFulfillment, next: OrderFulfillment['returns'][number]['status']) => {
    if (!order.returns[0]) return
    const cur = order.returns[0].status
    if (!canTransitionReturn(cur, next)) return
    const updated: OrderFulfillment = {
      ...order,
      returns: [{ ...order.returns[0], status: next, reviewedAt: new Date().toISOString() }],
      status: next === 'approved' ? 'return_approved' : next === 'received' ? 'returned' : order.status,
    }
    const nextList = adapter.save(updated)
    setOrders(nextList)
    setSelected(updated)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="نیازمند بسته‌بندی" value={String(kpiPacking)} tone="amber" />
        <Kpi label="آماده تحویل" value={String(kpiReady)} tone="violet" />
        <Kpi label="در مسیر" value={String(kpiTransit)} tone="sky" />
        <Kpi label="کل سفارش‌ها" value={String(orders.length)} tone="zinc" />
      </div>

      <section className="surface-3d overflow-hidden rounded-2xl">
        <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="شماره سفارش، نام، موبایل یا کد رهگیری"
              className="w-full rounded-xl border border-border bg-surface-1 py-2 pr-9 pl-3 text-sm"
            />
          </label>
          <select value={status} onChange={(e) => setStatus(e.target.value as FulfillmentOrderStatus | 'all')} className="rounded-xl border border-border bg-surface-1 px-3 py-2 text-sm">
            <option value="all">همه وضعیت‌ها</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-1 overflow-auto border-y border-border px-2 py-2">
          {(['all', 'packing', 'ready_to_ship', 'in_transit', 'delivered'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs ${status === s ? 'bg-primary text-primary-foreground' : 'bg-surface-1 text-muted-foreground'}`}
            >
              {s === 'all' ? 'همه' : STATUS_LABEL[s as FulfillmentOrderStatus]}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-right text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground">
                <th className="p-3">شماره سفارش</th>
                <th className="p-3">مشتری</th>
                <th className="p-3">وضعیت عملیات</th>
                <th className="p-3">پرداخت</th>
                <th className="p-3">روش ارسال</th>
                <th className="p-3">ارزش مرسوله</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.orderId} className="border-t border-border hover:bg-surface-1/60">
                  <td className="p-3 font-mono text-xs">{o.orderId}</td>
                  <td className="p-3">
                    <div className="font-bold">{o.recipient.fullName}</div>
                    <div className="text-xs text-muted-foreground">{o.recipient.phone}</div>
                  </td>
                  <td className="p-3">
                    <span className={`rounded-full px-2 py-1 text-[10px] ${STATUS_TONE[o.status]}`}>{STATUS_LABEL[o.status]}</span>
                  </td>
                  <td className="p-3">
                    {o.payment ? (
                      <div className="flex flex-col gap-1">
                        <span className={`w-fit rounded-full px-2 py-0.5 text-[10px] ${PAYMENT_TONE[o.payment.status]}`}>{PAYMENT_STATUS_LABEL[o.payment.status]}</span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <CreditCard className="size-3" />
                          {PAYMENT_METHOD_LABEL[o.payment.method]} {o.payment.authority ? `· ${o.payment.authority}` : ''}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">{o.packages[0]?.carrier ?? '—'} — {o.packages[0]?.service ?? '—'}</td>
                  <td className="p-3 font-mono text-xs">{o.orderTotal.toLocaleString('fa-IR')} ت</td>
                  <td className="p-3">
                    <button onClick={() => openDrawer(o)} className="rounded-lg border border-border px-3 py-1 text-xs">
                      جزئیات
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-sm text-muted-foreground">
                    سفارشی با این فیلتر پیدا نشد.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between p-3 text-xs text-muted-foreground">
          <span>نمایش {filtered.length} از {orders.length}</span>
          <span>صفحه ۱ از ۱</span>
        </div>
      </section>

      {selected && (
        <Drawer order={selected} onClose={closeDrawer} onReturnTransition={handleReturnTransition} onStatusChange={handleStatusChange} onPaymentChange={handlePaymentChange} />
      )}
    </div>
  )
}

function Kpi({ label, value, tone }: { label: string; value: string; tone: string }) {
  const toneClass = tone === 'amber' ? 'text-amber-300' : tone === 'violet' ? 'text-violet-300' : tone === 'sky' ? 'text-sky-300' : 'text-zinc-300'
  return (
    <div className="rounded-2xl border border-border bg-surface-1 p-4">
      <div className={`text-xs ${toneClass}`}>{label}</div>
      <div className="mt-1 text-2xl font-black">{value}</div>
    </div>
  )
}

function Drawer({
  order,
  onClose,
  onReturnTransition,
  onStatusChange,
  onPaymentChange,
}: {
  order: OrderFulfillment
  onClose: () => void
  onReturnTransition: (o: OrderFulfillment, s: OrderFulfillment['returns'][number]['status']) => void
  onStatusChange: (o: OrderFulfillment, s: FulfillmentOrderStatus) => void
  onPaymentChange: (o: OrderFulfillment, p: Partial<OrderPaymentInfo>) => void
}) {
  const pkg = order.packages[0]
  const label = pkg ? buildPostalLabelData({ orderId: order.orderId, package: pkg, packageCount: order.packages.length, recipient: order.recipient, senderName: 'سایت — انبار مرکزی' }) : null

  return (
    <div className="fixed inset-0 z-50 flex">
      <button aria-label="بستن" onClick={onClose} className="flex-1 bg-overlay backdrop-blur-sm" />
      <div className="h-full w-[min(96vw,560px)] overflow-y-auto border-s border-border bg-surface-1 p-0 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface-1 px-4 py-3">
          <div>
            <div className="text-[10px] tracking-widest text-muted-foreground">FULFILLMENT WORKSPACE</div>
            <div className="font-mono text-sm font-bold">{order.orderId}</div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-surface-2">
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-6 p-4">
          {/* وضعیت عملیات */}
          <section className="space-y-2">
            <h3 className="text-xs font-black">وضعیت سفارش — STATUS</h3>
            <p className="text-[11px] text-muted-foreground">تغییر وضعیت عملیات را اینجا انجام بده — هر تغییر با localStorage ذخیره و در جدول هم به‌روز می‌شود.</p>
            <div className="flex flex-wrap gap-2">
              <select
                value={order.status}
                onChange={(e) => onStatusChange(order, e.target.value as FulfillmentOrderStatus)}
                className="flex-1 rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs"
              >
                {Object.entries(STATUS_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
              <span className={`rounded-full px-3 py-2 text-xs ${STATUS_TONE[order.status]}`}>{STATUS_LABEL[order.status]}</span>
            </div>
          </section>

          {/* پرداخت */}
          <section className="space-y-2 rounded-xl border border-violet-500/20 bg-violet-500/5 p-3">
            <h3 className="flex items-center gap-1 text-xs font-black">
              <CreditCard className="size-3" /> پرداخت — PAYMENT
            </h3>
            {order.payment ? (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Field label="روش پرداخت" value={PAYMENT_METHOD_LABEL[order.payment.method]} />
                <div>
                  <div className="text-[10px] text-muted-foreground">وضعیت پرداخت</div>
                  <select
                    value={order.payment.status}
                    onChange={(e) => onPaymentChange(order, { status: e.target.value as OrderPaymentInfo['status'] })}
                    className="mt-1 w-full rounded-lg border border-border bg-surface-2 px-2 py-1.5 text-xs"
                  >
                    {Object.entries(PAYMENT_STATUS_LABEL).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <Field label="کد پیگیری / Authority" value={order.payment.authority ?? '—'} dir="ltr" />
                <Field label="شناسه تراکنش" value={order.payment.transactionId ?? '—'} dir="ltr" />
                <Field label="زمان پرداخت" value={order.payment.paidAt ? new Date(order.payment.paidAt).toLocaleString('fa-IR') : '—'} dir="ltr" />
                <Field label="مبلغ پرداخت" value={order.payment.amount ? `${order.payment.amount.toLocaleString('fa-IR')} ت` : '—'} />
                <div className="col-span-2 mt-1 flex gap-2">
                  <button
                    onClick={() => onPaymentChange(order, { method: order.payment!.method === 'online' ? 'cod' : 'online' })}
                    className="flex-1 rounded-lg border border-border px-2 py-1.5 text-xs"
                  >
                    تغییر به {order.payment.method === 'online' ? 'پرداخت در محل' : 'آنلاین'}
                  </button>
                  <button
                    onClick={() => onPaymentChange(order, { status: order.payment!.status === 'paid' ? 'pending' : 'paid', paidAt: new Date().toISOString() })}
                    className="flex-1 rounded-lg bg-primary px-2 py-1.5 text-xs font-bold text-primary-foreground"
                  >
                    {order.payment.status === 'paid' ? 'برگرداندن به در انتظار' : 'تایید پرداخت'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">اطلاعات پرداخت ثبت نشده — پرداخت را انتخاب کن:</div>
            )}
            {!order.payment && (
              <div className="flex gap-2">
                <button onClick={() => onPaymentChange(order, { method: 'online', status: 'pending', amount: order.orderTotal })} className="flex-1 rounded-lg border border-border py-1.5 text-xs">
                  آنلاین
                </button>
                <button onClick={() => onPaymentChange(order, { method: 'cod', status: 'pending', amount: order.orderTotal })} className="flex-1 rounded-lg border border-border py-1.5 text-xs">
                  پرداخت در محل
                </button>
              </div>
            )}
          </section>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs">
            <b className="flex items-center gap-1">
              <AlertTriangle className="size-3" /> قبل از تایید ارسال، اطلاعات روی برچسب را بررسی کنید
            </b>
            <p className="mt-1 text-muted-foreground">آدرس و ارزش مرسوله از سفارش خوانده می‌شود.</p>
          </div>

          <section className="space-y-2">
            <h3 className="text-xs font-black">گیرنده مرسوله — LABEL / RECIPIENT</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Field label="نام و نام خانوادگی / شرکت" value={order.recipient.companyName ? `${order.recipient.fullName} (${order.recipient.companyName})` : order.recipient.fullName} />
              <Field label="شماره تماس" value={order.recipient.phone} dir="ltr" />
              <Field label="آدرس کامل" value={order.recipient.addressLine} full />
              <Field label="کد پستی ۱۰ رقمی" value={order.recipient.postalCode} dir="ltr" />
              <Field label="استان / شهر" value={`${order.recipient.province} / ${order.recipient.city}`} />
              <Field label="کد سفارش روی بسته" value={order.orderId} dir="ltr" />
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-black">اقلام و بسته‌بندی — PACKAGE</h3>
            <div className="space-y-2">
              {order.items.map((it) => (
                <div key={it.productId} className="flex items-center gap-3 rounded-xl border border-border p-3 text-xs">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-surface-2">
                    <Package className="size-4" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold">{it.name}</div>
                    <div className="text-muted-foreground">تعداد {it.quantity} · {it.weightGrams ?? '—'} گرم</div>
                  </div>
                  <div className="font-mono">{it.sku}</div>
                </div>
              ))}
            </div>
            {pkg && (
              <div className="rounded-xl border border-border p-3 text-xs">
                <div className="font-bold">بسته شماره {pkg.sequence}</div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Field label="نوع بسته" value={pkg.type} />
                  <Field label="ابعاد" value={`${pkg.lengthCm} × ${pkg.widthCm} × ${pkg.heightCm} cm`} dir="ltr" />
                  <Field label="وزن نهایی" value={`${pkg.weightGrams} گرم`} />
                  <Field label="ارزش اظهارشده" value={`${pkg.declaredValue.toLocaleString('fa-IR')} ت`} />
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
                  {pkg.fragileLabelApplied && <span className="rounded-full bg-amber-500/15 px-2 py-1">شکستنی</span>}
                  {pkg.insuranceEnabled && <span className="rounded-full bg-sky-500/15 px-2 py-1">بیمه</span>}
                  {pkg.invoiceInserted && <span className="rounded-full bg-emerald-500/15 px-2 py-1">فاکتور داخل بسته</span>}
                </div>
              </div>
            )}
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-black">روش ارسال — SHIPPING</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Field label="شرکت حمل" value={pkg?.carrier ?? '—'} />
              <Field label="سرویس" value={pkg?.service ?? '—'} />
              <Field label="کد رهگیری" value={pkg?.trackingCode ?? '—'} dir="ltr" />
              <Field label="هزینه ارسال" value={pkg ? `${pkg.shippingCost.toLocaleString('fa-IR')} ت` : '—'} />
            </div>
          </section>

          {label && (
            <section className="space-y-2">
              <h3 className="text-xs font-black">پیش‌نمایش برچسب چاپی — PRINT PREVIEW</h3>
              <div className="rounded-xl border-2 border-dashed border-border bg-surface-2 p-3 font-mono text-[10px]">
                <div className="flex justify-between font-bold">
                  <span>SAITE / SHIPPING LABEL</span>
                  <span>{label.barcodeValue}</span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <div>
                    <div className="font-bold">گیرنده</div>
                    <div>{label.recipient.fullName}</div>
                    <div dir="ltr">{label.recipient.phone}</div>
                    <div>{label.recipient.addressLine}</div>
                    <div>کد پستی: {label.recipient.postalCode}</div>
                  </div>
                  <div>
                    <div className="font-bold">مرسوله</div>
                    <div>{label.carrier} — {label.service}</div>
                    <div>وزن: {label.weightGrams} گرم</div>
                    <div>ارزش: {label.declaredValue.toLocaleString('fa-IR')} ت</div>
                    <div>بارکد: {label.barcodeValue}</div>
                  </div>
                </div>
                <div className="mt-3 h-8 w-full rounded bg-[repeating-linear-gradient(90deg,#000_0_2px,transparent_2px_4px)]" aria-hidden />
              </div>
            </section>
          )}

          {order.returns.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-xs font-black">مرجوعی — RETURN</h3>
              {order.returns.map((r) => (
                <div key={r.id} className="rounded-xl border border-border p-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{r.reason}</span>
                    <span className="rounded-full bg-amber-500/15 px-2 py-1 text-[10px]">{r.status}</span>
                  </div>
                  <div className="mt-1 text-muted-foreground">{r.customerNote ?? '—'}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(['under_review', 'approved', 'rejected', 'received', 'refunded'] as const).map((next) => (
                      <button
                        key={next}
                        disabled={!canTransitionReturn(r.status, next)}
                        onClick={() => onReturnTransition(order, next)}
                        className="rounded-lg border border-border px-2 py-1 text-[10px] disabled:opacity-30"
                      >
                        → {next}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          )}

          <div className="flex gap-2 pt-2">
            <button onClick={onClose} className="flex-1 rounded-xl bg-primary py-2 text-sm font-bold text-primary-foreground">
              <Printer className="mr-1 inline size-4" />
              تایید و آماده چاپ
            </button>
            <button onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-sm">
              <Save className="mr-1 inline size-4" />
              ذخیره پیش‌نویس
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, dir, full }: { label: string; value: string; dir?: 'ltr' | 'rtl'; full?: boolean }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div dir={dir} className="mt-1 rounded-lg border border-border bg-surface-2 px-2 py-1.5 font-mono text-xs">
        {value}
      </div>
    </div>
  )
}
