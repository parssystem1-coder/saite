import { describe, expect, it } from 'vitest'
import { ADMIN_NAV, filterAdminNavByRole, flattenAdminNav } from '@/lib/admin/nav'

/*
  فیلتر منو فقط UX است، اما اگر بشکند کاربر لینک‌هایی می‌بیند که
  کلیک روی آن‌ها به 403 می‌رسد — تجربهٔ بدی است. این تست‌ها مرزها
  را قفل می‌کنند.
*/

describe('filterAdminNavByRole', () => {
  it('null → آرایهٔ خالی (کاربر بدون نقش هیچ آیتمی نمی‌بیند)', () => {
    expect(filterAdminNavByRole(ADMIN_NAV, null)).toEqual([])
    expect(filterAdminNavByRole(ADMIN_NAV, undefined)).toEqual([])
  })

  it('admin همهٔ گروه‌ها را می‌بیند', () => {
    const filtered = filterAdminNavByRole(ADMIN_NAV, 'admin')
    // شمارش گروه‌ها باید با ADMIN_NAV اصلی برابر باشد
    expect(filtered.length).toBe(ADMIN_NAV.length)
    // آیتم settings برای admin موجود است
    const system = filtered.find((g) => g.id === 'system')
    expect(system?.children?.some((c) => c.id === 'settings')).toBe(true)
  })

  it('viewer گروه finance را می‌بیند (finance:read دارد) اما invoice-settings را ندارد', () => {
    const filtered = filterAdminNavByRole(ADMIN_NAV, 'viewer')
    const finance = filtered.find((g) => g.id === 'finance')
    expect(finance).toBeDefined()
    // چون viewer 'finance:write' ندارد، این آیتم فیلتر می‌شود
    const hasInvoiceSettings = finance?.children?.some((c) => c.id === 'invoice-settings')
    expect(hasInvoiceSettings).toBe(false)
    // اما invoices/transactions/wallet را می‌بیند (خواندنی)
    expect(finance?.children?.some((c) => c.id === 'invoices')).toBe(true)
  })

  it('operator گروه settings را اصلاً نمی‌بیند', () => {
    const filtered = filterAdminNavByRole(ADMIN_NAV, 'operator')
    const system = filtered.find((g) => g.id === 'system')
    // system هست ولی settings و zeros از آن حذف شده‌اند
    expect(system).toBeDefined()
    expect(system?.children?.some((c) => c.id === 'settings')).toBe(false)
    expect(system?.children?.some((c) => c.id === 'shipping-settings')).toBe(false)
    expect(system?.children?.some((c) => c.id === 'payment-settings')).toBe(false)
    expect(system?.children?.some((c) => c.id === 'seo-connections')).toBe(false)
    // اما راهنما می‌ماند
    expect(system?.children?.some((c) => c.id === 'help')).toBe(true)
  })

  it('viewer آیتم "افزودن محصول" را نمی‌بیند (catalog:write لازم است)', () => {
    const filtered = filterAdminNavByRole(ADMIN_NAV, 'viewer')
    const store = filtered.find((g) => g.id === 'store')
    expect(store?.children?.some((c) => c.id === 'products-new')).toBe(false)
    // ولی خود products را می‌بیند
    expect(store?.children?.some((c) => c.id === 'products')).toBe(true)
  })

  it('flattenAdminNav خودش هیچ فیلتری نمی‌زند — همه چیز را برمی‌گرداند', () => {
    // این helper برای sitemap داخلی است، نباید بر اساس نقش فیلتر کند
    const all = flattenAdminNav()
    expect(all.length).toBeGreaterThan(20)
  })
})
