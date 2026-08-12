import 'server-only'
import { fetchJson } from '@/server/shared/fetch'
import { AI_TIMEOUT_MS } from '@/server/shared/constants'

const OPENAI_API = 'https://api.openai.com/v1/embeddings'

interface OpenAIEmbeddingResponse {
  data?: { embedding?: number[] }[]
}

export const openaiEmbeddings = {
  async create(text: string) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) throw new Error('OPENAI_API_KEY not set')

    const data = await fetchJson<OpenAIEmbeddingResponse>(OPENAI_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
      }),
      timeoutMs: AI_TIMEOUT_MS,
      retries: 1,
      initialDelayMs: 500,
      maxDelayMs: 2000,
    })

    return data.data?.[0]?.embedding as number[]
  },
}
