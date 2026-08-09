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

    // TODO: ذخیره SEO در جدول product_seo
    logger.info({ slug: product.slug, seoPreview: seoText.substring(0, 100) }, '[AI SEO] Generated')
  } catch (err) {
    logger.error({ err }, '[AI SEO] Failed')
  }
}
