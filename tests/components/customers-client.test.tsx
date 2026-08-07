import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import CustomersClient from '@/components/admin/customers/customers-client'

describe('CustomersClient', () => {
  it('فهرست مشتریان، KPI و سگمنت‌بندی را نمایش می‌دهد', async () => {
    render(<CustomersClient />)
    expect(screen.getByText('کل مشتریان')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/نام، موبایل/)).toBeInTheDocument()
    expect(screen.getByText('سارا احمدی')).toBeInTheDocument()
  })

  it('جزئیات مشتری و deriveCustomerSegments را باز می‌کند', async () => {
    render(<CustomersClient />)
    const btn = screen.getAllByText('جزئیات')[0]
    btn.click()
    expect(await screen.findByText(/ارزش طول عمر/)).toBeInTheDocument()
    expect(screen.getByText(/آدرس‌ها/)).toBeInTheDocument()
  })
})
