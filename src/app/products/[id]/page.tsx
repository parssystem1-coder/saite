import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ProductDetailClient } from '@/components/products/product-detail-client'
import { JsonLd } from '@/components/seo/json-ld'
import {
  getConsumablesForDevice,
  getProductById,
  getProductBySlug,
  getRelatedProducts,
} from '@/lib/api'
import { CATEGORIES } from '@/lib/constants'
import { buildBreadcrumbLd } from '@/lib/seo/breadcrumb-ld'
import { buildFaqPageLd } from '@/lib/seo/faq-ld'
import { buildProductLd } from '@/lib/seo/product-ld'

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

  const [related, consumables] = await Promise.all([
    getRelatedProducts(product),
    getConsumablesForDevice(product),
  ])

  const category = CATEGORIES.find((c) => c.slug === product.category)

  const productLd = buildProductLd(product)
  const breadcrumbLd = buildBreadcrumbLd([
    { name: 'خانه', path: '/' },
    {
      name: category?.name ?? 'محصولات',
      path: `/products?category=${product.category}`,
    },
    { name: product.name, path: `/products/${product.slug}` },
  ])
  const faqLd =
    product.faqs && product.faqs.length > 0 ? buildFaqPageLd(product.faqs) : null

  return (
    <>
      <JsonLd data={productLd} />
      <JsonLd data={breadcrumbLd} />
      {faqLd && <JsonLd data={faqLd} />}
      <ProductDetailClient product={product} related={related} consumables={consumables} />
    </>
  )
}
