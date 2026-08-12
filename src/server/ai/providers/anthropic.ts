import 'server-only'
import { fetchJson } from '@/server/shared/fetch'
import { AI_STREAM_TIMEOUT_MS, AI_TIMEOUT_MS } from '@/server/shared/constants'
import type {
  ProviderStreamEvent,
  ProviderStreamOptions,
} from '@/server/ai/stream-types'

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_MODEL = 'claude-sonnet-4-20250514'
/** سقف پیش‌فرض توکن استریم در صورت عدم تعیین */
const STREAM_DEFAULT_MAX_TOKENS = 900

interface AnthropicResponse {
  content?: { type?: string; text?: string }[]
  usage?: { input_tokens?: number; output_tokens?: number }
}

/** زیرمجموعهٔ رویدادهای SSE استریم Anthropic که برای ما معنا دارد */
interface AnthropicStreamEvent {
  type?: string
  delta?: { type?: string; text?: string }
  message?: { usage?: { input_tokens?: number; output_tokens?: number } }
  usage?: { output_tokens?: number }
}

export const anthropicProvider = {
  async chat(opts: { feature: string; prompt: string; actorId: string; maxTokens?: number }) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set')

    const started = Date.now()
    const data = await fetchJson<AnthropicResponse>(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: opts.maxTokens || 1000,
        messages: [{ role: 'user', content: opts.prompt }],
      }),
      timeoutMs: AI_TIMEOUT_MS,
      retries: 1,
      initialDelayMs: 500,
      maxDelayMs: 2000,
    })
    const durationMs = Date.now() - started

    return {
      text: data.content?.[0]?.text || '',
      usage: {
        inputTokens: data.usage?.input_tokens || 0,
        outputTokens: data.usage?.output_tokens || 0,
      },
      durationMs,
    }
  },

  /**
   * چت استریم (SSE) — برای مشاور فروش.
   *
   * ── چرا fetch خام و نه fetchJson؟ ──────────────────────────
   * fetchJson کل بدنه را یک‌جا parse می‌کند؛ استریم نیاز به خواندن
   * تدریجی body دارد. کنترل خطای HTTP و سقف زمانی کلی در همین‌جا
   * مدیریت می‌شود (AbortController هر دو جهت را می‌پوشاند).
   */
  async *chatStream(opts: ProviderStreamOptions): AsyncGenerator<ProviderStreamEvent> {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set')

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), AI_STREAM_TIMEOUT_MS)

    try {
      const res = await fetch(ANTHROPIC_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: ANTHROPIC_MODEL,
          max_tokens: opts.maxTokens || STREAM_DEFAULT_MAX_TOKENS,
          system: opts.system,
          messages: opts.messages,
          stream: true,
        }),
        signal: controller.signal,
      })

      if (!res.ok || !res.body) {
        const bodySnippet = await res.text().catch(() => '')
        throw new Error(`Anthropic stream failed: ${res.status} ${bodySnippet.slice(0, 200)}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let inputTokens = 0
      let outputTokens = 0

      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        // رویدادهای SSE با خط خالی از هم جدا می‌شوند
        let sepIndex: number
        while ((sepIndex = buffer.indexOf('\n\n')) !== -1) {
          const rawEvent = buffer.slice(0, sepIndex)
          buffer = buffer.slice(sepIndex + 2)

          const dataLine = rawEvent
            .split('\n')
            .find((line) => line.startsWith('data:'))
          if (!dataLine) continue

          const payload = dataLine.slice('data:'.length).trim()
          if (!payload) continue

          let event: AnthropicStreamEvent
          try {
            event = JSON.parse(payload) as AnthropicStreamEvent
          } catch {
            continue // رویداد ناخوانا امن نادیده گرفته می‌شود
          }

          if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta' && event.delta.text) {
            yield { type: 'delta', text: event.delta.text }
          } else if (event.type === 'message_start') {
            inputTokens = event.message?.usage?.input_tokens ?? inputTokens
            outputTokens = event.message?.usage?.output_tokens ?? outputTokens
          } else if (event.type === 'message_delta') {
            // در message_delta به‌صورت تجمعی گزارش می‌شود
            outputTokens = event.usage?.output_tokens ?? outputTokens
          }
        }
      }

      yield { type: 'done', inputTokens, outputTokens }
    } finally {
      clearTimeout(timeout)
    }
  },
}

