import { describe, expect, it } from 'vitest'
import {
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  isAdminRole,
  parseAdminRole,
  roleLabel,
} from '@/lib/auth/rbac'

/*
  RBAC قلب فاز B است. اگر جدول مجوزها یک روز غلط عوض شود، viewer
  می‌تواند فاکتور صادر کند یا operator رمز درگاه را ببیند. این
  تست‌ها این خط قرمز را می‌کشند.
*/

describe('hasPermission — نگاشت اصلی نقش → مجوز', () => {
  it('viewer فقط خواندن دارد', () => {
    expect(hasPermission('viewer', 'orders:read')).toBe(true)
    expect(hasPermission('viewer', 'finance:read')).toBe(true)
    expect(hasPermission('viewer', 'orders:write')).toBe(false)
    expect(hasPermission('viewer', 'finance:write')).toBe(false)
    expect(hasPermission('viewer', 'settings:write')).toBe(false)
    expect(hasPermission('viewer', 'users:manage')).toBe(false)
  })

  it('operator عملیات روزمره را دارد اما finance/settings/users را ندارد', () => {
    expect(hasPermission('operator', 'orders:write')).toBe(true)
    expect(hasPermission('operator', 'customers:write')).toBe(true)
    expect(hasPermission('operator', 'catalog:write')).toBe(true)
    expect(hasPermission('operator', 'marketing:write')).toBe(true)
    expect(hasPermission('operator', 'comms:write')).toBe(true)
    // مرزها — این‌ها عمداً بسته‌اند
    expect(hasPermission('operator', 'finance:write')).toBe(false)
    expect(hasPermission('operator', 'settings:write')).toBe(false)
    expect(hasPermission('operator', 'users:manage')).toBe(false)
  })

  it('admin همه‌کاره است', () => {
    expect(hasPermission('admin', 'finance:write')).toBe(true)
    expect(hasPermission('admin', 'settings:write')).toBe(true)
    expect(hasPermission('admin', 'users:manage')).toBe(true)
    expect(hasPermission('admin', 'orders:read')).toBe(true)
  })

  it('null یا undefined هیچ مجوزی ندارد', () => {
    expect(hasPermission(null, 'orders:read')).toBe(false)
    expect(hasPermission(undefined, 'orders:read')).toBe(false)
  })
})

describe('hasAnyPermission / hasAllPermissions', () => {
  it('any: یکی کافیست', () => {
    expect(hasAnyPermission('viewer', ['orders:write', 'orders:read'])).toBe(true)
    expect(hasAnyPermission('viewer', ['orders:write', 'finance:write'])).toBe(false)
  })

  it('all: همه لازم است', () => {
    expect(hasAllPermissions('admin', ['finance:read', 'finance:write'])).toBe(true)
    expect(hasAllPermissions('operator', ['orders:write', 'finance:write'])).toBe(false)
  })
})

describe('parseAdminRole', () => {
  it('مقدار معتبر را می‌پذیرد', () => {
    expect(parseAdminRole('viewer')).toBe('viewer')
    expect(parseAdminRole('operator')).toBe('operator')
    expect(parseAdminRole('admin')).toBe('admin')
  })

  it('حروف بزرگ و فاصله را نرمال می‌کند', () => {
    expect(parseAdminRole('  VIEWER ')).toBe('viewer')
    expect(parseAdminRole('OPERATOR')).toBe('operator')
  })

  it('مقدار نامعتبر یا خالی → پیش‌فرض admin (بازگشت‌پذیری)', () => {
    expect(parseAdminRole(undefined)).toBe('admin')
    expect(parseAdminRole('')).toBe('admin')
    expect(parseAdminRole('superuser')).toBe('admin')
    expect(parseAdminRole('root')).toBe('admin')
  })
})

describe('isAdminRole', () => {
  it('فقط سه مقدار قانونی', () => {
    expect(isAdminRole('viewer')).toBe(true)
    expect(isAdminRole('operator')).toBe(true)
    expect(isAdminRole('admin')).toBe(true)
    expect(isAdminRole('user')).toBe(false)
    expect(isAdminRole('root')).toBe(false)
    expect(isAdminRole(null)).toBe(false)
    expect(isAdminRole(123)).toBe(false)
  })
})

describe('roleLabel', () => {
  it('برچسب فارسی هر سه نقش', () => {
    expect(roleLabel('viewer')).toContain('ناظر')
    expect(roleLabel('operator')).toContain('اپراتور')
    expect(roleLabel('admin')).toContain('مدیر')
  })
})
