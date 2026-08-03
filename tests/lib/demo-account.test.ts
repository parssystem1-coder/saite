import { describe, expect, it } from 'vitest'
import { DEMO_ADMIN_EMAIL, resolveDemoRole } from '@/lib/auth/demo-account'

describe('resolveDemoRole', () => {
  it('ایمیل مدیر آزمایشی نقش admin می‌گیرد', () => {
    expect(resolveDemoRole(DEMO_ADMIN_EMAIL)).toBe('admin')
  })

  it('بزرگی حروف و فضای اضافه اثری ندارد', () => {
    expect(resolveDemoRole(`  ${DEMO_ADMIN_EMAIL.toUpperCase()}  `)).toBe('admin')
  })

  it('هر ایمیل دیگری نقش user می‌گیرد', () => {
    expect(resolveDemoRole('someone@example.com')).toBe('user')
    expect(resolveDemoRole('')).toBe('user')
  })

  it('ایمیل مشابه ولی نه یکسان، admin نمی‌شود', () => {
    expect(resolveDemoRole('admin@saite.example.com.evil.com')).toBe('user')
    expect(resolveDemoRole('xadmin@saite.example.com')).toBe('user')
  })
})
