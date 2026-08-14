import { prisma } from './db'

/**
 * ساختارهای کمکی برای seed — سناریوهای race روی دادهٔ مشخص.
 */

export async function seedProductWithInventory(opts: {
  slug?: string
  sku?: string
  name?: string
  quantityOnHand: number
}) {
  const product = await prisma.product.create({
    data: {
      slug: opts.slug ?? `prod-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
      name: opts.name ?? 'محصول تست',
      brand: 'test',
      model: 'M1',
      sku: opts.sku ?? `SKU-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
      category: 'printer',
      priceType: 'fixed',
      price: 1_000_000,
      shortDescription: 'تست',
    },
  })
  await prisma.inventoryItem.create({
    data: {
      productId: product.id,
      quantityOnHand: opts.quantityOnHand,
      quantityReserved: 0,
    },
  })
  return product
}

export async function seedCustomer(email?: string) {
  return prisma.customer.create({
    data: {
      email: email ?? `cust-${Date.now()}-${Math.floor(Math.random() * 1e6)}@test.local`,
      name: 'مشتری تست',
    },
  })
}

export async function seedOrder(customerId: string) {
  return prisma.order.create({
    data: {
      customerId,
      status: 'pending',
      totalAmount: 1_000_000,
      currency: 'IRR',
    },
  })
}

export async function seedCoupon(opts: { code?: string; usageLimit?: number; perCustomerLimit?: number }) {
  return prisma.coupon.create({
    data: {
      code: opts.code ?? `CP-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
      name: 'کوپن تست',
      type: 'fixed_amount',
      value: 100_000,
      minOrderAmount: 0,
      usageLimit: opts.usageLimit ?? null,
      perCustomerLimit: opts.perCustomerLimit ?? 1,
    },
  })
}
