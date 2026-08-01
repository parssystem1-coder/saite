import { beforeEach, describe, expect, it } from 'vitest'
import { useCartStore } from '@/store/cart-store'
import type { Product } from '@/types/product'

const baseProduct: Product = {
  id: 'p-001',
  slug: 'canon-lbp-2900',
  brand: 'canon',
  model: 'LBP-2900',
  name: 'پرینتر لیزری کانن',
  sku: 'CN-LBP2900',
  category: 'printer',
  priceType: 'fixed',
  price: 4_850_000,
  stockStatus: 'in_stock',
  images: ['/products/printer.svg'],
  shortDescription: 'توضیح کوتاه',
  keyFeatures: [],
  specs: [],
  condition: 'new',
  createdAt: '2026-05-12',
}

/** کالای استعلامی — نباید وارد سبد شود */
const quoteOnlyProduct: Product = {
  ...baseProduct,
  id: 'k-001',
  slug: 'bizhub-266',
  model: 'bizhub 266',
  priceType: 'quote_only',
  price: undefined,
  stockStatus: 'on_request',
}

describe('useCartStore', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [] })
  })

  it('محصول جدید را با تعداد ۱ اضافه می‌کند', () => {
    useCartStore.getState().addItem(baseProduct)
    const { items } = useCartStore.getState()

    expect(items).toHaveLength(1)
    expect(items[0].quantity).toBe(1)
    expect(items[0].model).toBe('LBP-2900')
  })

  it('در افزودن مجدد، تعداد را زیاد می‌کند نه ردیف جدید', () => {
    const { addItem } = useCartStore.getState()
    addItem(baseProduct)
    addItem(baseProduct)

    const { items } = useCartStore.getState()
    expect(items).toHaveLength(1)
    expect(items[0].quantity).toBe(2)
  })

  it('تعداد دلخواه را می‌پذیرد', () => {
    useCartStore.getState().addItem(baseProduct, 3)
    expect(useCartStore.getState().items[0].quantity).toBe(3)
  })

  it('کالای استعلامی را به سبد اضافه نمی‌کند', () => {
    useCartStore.getState().addItem(quoteOnlyProduct)
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('تعداد صفر یا منفی را نادیده می‌گیرد', () => {
    useCartStore.getState().addItem(baseProduct, 0)
    useCartStore.getState().addItem(baseProduct, -5)
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('مجموع قیمت را درست محاسبه می‌کند', () => {
    const { addItem, updateQuantity } = useCartStore.getState()
    addItem(baseProduct)
    addItem({ ...baseProduct, id: 'p-002', slug: 'hp-m404', price: 1_000_000 })
    updateQuantity('p-001', 2)

    expect(useCartStore.getState().totalPrice()).toBe(4_850_000 * 2 + 1_000_000)
  })

  it('itemCount مجموع تعدادها را برمی‌گرداند نه تعداد ردیف‌ها', () => {
    const { addItem } = useCartStore.getState()
    addItem(baseProduct, 2)
    addItem({ ...baseProduct, id: 'p-002', slug: 'hp-m404' }, 3)

    expect(useCartStore.getState().items).toHaveLength(2)
    expect(useCartStore.getState().itemCount()).toBe(5)
  })

  it('با تعداد صفر، آیتم را حذف می‌کند', () => {
    useCartStore.getState().addItem(baseProduct)
    useCartStore.getState().updateQuantity('p-001', 0)
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('removeItem فقط همان آیتم را حذف می‌کند', () => {
    const { addItem, removeItem } = useCartStore.getState()
    addItem(baseProduct)
    addItem({ ...baseProduct, id: 'p-002', slug: 'hp-m404' })
    removeItem('p-001')

    const { items } = useCartStore.getState()
    expect(items).toHaveLength(1)
    expect(items[0].id).toBe('p-002')
  })

  it('clearCart سبد را خالی می‌کند', () => {
    useCartStore.getState().addItem(baseProduct, 4)
    useCartStore.getState().clearCart()

    expect(useCartStore.getState().items).toHaveLength(0)
    expect(useCartStore.getState().totalPrice()).toBe(0)
  })
})
