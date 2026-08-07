import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import OrdersClient from '@/components/admin/orders/orders-client'

describe('OrdersClient', () => {
  it('فهرست سفارش‌ها، KPI و اتصال به label/return-policy را نمایش می‌دهد', async () => {
    render(<OrdersClient />)
    expect(screen.getAllByText('نیازمند بسته‌بندی')[0]).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/شماره سفارش/)).toBeInTheDocument()
    expect(screen.getByText('SA-10482')).toBeInTheDocument()
    expect(screen.getAllByText('جزئیات').length).toBeGreaterThan(0)
  })

  it('برچسب پستی و مرجوعی را می‌سازد', async () => {
    render(<OrdersClient />)
    const btn = screen.getAllByText('جزئیات')[0]
    btn.click()
    expect(await screen.findByText(/پیش‌نمایش برچسب/)).toBeInTheDocument()
    expect(screen.getByText(/گیرنده مرسوله/)).toBeInTheDocument()
  })
})
