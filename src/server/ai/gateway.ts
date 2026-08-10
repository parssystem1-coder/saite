import 'server-only'
import { anthropicProvider } from './providers/anthropic'
import { openaiEmbeddings } from './providers/openai'
import { mockAiProvider } from './providers/mock'
import { trackCost } from './cost-tracker'
import { detectInjection, redactPII } from './safety'
import { ServiceUnavailableError, ValidationError } from '@/server/shared/errors'
import { logger } from '@/server/shared/logger'

export interface ChatOptions {
  feature: string
  promptVersion?: string
  actorId: string
  variables: Record<string, unknown>
  maxTokens?: number
}

export async function callChat(opts: ChatOptions) {
  if (detectInjection(opts.variables)) {
    throw new ValidationError({ prompt: 'ورودی مشکوک به prompt injection شناسایی شد' }, 'ورودی غیرمجاز')
  }

  const prompt = renderPrompt(opts.feature, opts.variables)
  const safePrompt = redactPII(prompt)

  const hasAnthropicKey = Boolean(process.env.ANTHROPIC_API_KEY)
  // پاسخ ساختگی در production نباید به‌عنوان پاسخ پشتیبانی/SEO واقعی
  // به کاربر برسد. mock فقط ابزار توسعه و تست است.
  if (!hasAnthropicKey && process.env.NODE_ENV === 'production') {
    throw new ServiceUnavailableError('سرویس هوش مصنوعی پیکربندی نشده است', 'AI_PROVIDER_NOT_CONFIGURED')
  }

  const provider = hasAnthropicKey ? anthropicProvider : mockAiProvider

  try {
    const result = await provider.chat({
      feature: opts.feature,
      prompt: safePrompt,
      actorId: opts.actorId,
      maxTokens: opts.maxTokens,
    })

    await trackCost({
      feature: opts.feature,
      promptVersion: opts.promptVersion || 'v1',
      provider: process.env.ANTHROPIC_API_KEY ? 'anthropic' : 'mock',
      model: 'claude-sonnet-4',
      actorId: opts.actorId,
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
      durationMs: result.durationMs || 0,
      status: 'success',
    })

    return result.text
  } catch (err) {
    logger.error({ err, feature: opts.feature, actorId: opts.actorId }, '[AiGateway] callChat error')
    await trackCost({
      feature: opts.feature,
      promptVersion: opts.promptVersion || 'v1',
      provider: 'anthropic',
      model: 'claude-sonnet-4',
      actorId: opts.actorId,
      inputTokens: 0,
      outputTokens: 0,
      durationMs: 0,
      status: 'error',
    })
    throw err
  }
}

export async function callEmbedding(text: string) {
  if (!process.env.OPENAI_API_KEY) {
    if (process.env.NODE_ENV === 'production') {
      throw new ServiceUnavailableError('سرویس embedding پیکربندی نشده است', 'EMBEDDING_PROVIDER_NOT_CONFIGURED')
    }
    return new Array(1536).fill(0)
  }
  return openaiEmbeddings.create(text)
}

function renderPrompt(feature: string, variables: Record<string, unknown>): string {
  const templates: Record<string, (vars: Record<string, unknown>) => string> = {
    'product-seo': (vars) => `شما دستیار سئوی فروشگاه فارسی هستید...
محصول: ${vars.productName}
دسته: ${vars.category}
مشخصات: ${JSON.stringify(vars.specs)}`,
    'support-chat': (vars) => `شما دستیار پشتیبانی فروشگاه Saite هستید...
سؤال مشتری: ${vars.question}`,
    'admin-assist': (vars) => `شما دستیار مدیر فروشگاه Saite هستید...
درخواست: ${vars.task}`,
  }

  const template = templates[feature]
  if (!template) throw new ValidationError({ feature: `قالب نامعتبر است: ${feature}` }, `Prompt template not found: ${feature}`)
  return template(variables)
}
