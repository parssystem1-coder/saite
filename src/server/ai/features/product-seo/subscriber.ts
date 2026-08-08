import 'server-only'
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
    console.log(`[AI SEO] Generated for ${product.slug}:`, seoText.substring(0, 100))
  } catch (err) {
    console.error('[AI SEO] Failed:', err)
  }
}
