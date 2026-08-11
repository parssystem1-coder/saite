import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../utils/render'
import { useAdminSessionStore } from '@/store/admin-session-store'

let mockPathname = '/admin'

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('@/lib/auth/admin-login-client', () => ({
  requestAdminLogout: vi.fn().mockResolvedValue(undefined),
}))

import { AdminOperaShell } from '@/components/admin/admin-opera-shell'

function setAdminRole(role: 'admin' | 'operator' | 'viewer' | null) {
  if (!role) {
    useAdminSessionStore.setState({
      admin: null,
      status: 'anonymous',
      isAdminAuthenticated: false,
    })
    return
  }
  useAdminSessionStore.setState({
    admin: {
      id: 'test-id',
      email: 'admin@test.local',
      name: 'تست ادمین',
      role,
    } as unknown as never,
    status: 'authenticated',
    isAdminAuthenticated: true,
  })
}

function getRailButton(name: string) {
  // rail buttons are the only buttons with that aria-label and data-group-id
  return screen.getByRole('button', { name })
}

describe('AdminOperaShell', () => {
  beforeEach(() => {
    mockPathname = '/admin'
    setAdminRole('admin')
    localStorage.clear()
  })

  it('منو براساس نقش فیلتر می‌شود - viewer گروه settings را نمی‌بیند', async () => {
    setAdminRole('viewer')
    mockPathname = '/admin'
    render(
      <AdminOperaShell>
        <div>content</div>
      </AdminOperaShell>
    )
    expect(getRailButton('داشبورد')).toBeInTheDocument()
    const financeBtn = getRailButton('مالی')
    fireEvent.click(financeBtn)
    expect(await screen.findByText('صورت‌حساب‌ها')).toBeInTheDocument()
    expect(screen.queryByText('فاکتور رسمی')).not.toBeInTheDocument()
  })

  it('active route و active group را درست نشان می‌دهد', async () => {
    mockPathname = '/admin/orders'
    render(
      <AdminOperaShell>
        <div>content</div>
      </AdminOperaShell>
    )
    const storeBtn = getRailButton('فروشگاه')
    expect(storeBtn).toHaveAttribute('aria-expanded', 'true')
    const ordersLink = screen.getByRole('link', { name: 'سفارش‌ها' })
    expect(ordersLink).toHaveAttribute('aria-current', 'page')
  })

  it('باز و بسته شدن Flyout با کلیک کار می‌کند', async () => {
    mockPathname = '/admin'
    render(
      <AdminOperaShell>
        <div>content</div>
      </AdminOperaShell>
    )
    const flyout = screen.getByLabelText('منوی کناری')
    expect(flyout).toHaveAttribute('aria-hidden', 'false')

    const dashboardBtn = getRailButton('داشبورد')
    fireEvent.click(dashboardBtn)
    await waitFor(() => {
      expect(flyout).toHaveAttribute('aria-hidden', 'true')
    })

    fireEvent.click(dashboardBtn)
    await waitFor(() => {
      expect(flyout).toHaveAttribute('aria-hidden', 'false')
    })
  })

  it('بستن با Escape کار می‌کند', async () => {
    mockPathname = '/admin/products'
    render(
      <AdminOperaShell>
        <div>content</div>
      </AdminOperaShell>
    )
    const flyout = screen.getByLabelText('منوی کناری')
    expect(flyout).toHaveAttribute('aria-hidden', 'false')

    // fire on document and window for robustness
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' })
    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' })
    await waitFor(() => {
      expect(flyout).toHaveAttribute('aria-hidden', 'true')
    })
  })

  it('منوی موبایل دارای backdrop و دکمه بستن است', async () => {
    mockPathname = '/admin'
    render(
      <AdminOperaShell>
        <div>content</div>
      </AdminOperaShell>
    )
    const openBtns = screen.getAllByLabelText('باز کردن منو')
    fireEvent.click(openBtns[0])

    const flyout = screen.getByLabelText('منوی کناری')
    await waitFor(() => {
      expect(flyout).toHaveAttribute('aria-hidden', 'false')
    })

    const closeBtn = screen.getByLabelText('بستن منو')
    expect(closeBtn).toBeInTheDocument()
    fireEvent.click(closeBtn)
    await waitFor(() => {
      expect(flyout).toHaveAttribute('aria-hidden', 'true')
    })
  })

  it('لینک dashboard به /admin می‌رود', async () => {
    mockPathname = '/admin/products'
    render(
      <AdminOperaShell>
        <div>content</div>
      </AdminOperaShell>
    )
    const dashboardRail = getRailButton('داشبورد')
    fireEvent.click(dashboardRail)
    const dashLink = await screen.findByRole('link', { name: 'داشبورد' })
    expect(dashLink).toHaveAttribute('href', '/admin')
  })

  it('خروج از پنل وجود دارد و نقش نمایش داده می‌شود', async () => {
    mockPathname = '/admin'
    setAdminRole('admin')
    render(
      <AdminOperaShell>
        <div>content</div>
      </AdminOperaShell>
    )
    expect(screen.getAllByText(/مدیر کل/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByRole('button', { name: /خروج از پنل/ })).toBeInTheDocument()
    expect(screen.getAllByText(/تست ادمین/).length).toBeGreaterThanOrEqual(1)
  })

  it('مسیر مستقیم /admin بدون خطا رندر می‌شود', () => {
    mockPathname = '/admin'
    render(
      <AdminOperaShell>
        <div>محتوای داشبورد</div>
      </AdminOperaShell>
    )
    expect(screen.getByText('محتوای داشبورد')).toBeInTheDocument()
    expect(screen.getByText(/پنل مدیریت \/ داشبورد/)).toBeInTheDocument()
  })
})
