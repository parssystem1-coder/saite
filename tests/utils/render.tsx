import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement } from 'react'

/**
 * wrapper مشترک تست کامپوننت.
 * فعلاً Provider خاصی لازم نیست؛ در فاز بک‌اند QueryClient اضافه می‌شود.
 */
export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, options)
}

export * from '@testing-library/react'
