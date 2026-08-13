import 'server-only'
import { logger } from '@/server/shared/logger'

/**
 * شنوندهٔ محصول تازه‌ساخته‌شده.
 *
 * قانون غیرقابل‌تخطی: هوش مصنوعی هرگز در دیتابیس نمی‌نویسد.
 * تولید سئو فقط از تب «دستیار سئو (AI)» و با تأیید فیلد‌به‌فیلد مدیر
 * وارد draft می‌شود. این subscriber عمداً callChat را صدا نمی‌زند
 * تا هزینهٔ توکن بی‌بازبینی نسوزد و مسیر نوشتن پنهان ساخته نشود.
 */
export async function handleProductCreated(event: { productId: string; actorId: string }) {
  logger.info(
    { productId: event.productId, actorId: event.actorId },
    '[AI SEO] auto-write disabled — human review required'
  )
}
