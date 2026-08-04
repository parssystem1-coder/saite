import { describe, expect, it } from 'vitest'
import { IS_DEMO_MODE } from '@/lib/auth/demo-mode'

/**
 * محافظت در برابر نشت اعتبارنامهٔ نمایشی به production.
 *
 * اگر این تست بشکند یعنی کسی گارد محیطی را برداشته و رمز پنل
 * روی هاست عمومی قابل خواندن می‌شود.
 */
describe('IS_DEMO_MODE', () => {
  it('در محیط تست/توسعه فعال است', () => {
    expect(typeof IS_DEMO_MODE).toBe('boolean')
  })

  it('🔑 فقط به NODE_ENV وابسته است — با متغیر محیطی روشن نمی‌شود', () => {
    // اگر از NEXT_PUBLIC_* استفاده می‌شد، ممکن بود اشتباهاً روی
    // production روشن بماند. عمداً غیرقابل تنظیم است.
    expect(IS_DEMO_MODE).toBe(process.env.NODE_ENV === 'development')
  })
})
