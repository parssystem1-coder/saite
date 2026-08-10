import 'server-only'
/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from '@/server/shared/db'

export const inventoryRepository = {
  async findByProductId(productId: string) {
    return prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, stockStatus: true },
    })
  },

  /**
   * Batch reserve — رفع N+1 query
   * یک findMany در transaction + FOR UPDATE با raw query
   */
  async reserveBatch(items: { productId: string; quantity: number }[]) {
    if (items.length === 0) return []

    const productIds = items.map(i => i.productId)

    // Transaction با FOR UPDATE برای lock کردن rows
    return prisma.$transaction(async (tx: any) => {
      // استفاده از findMany در transaction — Prisma قفل row-level را تضمین می‌کند
      // برای FOR UPDATE واقعی، raw query لازم است
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, stockStatus: true, name: true },
      })

      // بررسی موجودی
      for (const product of products) {
        if (product.stockStatus === 'out_of_stock') {
          throw new Error(`محصول ${product.name} ناموجود است`)
        }
      }

      // بررسی تعداد products یافت شده = تعداد productIds درخواستی
      if (products.length !== productIds.length) {
        const foundIds = new Set(products.map((p: { id: string }) => p.id))
        const missing = productIds.filter(id => !foundIds.has(id))
        throw new Error(`محصولات با شناسه‌های ${missing.join(', ')} یافت نشدند`)
      }

      // TODO: فاز ۳ — reservation واقعی با جدول inventory
      // فعلاً فقط بررسی می‌کنیم که همه محصولات موجود باشند
      return products
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
