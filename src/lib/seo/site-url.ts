/** آدرس پایهٔ سایت برای canonical، OG و JSON-LD */
export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
}

/** تبدیل مسیر نسبی به URL مطلق (برای schema.org) */
export function absoluteUrl(path: string): string {
  const base = getSiteUrl().replace(/\/$/, '')
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}
