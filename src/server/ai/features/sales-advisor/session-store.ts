import 'server-only'
import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from 'node:crypto'
import { redis } from '@/server/shared/redis'
import { logger } from '@/server/shared/logger'
import type { StreamChatMessage } from '@/server/ai/stream-types'

/**
 * حافظهٔ گفتگوی مشاور فروش — سمت سرور، رمزشده و کوتاه‌عمر.
 *
 * ── تصمیم‌های امنیتی ──────────────────────────────────────────
 * ۱. رمزنگاری-at-rest با AES-256-GCM: کلید از رمز نشست فروشگاه
 *    مشتق می‌شود (بدون env جدید). اگر Redis/دیسک لو رود، محتوای
 *    گفتگو بدون رمز سرور ناخوانا است.
 * ۲. TTL اسلایدینگ ۶ ساعته + سقف تعداد/طول پیام — کمینه‌سازی PII.
 * ۳. صاحبِ سشن (مشتری لاگین‌شده یا کلید IP مهمان) همراه رکورد ذخیره
 *    می‌شود؛ load با صاحب ناسازگار «سشن‌نو-نیست» برمی‌گرداند تا یک
 *    مهمان نتواند با حدس sessionId گفتگوی دیگری را ببیند.
 * ۴. متنِ ذخیره‌شده از پیام کاربر قبلاً از redactPII عبور کرده است
 *    (در روت) — اینجا هم رمزنگاری روی همان متن پاکسازی‌شده است.
 *
 * ── انتخاب ذخیره‌گاه ──────────────────────────────────────────
 * الگوی همان rate-limit/api repo: Redis در محیط عادی، و در تست یا
 * وقتی Redis در دسترس نیست، حافظهٔ درون‌process (fail-open تا چت
 * بالا بماند — از دست رفتن تاریخچه قابل‌قبول است).
 */

const SESSION_TTL_SECONDS = 6 * 60 * 60 // ۶ ساعت
const MAX_MESSAGES_PER_SESSION = 16
export const MAX_MESSAGE_CHARS = 2_000

/** برای دیباگ و تست */
export const __advisorSessionInternals = { SESSION_TTL_SECONDS, MAX_MESSAGES_PER_SESSION }

interface SessionRecord {
  v: 1
  ownerKey: string
  messages: StreamChatMessage[]
}

// ── رمزنگاری ─────────────────────────────────────────────────

const DEV_FALLBACK_SECRET = 'saite-dev-customer-secret-do-not-use-in-production'

function getEncryptionKey(): Buffer {
  const secret =
    process.env.ADVISOR_CHAT_SECRET?.trim() ||
    process.env.CUSTOMER_SESSION_SECRET?.trim() ||
    (process.env.NODE_ENV === 'production' ? '' : DEV_FALLBACK_SECRET)

  if (!secret || secret.length < 16) {
    throw new Error('رمزنگاری حافظهٔ چت پیکربندی نشده است (ADVISOR_CHAT_SECRET/CUSTOMER_SESSION_SECRET)')
  }
  return createHash('sha256').update(`saite-advisor-chat:${secret}`).digest()
}

function encryptRecord(record: SessionRecord): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', getEncryptionKey(), iv)
  const plaintext = Buffer.from(JSON.stringify(record), 'utf8')
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()])
  const tag = cipher.getAuthTag()
  return `v1.${Buffer.from(iv).toString('base64url')}.${tag.toString('base64url')}.${encrypted.toString('base64url')}`
}

function decryptRecord(payload: string): SessionRecord | null {
  try {
    const [version, ivB64, tagB64, cipherB64] = payload.split('.')
    if (version !== 'v1' || !ivB64 || !tagB64 || !cipherB64) return null
    const decipher = createDecipheriv('aes-256-gcm', getEncryptionKey(), Buffer.from(ivB64, 'base64url'))
    decipher.setAuthTag(Buffer.from(tagB64, 'base64url'))
    const plain = Buffer.concat([decipher.update(Buffer.from(cipherB64, 'base64url')), decipher.final()])
    const record = JSON.parse(plain.toString('utf8')) as SessionRecord
    if (record.v !== 1 || typeof record.ownerKey !== 'string' || !Array.isArray(record.messages)) {
      return null
    }
    return record
  } catch {
    return null
  }
}

// ── فروجکت حافظه‌ای (تست / فالبک) ────────────────────────────

interface MemoryEntry {
  payload: string
  expiresAt: number
}
const memoryStore = new Map<string, MemoryEntry>()

function memoryGet(key: string): string | null {
  const entry = memoryStore.get(key)
  if (!entry) return null
  if (entry.expiresAt <= Date.now()) {
    memoryStore.delete(key)
    return null
  }
  return entry.payload
}

function memorySet(key: string, payload: string): void {
  memoryStore.set(key, { payload, expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000 })
  // پاک‌سازی سادهٔ منقضی‌شده‌ها روی هر نوشتن
  if (memoryStore.size > 500) {
    const now = Date.now()
    for (const [k, v] of memoryStore) {
      if (v.expiresAt <= now) memoryStore.delete(k)
    }
  }
}

// ── دسترسی به ذخیره‌گاه (Redis با فالبک حافظه) ────────────────

function redisKey(sessionId: string): string {
  return `advisor-chat:${sessionId}`
}

/**
 * سقف انتظار برای هر فرمان Redis.
 * ioredis با `maxRetriesPerRequest: null` (پیکربندی مشترک ریپو) در
 * نبود Redis فرمان را برای همیشه در صف نگه می‌دارد که برای چت — یک
 * مسیر تعاملی — به معنای درخواست هنگ‌شده است. این ترکیب «وضعیت‌سنجی
 * + race-timeout» تضمین می‌کند چت همیشه پاسخ بدهد (فالبک حافظه).
 */
const REDIS_OP_TIMEOUT_MS = 1_500
let lastRedisWarnAt = 0

function warnRedisThrottled(context: string, err: unknown): void {
  const now = Date.now()
  if (now - lastRedisWarnAt < 60_000) return
  lastRedisWarnAt = now
  logger.warn({ err, context }, '[AdvisorSession] Redis unavailable — falling back to memory')
}

function withTimeout<T>(promise: Promise<T>): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_resolve, reject) =>
      setTimeout(() => reject(new Error('redis-op-timeout')), REDIS_OP_TIMEOUT_MS)
    ),
  ])
}

async function storeGet(sessionId: string): Promise<string | null> {
  if (process.env.NODE_ENV === 'test') return memoryGet(redisKey(sessionId))
  try {
    if (redis.status !== 'ready') throw new Error('redis not ready')
    return await withTimeout(redis.get(redisKey(sessionId)))
  } catch (err) {
    warnRedisThrottled('get', err)
    return memoryGet(redisKey(sessionId))
  }
}

async function storeSet(sessionId: string, payload: string): Promise<void> {
  if (process.env.NODE_ENV === 'test') {
    memorySet(redisKey(sessionId), payload)
    return
  }
  try {
    if (redis.status !== 'ready') throw new Error('redis not ready')
    await withTimeout(redis.set(redisKey(sessionId), payload, 'EX', SESSION_TTL_SECONDS))
  } catch (err) {
    warnRedisThrottled('set', err)
    memorySet(redisKey(sessionId), payload)
  }
}

// ── API عمومی ────────────────────────────────────────────────

export interface AdvisorSession {
  sessionId: string
  messages: StreamChatMessage[]
}

/** ساخت سشن جدید (هنوز چیزی ذخیره نمی‌شود تا اولین پیام برسد) */
export function createAdvisorSession(): AdvisorSession {
  return { sessionId: randomUUID(), messages: [] }
}

/**
 * بارگذاری سشن با کنترل مالکیت.
 * - سشن ناموجود/منقضی/خراب یا متعلق به کسی دیگر → null (روت سشن تازه می‌سازد).
 * - پیام‌های بیش از سقف کاراکتر حذف می‌شوند (دفاع در برابر دادهٔ خراب).
 */
export async function loadAdvisorSession(
  sessionId: string,
  ownerKey: string
): Promise<AdvisorSession | null> {
  const payload = await storeGet(sessionId)
  if (!payload) return null

  const record = decryptRecord(payload)
  if (!record || record.ownerKey !== ownerKey) return null

  const messages = record.messages
    .filter(
      (m) =>
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        m.content.length > 0 &&
        m.content.length <= MAX_MESSAGE_CHARS
    )
    .slice(-MAX_MESSAGES_PER_SESSION)

  return { sessionId, messages }
}

/**
 * افزودن پیام‌ها + تمدید TTL.
 * نسخهٔ قبلی با مالک یکسان فقط بازنویسی می‌شود.
 */
export async function appendAdvisorMessages(
  session: AdvisorSession,
  ownerKey: string,
  newMessages: StreamChatMessage[]
): Promise<void> {
  const messages = [...session.messages, ...newMessages]
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) }))
    .slice(-MAX_MESSAGES_PER_SESSION)

  session.messages = messages
  const record: SessionRecord = { v: 1, ownerKey, messages }
  await storeSet(session.sessionId, encryptRecord(record))
}
