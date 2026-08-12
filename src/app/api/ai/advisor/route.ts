import { randomUUID } from 'node:crypto'
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { streamChat } from '@/server/ai/gateway'
import { consumeRateLimit, getClientKey } from '@/lib/auth/server/rate-limit'
import { getCustomerSession } from '@/server/auth/customer-session'
import { logger } from '@/server/shared/logger'
import {
  ADVISOR_FEATURE,
  ADVISOR_MAX_TOKENS,
  ADVISOR_PROMPT_VERSION,
  buildAdvisorSystemPrompt,
} from '@/server/ai/features/sales-advisor/prompt'
import { retrieveRelevantProducts } from '@/server/ai/features/sales-advisor/retrieval'
import { parseAdvisorOutput, validateSuggestions } from '@/server/ai/features/sales-advisor/output'
import {
  appendAdvisorMessages,
  createAdvisorSession,
  loadAdvisorSession,
  MAX_MESSAGE_CHARS,
} from '@/server/ai/features/sales-advisor/session-store'
import { detectInjection, redactPII } from '@/server/ai/safety'
import type { StreamChatMessage } from '@/server/ai/stream-types'

/**
 * POST /api/ai/advisor — چت مشاور فروش (SSE استریم)
 *
 * ── مرزهای امنیتی ────────────────────────────────────────────
 * ۱. AI هیچ ابزاری برای سبد/سفارش/پرداخت ندارد؛ فقط متن می‌فرستد.
 * ۲. ارجاع به محصول فقط پس از اعتبارسنجی با دیتابیس (validateSuggestions).
 * ۳. injection روی پیام/تاریخچه در gateway، و PII پیش از ذخیره/ارسال
 *    به provider با redactPII پاکسازی می‌شود.
 * ۴. rate-limit دو لایه (انفجاری + ساعتی) — برای مهمان و مشتری یکسان،
 *    کلیدشده بر مبنای کاربر لاگین‌شده یا IP.
 * ۵. خروجی به‌صورت SSE به کلاینت داخلی می‌رسد — بدون iframe.
 */

// next به‌صورت پیش‌فرض body استریم را buffer می‌کند؛ استریم چت nodejs می‌خواهد
export const runtime = 'nodejs'

const ADVISOR_BURST_LIMIT = { max: 6, windowMs: 60_000 }
const ADVISOR_HOURLY_LIMIT = { max: 40, windowMs: 3_600_000 }

const advisorBodySchema = z.object({
  message: z.string().trim().min(1, 'پیام خالی است').max(MAX_MESSAGE_CHARS, 'پیام بیش از حد طولانی است'),
  sessionId: z
    .string()
    .min(8)
    .max(64)
    .regex(/^[a-zA-Z0-9_-]+$/, 'شناسه سشن نامعتبر')
    .optional(),
})

const encoder = new TextEncoder()

function sseEvent(event: string, data: unknown): Uint8Array {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
}

function jsonError(message: string, status: number, headers?: Record<string, string>) {
  return Response.json({ error: message }, { status, headers })
}

export async function POST(req: NextRequest) {
  // ── احراز هویت اختیاری: مهمان هم می‌تواند گفتگو کند ────────
  const customerSession = await getCustomerSession()
  // کلید مالکیت سشن: کاربر لاگین‌شده اولویت دارد تا گفتگو بین
  // دستگاه‌ها/برنامه‌ها برای او یکی بماند، مهمان به IP گره می‌خورد.
  const clientKey = getClientKey(req.headers)
  const actorId = customerSession?.sub ?? `guest:${clientKey}`
  const ownerKey = customerSession ? `customer:${customerSession.sub}` : `guest:${clientKey}`

  // ── rate-limit دو لایه ─────────────────────────────────────
  const burst = await consumeRateLimit(`advisor:b:${actorId}`, ADVISOR_BURST_LIMIT.max, ADVISOR_BURST_LIMIT.windowMs)
  if (!burst.allowed) {
    return jsonError('در حال ارسال پیام بیش از حد سریع هستید. چند لحظه صبر کنید.', 429, {
      'Retry-After': String(burst.retryAfterSeconds),
    })
  }
  const hourly = await consumeRateLimit(`advisor:h:${actorId}`, ADVISOR_HOURLY_LIMIT.max, ADVISOR_HOURLY_LIMIT.windowMs)
  if (!hourly.allowed) {
    return jsonError('به سقف ساعتی گفتگو با دستیار هوشمند رسیدید. لطفاً کمی بعد دوباره تلاش کنید.', 429, {
      'Retry-After': String(hourly.retryAfterSeconds),
    })
  }

  // ── اعتبارسنجی ورودی ───────────────────────────────────────
  let body: z.infer<typeof advisorBodySchema>
  try {
    body = advisorBodySchema.parse(await req.json())
  } catch (err) {
    if (err instanceof z.ZodError) {
      return jsonError(err.issues[0]?.message ?? 'ورودی نامعتبر است', 400)
    }
    return jsonError('بدنهٔ درخواست نامعتبر است', 400)
  }

  // ── محافظت سریع در برابر prompt injection پیش از بازشدن استریم ──
  // (gateway هم دوباره روی کل تاریخچه چک می‌کند)
  if (detectInjection({ message: body.message })) {
    return jsonError('ورودی غیرمجاز شناسایی شد.', 400)
  }

  // ── پاکسازی PII پیش از ذخیره/ارسال به مدل ──────────────────
  const safeMessage = redactPII(body.message)

  // ── حافظهٔ گفتگو: سشن معتبر یا ساخت تازه ───────────────────
  const requestId = randomUUID()
  let session = body.sessionId
    ? await loadAdvisorSession(body.sessionId, ownerKey)
    : null
  if (!session) {
    session = createAdvisorSession()
    if (body.sessionId) {
      logger.info({ requestId, actorId }, '[Advisor] sessionId invalid/expired — new session created')
    }
  }

  // ── کانتکست کاتالوگ + ساخت پرامپت ──────────────────────────
  // اگر DB در دسترس نباشد چت را نمی‌کشیم: بدون کانتکست کاتالوگ
  // ادامه می‌دهیم (پرامپت «محصولی پیدا نشد» را به مدل می‌گوید) تا
  // کاربر همچنان پاسخ مشاوره‌ای عمومی دریافت کند.
  let systemPrompt: string
  try {
    const catalog = await retrieveRelevantProducts(safeMessage)
    systemPrompt = buildAdvisorSystemPrompt(catalog)
  } catch (err) {
    logger.warn({ err, requestId }, '[Advisor] catalog retrieval failed — continuing without catalog')
    systemPrompt = buildAdvisorSystemPrompt([])
  }

  const messagesWithCurrent: StreamChatMessage[] = [
    ...session.messages,
    { role: 'user', content: safeMessage },
  ]

  // ── استریم پاسخ ────────────────────────────────────────────
  const sessionRef = session
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(sseEvent(event, data))
      }

      let fullText = ''
      try {
        send('session', { sessionId: sessionRef.sessionId })

        for await (const event of streamChat({
          feature: ADVISOR_FEATURE,
          promptVersion: ADVISOR_PROMPT_VERSION,
          actorId,
          system: systemPrompt,
          messages: messagesWithCurrent,
          maxTokens: ADVISOR_MAX_TOKENS,
        })) {
          if (event.type === 'delta') {
            fullText += event.text
            send('delta', { text: event.text })
          }
        }

        // ── اعتبارسنجی خروجی (قانون: فقط ID معتبرِ DB) ─────────
        const { cleanText, rawSuggestedIds } = parseAdvisorOutput(fullText)
        const products = await validateSuggestions(rawSuggestedIds)

        // ذخیرهٔ تاریخچهٔ پاکسازی‌شده
        try {
          await appendAdvisorMessages(sessionRef, ownerKey, [
            { role: 'user', content: safeMessage },
            { role: 'assistant', content: cleanText.slice(0, MAX_MESSAGE_CHARS) },
          ])
        } catch (err) {
          logger.warn({ err, requestId }, '[Advisor] session persist failed')
        }

        send('done', { text: cleanText, products, sessionId: sessionRef.sessionId })
      } catch (err) {
        logger.error({ err, requestId, actorId }, '[Advisor] stream failed')
        send('error', {
          message: 'دستیار هوشمند موقتاً در دسترس نیست. بعداً تلاش کنید یا با پشتیبانی تماس بگیرید.',
        })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      // برای عبور از nginx بدون buffer شدن چانک‌ها
      'X-Accel-Buffering': 'no',
    },
  })
}
