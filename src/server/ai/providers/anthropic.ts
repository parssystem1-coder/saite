import 'server-only'

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'

export const anthropicProvider = {
  async chat(opts: { feature: string; prompt: string; actorId: string; maxTokens?: number }) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set')

    const started = Date.now()
    const res = await fetch(ANTHROPIC_API, {
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
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Anthropic error: ${res.status} ${err}`)
    }

    const data = await res.json()
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
