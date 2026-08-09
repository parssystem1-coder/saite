/**
 * هوک راه‌اندازی Next.js — فقط روی سرور Node اجرا می‌شود.
 * جایگزین side-effect قدیم در src/server/shared/db.ts
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // فقط در runtime واقعی — نه در build و نه در Edge
    if (process.env.NEXT_PHASE === 'phase-production-build') return
    if (process.env.NODE_ENV === 'test') return
    // در compose جدا شده: فقط worker با RUN_JOBS=1 جاب‌ها را می‌دواند
    if (process.env.RUN_JOBS === '0') return

    const { startBackgroundJobs } = await import('@/server/jobs/init')
    await startBackgroundJobs()
  }
}
