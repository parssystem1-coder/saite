import { BRANDS, CATEGORIES } from '@/lib/constants'
import {
  productSeoSuggestionSchema,
  type ProductSeoSuggestion,
} from '@/lib/seo/product-seo-suggestion'

function looksLike(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}

export function resolveCatalogBrand(raw: string | undefined): string | undefined {
  const value = raw?.trim()
  if (!value) return undefined
  const hit = BRANDS.find(
    (brand) =>
      looksLike(brand.displayName, value) || looksLike(brand.slug, value) || looksLike(brand.name, value)
  )
  return hit?.displayName
}

export function resolveCatalogCategory(raw: string | undefined): string | undefined {
  const value = raw?.trim()
  if (!value) return undefined
  const hit = CATEGORIES.find((category) => looksLike(category.slug, value) || looksLike(category.name, value))
  return hit?.slug
}

export function resolveCatalogSubCategory(
  categorySlug: string | undefined,
  raw: string | undefined
): string | undefined {
  const value = raw?.trim()
  if (!value || !categorySlug) return undefined
  const category = CATEGORIES.find((item) => item.slug === categorySlug)
  const hit = category?.subCategories?.find((sub) => looksLike(sub.slug, value) || looksLike(sub.name, value))
  return hit?.slug
}

export function toSafeSlug(raw: string | undefined): string | undefined {
  if (!raw) return undefined
  const slug = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
  return slug.length >= 3 ? slug : undefined
}

export function toSafeSku(raw: string | undefined): string | undefined {
  if (!raw) return undefined
  const sku = raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  return sku.length >= 3 ? sku : undefined
}

/**
 * دسته/برند را به فهرست فروشگاه می‌چسباند.
 * مقدار ناشناخته حذف می‌شود تا دستهٔ جعلی وارد پیش‌نویس نشود.
 */
export function normalizeProductSeoSuggestion(value: ProductSeoSuggestion): ProductSeoSuggestion {
  const brand = resolveCatalogBrand(value.brand)
  const category = resolveCatalogCategory(value.category)
  const subCategory = resolveCatalogSubCategory(category ?? value.category, value.subCategory)
  const slug = toSafeSlug(value.slug) ?? toSafeSlug(value.nameEn) ?? toSafeSlug(value.model)
  const sku = toSafeSku(value.sku)

  const next: ProductSeoSuggestion = {
    ...value,
    brand,
    category,
    subCategory,
    slug,
    sku,
  }

  const parsed = productSeoSuggestionSchema.safeParse(next)
  return parsed.success ? parsed.data : value
}
