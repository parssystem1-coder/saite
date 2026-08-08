import 'server-only'

const OPENAI_API = 'https://api.openai.com/v1/embeddings'

export const openaiEmbeddings = {
  async create(text: string) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) throw new Error('OPENAI_API_KEY not set')

    const res = await fetch(OPENAI_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`OpenAI error: ${res.status} ${err}`)
    }

    const data = await res.json()
    return data.data?.[0]?.embedding as number[]
  },
}
