import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

/**
 * فاز ۳ — پوشش rate-limit روی mutationها.
 *
 * معیار پذیرش: هیچ POST/PATCH/DELETE بدون سقف نرخ نماند.
 * (تست grep-ای) برای هر route تحت src/app/api که handler تغییری
 * دارد (POST/PATCH/DELETE)، فایل باید حداقل یکی از مکانیزم‌های
 * rate-limit را داشته باشد:
 *   - checkRouteRateLimit / checkMutationRateLimit (جدول متمرکز فاز ۳)
 *   - consumeRateLimit (سقف‌های موجود مثل ai-chat، coupon-validate، session)
 */
const API_ROOT = join(process.cwd(), 'src/app/api')

const RATE_LIMIT_MARKERS = [
  'checkRouteRateLimit',
  'checkMutationRateLimit',
  'consumeRateLimit',
]

function collectRouteFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...collectRouteFiles(full))
    else if (entry === 'route.ts') out.push(full)
  }
  return out
}

function hasMutationHandler(content: string): boolean {
  return /export async function (POST|PATCH|DELETE)/.test(content)
}

describe('پوشش rate-limit روی mutationها (فاز ۳)', () => {
  it('هیچ route با mutation، بدون سقف نرخ نیست', () => {
    const missing: string[] = []
    for (const file of collectRouteFiles(API_ROOT)) {
      const content = readFileSync(file, 'utf8')
      if (!hasMutationHandler(content)) continue
      if (!RATE_LIMIT_MARKERS.some((m) => content.includes(m))) {
        missing.push(file.replace(process.cwd(), ''))
      }
    }
    expect(missing).toEqual([])
  })
})
