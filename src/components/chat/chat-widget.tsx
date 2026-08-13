'use client'

import { useEffect, useRef, useState } from 'react'
import { AlertCircle, Bot, Eraser, MessageCircle, SendHorizonal, X } from 'lucide-react'
import { ChatProductCard } from '@/components/chat/chat-product-card'
import {
  ADVISOR_INPUT_MAX_CHARS,
  useAdvisorChat,
} from '@/components/chat/use-advisor-chat'
import { cn } from '@/lib/utils'

/**
 * ویجت چت «مشاور فروش هوشمند سایته».
 *
 * ── امنیت ────────────────────────────────────────────────────
 * تمام نمایش از طریق React و plain-text است (نه iframe و نه HTML
 * تفسیرشده) — خروجی مدل در UI هرگز به‌عنوان markup اجرا نمی‌شود.
 * کارت‌های محصول فقط از دادهٔ اعتبارسنجی‌شدهٔ سرور رندر می‌شوند.
 *
 * ── تجربهٔ کاربری ────────────────────────────────────────────
 * FAB سمت راستِ پایین (متقارن با ستون تماس که سمت چپ است)؛ بالاتر
 * از نوار پایینی موبایل. پنل: پیام‌ها، حالت «در حال نوشتن»،
 * پیام خوشامد و چیپ‌های سوال پرتکرار.
 */

const WELCOME_MESSAGE =
  'سلام! 👋 من مشاور فروش هوشمند سایته هستم. در انتخاب پرینتر، اسکنر، دستگاه کپی یا مصرفی کمکتان می‌کنم — چه چیزی لازم دارید؟'

const QUICK_PROMPTS = [
  'یک پرینتر لیزری برای دفتر کوچک می‌خواهم',
  'فرق پرینتر جوهرافشان و لیزری چیست؟',
  'مصرفی‌های پرکاربرد چه چیزهایی هستند؟',
]

function TypingIndicator() {
  return (
    <span className="inline-flex items-center gap-1 py-1" aria-label="دستیار در حال پاسخ است">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 animate-bounce rounded-full bg-muted-foreground/70"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </span>
  )
}

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const { messages, isStreaming, reset, send } = useAdvisorChat()

  const panelRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // اسکرول به پایین با پیام/استریم جدید
  useEffect(() => {
    const el = listRef.current
    if (open && el) el.scrollTop = el.scrollHeight
  }, [messages, open])

  // فوکوس ورودی هنگام باز شدن
  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  // Escape برای بستن
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const canSend = input.trim().length > 0 && !isStreaming

  const handleSend = async (text: string) => {
    const value = text.trim()
    if (!value || isStreaming) return
    setInput('')
    await send(value)
  }

  return (
    <>
      {/* ─── دکمهٔ شناور ─── */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'بستن گفتگو با مشاور هوشمند' : 'گفتگو با مشاور فروش هوشمند'}
        aria-expanded={open}
        className={cn(
          'fixed z-[98] flex size-12 items-center justify-center rounded-full md:bottom-8 md:size-[3.25rem]',
          'right-4 bottom-20 md:right-6 lg:bottom-5',
          'bg-gradient-to-b from-primary-bright to-primary text-primary-foreground',
          'shadow-[0_4px_0_0_hsl(var(--primary-deep)),0_8px_20px_hsl(var(--primary)/0.45)]',
          'transition-all duration-200 ease-out hover:-translate-y-0.5',
          'active:translate-y-0 active:shadow-[0_1px_0_0_hsl(var(--primary-deep))]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-bright focus-visible:ring-offset-2 focus-visible:ring-offset-background'
        )}
      >
        {open ? <X className="size-5" /> : <MessageCircle className="size-5 md:size-6" />}
        {!open && (
          <span className="absolute -top-0.5 -start-0.5 size-3 rounded-full border-2 border-background bg-emerald-400" aria-hidden="true" />
        )}
      </button>

      {/* ─── پنل گفتگو ─── */}
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="false"
          aria-label="گفتگو با مشاور فروش هوشمند سایته"
          className={cn(
            'fixed z-[98] flex flex-col overflow-hidden rounded-2xl',
            // بالای FAB و نوار پایینی موبایل
            'inset-x-3 bottom-[8.75rem] top-16 sm:inset-x-auto sm:top-auto',
            'sm:right-6 sm:bottom-24 sm:h-[min(34rem,72vh)] sm:w-[24rem]',
            'border border-border bg-surface-1/95 shadow-depth-4 backdrop-blur-xl',
            'supports-[backdrop-filter]:bg-surface-1/85'
          )}
        >
          {/* هدر */}
          <div className="flex items-center gap-3 border-b border-border bg-surface-2/60 px-4 py-3">
            <div className="flex size-9 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Bot className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-foreground">مشاور فروش هوشمند</p>
              <p className="truncate text-[11px] text-muted-foreground">
                پاسخ‌گویی هوشمند دربارهٔ محصولات سایته
              </p>
            </div>
            <button
              type="button"
              onClick={reset}
              aria-label="شروع گفتگوی جدید"
              title="شروع گفتگوی جدید"
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-surface-3 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Eraser className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="بستن"
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-surface-3 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* فهرست پیام‌ها */}
          <div
            ref={listRef}
            className="flex-1 space-y-4 overflow-y-auto px-4 py-4"
            aria-live="polite"
            aria-relevant="additions"
          >
            {/* پیام خوشامد */}
            <div className="rounded-2xl rounded-tr-sm bg-surface-2/70 px-3.5 py-2.5 text-xs leading-6 text-foreground/90">
              {WELCOME_MESSAGE}
            </div>

            {messages.length === 0 && (
              <div className="flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void handleSend(prompt)}
                    className="rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-[11px] text-primary transition-colors hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn('flex', msg.role === 'user' ? 'justify-start' : 'justify-end')}
              >
                <div
                  className={cn(
                    'max-w-[88%] space-y-2',
                    msg.role === 'user' ? 'items-start' : 'items-end'
                  )}
                >
                  <div
                    className={cn(
                      'whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-xs leading-6',
                      msg.role === 'user'
                        ? 'rounded-tl-sm bg-primary text-primary-foreground'
                        : 'rounded-tr-sm bg-surface-2/70 text-foreground/90',
                      msg.isError && 'border border-destructive/30 bg-destructive/10 text-destructive-foreground'
                    )}
                  >
                    {msg.isError && (
                      <span className="mb-1 flex items-center gap-1.5 text-[11px] font-bold text-destructive">
                        <AlertCircle className="size-3.5" />
                        خطا
                      </span>
                    )}
                    {msg.content}
                    {msg.role === 'assistant' && !msg.isError && msg.content.length === 0 && isStreaming && (
                      <TypingIndicator />
                    )}
                  </div>

                  {msg.products && msg.products.length > 0 && (
                    <div className="w-full space-y-2">
                      {msg.products.map((product) => (
                        <ChatProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* ورودی پیام */}
          <form
            className="border-t border-border bg-surface-1/80 p-3"
            onSubmit={(e) => {
              e.preventDefault()
              void handleSend(input)
            }}
          >
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value.slice(0, ADVISOR_INPUT_MAX_CHARS))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    void handleSend(input)
                  }
                }}
                placeholder="سوالتان دربارهٔ محصولات را بنویسید…"
                rows={1}
                maxLength={ADVISOR_INPUT_MAX_CHARS}
                disabled={isStreaming}
                aria-label="پیام به مشاور فروش هوشمند"
                className={cn(
                  'max-h-28 min-h-11 flex-1 resize-none rounded-xl border border-border bg-surface-0/60',
                  'px-3.5 py-3 text-xs leading-6 text-foreground placeholder:text-muted-foreground/70',
                  'focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/25',
                  'disabled:opacity-60'
                )}
              />
              <ButtonSend disabled={!canSend} />
            </div>
            <p className="mt-2 text-center text-[10px] text-muted-foreground/80">
              پاسخ‌ها توسط هوش مصنوعی تولید می‌شوند — دقت اطلاعات را در صفحهٔ محصول بررسی کنید.
            </p>
          </form>
        </div>
      )}
    </>
  )
}

function ButtonSend({ disabled }: { disabled: boolean }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      aria-label="ارسال پیام"
      className={cn(
        'flex size-11 shrink-0 items-center justify-center rounded-xl',
        'bg-gradient-to-b from-primary-bright to-primary text-primary-foreground',
        'shadow-[0_3px_0_0_hsl(var(--primary-deep))] transition-transform active:translate-y-0.5',
        'disabled:pointer-events-none disabled:opacity-45',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-bright focus-visible:ring-offset-2 focus-visible:ring-offset-background'
      )}
    >
      <SendHorizonal className="size-4 rtl:-scale-x-100" />
    </button>
  )
}
