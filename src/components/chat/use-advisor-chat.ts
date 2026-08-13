'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { parseAdvisorSseBlock, type ChatMessageItem } from '@/lib/chat/types'

/**
 * هوک گفتگو با مشاور فروش.
 *
 * ── چرا fetch+ReadableStream و نه EventSource؟ ───────────────
 * EventSource فقط GET می‌فهمد؛ ما باید JSON با متد POST بفرستیم
 * (پیام کاربر + sessionId). پس با fetch و خواندن تدریجی body،
 * همان فرمت SSE را سمت کلاینت parse می‌کنیم.
 *
 * ── حالت‌ها ──────────────────────────────────────────────────
 * پیام کاربر بلافاصله نمایش داده می‌شود؛ حباب دستیار خالی ساخته
 * و با deltaها پر می‌شود؛ رویداد done متن نهایی پاک‌شده و کارت‌های
 * محصولِ اعتبارسنجی‌شده را جایگزین می‌کند. در خطا، همان پیام به
 * حباب خطا تبدیل می‌شود (به‌جای نوتیفیکیشن جداگانه — کمتر Brushing
 * و قابل‌خواندن در سیاق).
 */

const SESSION_STORAGE_KEY = 'saite_advisor_session'
const API_URL = '/api/ai/advisor'
export const ADVISOR_INPUT_MAX_CHARS = 2_000

const GENERIC_ERROR_MESSAGE =
  'ارتباط با دستیار هوشمند برقرار نشد. اتصال اینترنت را بررسی کنید یا بعداً تلاش کنید.'

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export interface UseAdvisorChat {
  messages: ChatMessageItem[]
  isStreaming: boolean
  /** خالی کردن گفتگو — سشن جدید از پیام بعدی */
  reset: () => void
  send: (text: string) => Promise<void>
}

export function useAdvisorChat(): UseAdvisorChat {
  const [messages, setMessages] = useState<ChatMessageItem[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const sessionIdRef = useRef<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  // بازیابی sessionId از sessionStorage (پایداری در رفرش — نه بین تب‌ها)
  useEffect(() => {
    try {
      sessionIdRef.current = window.sessionStorage.getItem(SESSION_STORAGE_KEY)
    } catch {
      // فضای خصوصی/غیرفعال — بدون سشن کار می‌کنیم
    }
  }, [])

  // لغو درخواست در حال پرواز هنگام unmount
  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    sessionIdRef.current = null
    try {
      window.sessionStorage.removeItem(SESSION_STORAGE_KEY)
    } catch {
      // غیرحیاتی
    }
    setMessages([])
    setIsStreaming(false)
  }, [])

  const updateAssistant = useCallback(
    (assistantId: string, updater: (msg: ChatMessageItem) => ChatMessageItem) => {
      setMessages((prev) => prev.map((m) => (m.id === assistantId ? updater(m) : m)))
    },
    []
  )

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim().slice(0, ADVISOR_INPUT_MAX_CHARS)
      if (!trimmed || isStreaming) return

      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      const userMessage: ChatMessageItem = { id: makeId(), role: 'user', content: trimmed }
      const assistantId = makeId()

      setMessages((prev) => [
        ...prev,
        userMessage,
        { id: assistantId, role: 'assistant', content: '' },
      ])
      setIsStreaming(true)

      try {
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: trimmed,
            ...(sessionIdRef.current ? { sessionId: sessionIdRef.current } : {}),
          }),
          signal: controller.signal,
        })

        if (!res.ok || !res.body) {
          let serverMessage = GENERIC_ERROR_MESSAGE
          try {
            const data = (await res.json()) as { error?: unknown }
            if (typeof data.error === 'string' && data.error.length > 0) {
              serverMessage = data.error
            }
          } catch {
            // پاسخ غیر JSON — پیام عمومی کافی است
          }
          throw new Error(serverMessage)
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })

          let sepIndex: number
          while ((sepIndex = buffer.indexOf('\n\n')) !== -1) {
            const rawBlock = buffer.slice(0, sepIndex)
            buffer = buffer.slice(sepIndex + 2)

            const event = parseAdvisorSseBlock(rawBlock)
            if (!event) continue

            if (event.type === 'session') {
              sessionIdRef.current = event.sessionId
              try {
                window.sessionStorage.setItem(SESSION_STORAGE_KEY, event.sessionId)
              } catch {
                // غیرحیاتی
              }
            } else if (event.type === 'delta') {
              updateAssistant(assistantId, (m) => ({ ...m, content: m.content + event.text }))
            } else if (event.type === 'done') {
              updateAssistant(assistantId, (m) => ({
                ...m,
                content: event.text,
                products: event.products.length > 0 ? event.products : undefined,
              }))
            } else if (event.type === 'error') {
              updateAssistant(assistantId, (m) => ({
                ...m,
                content: event.message,
                isError: true,
              }))
            }
          }
        }

        // اگر استریم بی‌هیچ done/error پایان یافت، چیزی تجمیع شده باشد را نگه می‌داریم
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId && m.content.trim().length === 0
              ? { ...m, content: GENERIC_ERROR_MESSAGE, isError: true }
              : m
          )
        )
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        const message = err instanceof Error && err.message ? err.message : GENERIC_ERROR_MESSAGE
        updateAssistant(assistantId, (m) => ({ ...m, content: message, isError: true }))
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null
          setIsStreaming(false)
        }
      }
    },
    [isStreaming, updateAssistant]
  )

  return { messages, isStreaming, reset, send }
}
