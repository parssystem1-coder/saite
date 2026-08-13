import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildOfficialGtmJsUrl } from '@/lib/consent/analytics-consent'

const ROOT = join(__dirname, '../..')
const FORBIDDEN_PUBLIC_SEO_ENV = /NEXT_PUBLIC_(GTM_|GA4_|AHREFS_|SEMRUSH_|GOOGLE_SITE_)/

function walkSourceFiles(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git' || name === '.next' || name === 'dist') continue
    const full = join(dir, name)
    if (statSync(full).isDirectory()) {
      walkSourceFiles(full, acc)
      continue
    }
    if (/\.(ts|tsx|js|mjs|cjs|yml|yaml|example)$/.test(name) || name === '.env.example') {
      acc.push(full)
    }
  }
  return acc
}

describe('SEO / analytics public-env invariant', () => {
  it('در src و env شناسه/کلید سئو با NEXT_PUBLIC تعریف نشده', () => {
    const files = [join(ROOT, '.env.example'), ...walkSourceFiles(join(ROOT, 'src'))]
    const hits: string[] = []
    for (const file of files) {
      const text = readFileSync(file, 'utf8')
      if (FORBIDDEN_PUBLIC_SEO_ENV.test(text)) {
        hits.push(relative(ROOT, file))
      }
    }
    expect(hits).toEqual([])
  })
})

describe('GTM native snippet invariant', () => {
  it('کامپوننت GTM فقط gtm.js رسمی را می‌سازد و iframe ندارد', () => {
    const source = readFileSync(join(ROOT, 'src/components/analytics/gtm-script.tsx'), 'utf8')
    expect(source).toContain('buildOfficialGtmJsUrl')
    expect(source).not.toMatch(/dangerouslySetInnerHTML/)
    expect(source).not.toMatch(/ns\.html/)
    expect(source).not.toMatch(/<iframe/i)
    expect(source).not.toMatch(/googletagmanager\.com\/gtm\.js\?id=\$\{/)
    expect(buildOfficialGtmJsUrl('GTM-ABCDEF')).toBe(
      'https://www.googletagmanager.com/gtm.js?id=GTM-ABCDEF'
    )
  })
})
