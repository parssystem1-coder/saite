import 'server-only'
import { logger } from '@/server/shared/logger'
import { callChat } from '../../gateway'
import { prisma } from '@/server/shared/db'

export async function handleProductCreated(event: { productId: string; actorId: string }) {
  const product = await prisma.product.findUnique({ where: { id: event.productId } })
  if (!product) return

  try {
    const seoText = await callChat({
      feature: 'product-seo',
      actorId: event.actorId,
      variables: {
        productName: product.name,
        category: product.category,
        specs: product.specs,
      },
    })

    // ذخیره یا به‌روزرسانی متن تولید شده در توضیحات محصول در صورت خالی بودن
    if (!product.description && seoText) {
      await prisma.product.update({
        where: { id: product.id },
        data: { description: seoText },
      })
    }

    logger.info({ productId: product.id, slug: product.slug, seoLength: seoText.length }, '[AI SEO] Generated and saved')
  } catch (err) {
    logger.error({ err, productId: event.productId }, '[AI SEO] Failed to generate SEO')
  }
}
