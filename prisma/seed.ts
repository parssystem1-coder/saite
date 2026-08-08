import { PrismaClient, Prisma } from '@prisma/client'
import { PRODUCTS } from '../src/lib/mock-data'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  await prisma.product.deleteMany()

  for (const product of PRODUCTS) {
    await prisma.product.create({
      data: {
        id: product.id,
        slug: product.slug,
        name: product.name,
        brand: product.brand,
        model: product.model,
        sku: product.sku,
        category: product.category,
        subCategory: product.subCategory,
        priceType: product.priceType,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        stockStatus: product.stockStatus,
        images: product.images,
        shortDescription: product.shortDescription,
        description: product.description,
        keyFeatures: product.keyFeatures,
        specs: product.specs ? (product.specs as unknown as Prisma.InputJsonValue) : undefined,
        technology: product.technology,
        colorSupport: product.colorSupport,
        usageClass: product.usageClass,
        warrantyMonths: product.warrantyMonths,
        condition: product.condition,
        compatibleWith: product.compatibleWith,
        consumables: product.consumables,
        isFeatured: product.isFeatured,
        isBestSeller: product.isBestSeller,
        createdAt: product.createdAt ? new Date(product.createdAt) : undefined,
      },
    })
  }

  console.log(`✅ Seeded ${PRODUCTS.length} products`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
