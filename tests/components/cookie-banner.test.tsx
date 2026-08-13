import { describe, expect, it } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { CookieBanner } from '@/components/consent/cookie-banner'
import { ANALYTICS_CONSENT_COOKIE } from '@/lib/consent/analytics-consent'
import { renderWithProviders } from '../utils/render'

describe('CookieBanner', () => {
  it('تا رضایت داده نشده دیده می‌شود و پذیرش کوکی می‌نویسد', () => {
    document.cookie = `${ANALYTICS_CONSENT_COOKIE}=; Max-Age=0; Path=/`
    renderWithProviders(<CookieBanner />)
    expect(screen.getByRole('dialog', { name: /کوکی و آمار بازدید/ })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'پذیرش آمار بازدید' }))
    expect(document.cookie).toContain(`${ANALYTICS_CONSENT_COOKIE}=accepted`)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
