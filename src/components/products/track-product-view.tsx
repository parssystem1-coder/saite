'use client'

import { useEffect } from 'react'
import { trackProductView } from '@/lib/recently-viewed'
import type { ProductCardData } from '@/types/product'

/** ثبت بازدید در sessionStorage — بدون UI */
export function TrackProductView({ product }: { product: ProductCardData }) {
  useEffect(() => {
    trackProductView(product)
  }, [product])

  return null
}
