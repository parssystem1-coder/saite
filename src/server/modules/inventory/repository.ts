import 'server-only'
import { prisma } from '@/server/shared/db'

export const inventoryRepository = {
  async findByProductId(productId: string) {
    return prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, stockStatus: true },
    })
  },

  async reserve(productId: string, _quantity: number) {
    // TODO: فاز ۳ — reservation واقعی با جدول inventory
    const product = await prisma.product.findUnique({ where: { id: productId } })
    if (!product || product.stockStatus === 'out_of_stock') {
      throw new Error('محصول ناموجود است')
    }
    return product
  },

  async release(productId: string, _quantity: number) {
    // TODO: فاز ۳ — release reservation
    return prisma.product.findUnique({ where: { id: productId } })
  },
}
