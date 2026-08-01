import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ProductDetailClient } from '@/components/products/product-detail-client'
import { getProductById, getProductBySlug, getRelatedProducts } from '@/lib/api'

type Props = { params: Promise<{ id: string }> }

/** پارامتر مسیر می‌تواند slug (ترجیحی) یا id قدیمی باشد */
async function resolveProduct(idOrSlug: string) {
  return (await getProductBySlug(idOrSlug)) ?? (await getProductById(idOrSlug))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const product = await resolveProduct(id)

  if (!product) return { title: 'محصول یافت نشد' }

  return {
    title: product.name,
    description: product.shortDescription.slice(0, 160),
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: product.name,
      description: product.shortDescription,
      images: product.images.map((url) => ({ url, alt: product.name })),
      type: 'website',
      locale: 'fa_IR',
    },
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params
  const product = await resolveProduct(id)

  if (!product) notFound()

  const related = await getRelatedProducts(product)

  // دادهٔ ساخت‌یافته برای نمایش قیمت و موجودی در نتایج جستجو
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    sku: product.sku,
    brand: { '@type': 'Brand', name: product.brand },
    model: product.model,
    description: product.shortDescription,
    image: product.images,
    ...(product.priceType === 'fixed' && product.price !== undefined
      ? {
          offers: {
            '@type': 'Offer',
            priceCurrency: 'IRR',
            price: product.price,
            availability:
              product.stockStatus === 'out_of_stock'
                ? 'https://schema.org/OutOfStock'
                : 'https://schema.org/InStock',
          },
        }
      : {}),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailClient product={product} related={related} />
    </>
  )
}
