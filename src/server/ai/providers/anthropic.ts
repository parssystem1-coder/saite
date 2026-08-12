import 'server-only'
import { fetchJson } from '@/server/shared/fetch'
import { AI_TIMEOUT_MS } from '@/server/shared/constants'

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'

interface AnthropicResponse {
  content?: { type?: string; text?: string }[]
  usage?: { input_tokens?: number; output_tokens?: number }
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
        model: 'claude-sonnet-4-20250514',
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
}
