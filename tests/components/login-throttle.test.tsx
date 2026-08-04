import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useLoginThrottle } from '@/hooks/use-login-throttle'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

const options = { maxAttempts: 3, lockoutSeconds: 10 }

describe('useLoginThrottle', () => {
  it('در ابتدا قفل نیست', () => {
    const { result } = renderHook(() => useLoginThrottle(options))
    expect(result.current.isLocked).toBe(false)
    expect(result.current.remainingAttempts).toBe(3)
  })

  it('هر شکست یک تلاش کم می‌کند', () => {
    const { result } = renderHook(() => useLoginThrottle(options))

    act(() => result.current.registerFailure())
    expect(result.current.remainingAttempts).toBe(2)
    expect(result.current.isLocked).toBe(false)
  })

  it('🔑 پس از رسیدن به سقف، قفل می‌شود', () => {
    const { result } = renderHook(() => useLoginThrottle(options))

    act(() => {
      result.current.registerFailure()
      result.current.registerFailure()
      result.current.registerFailure()
    })

    expect(result.current.isLocked).toBe(true)
    expect(result.current.secondsLeft).toBe(10)
  })

  it('🔑 شمارش معکوس پیش می‌رود و قفل باز می‌شود', () => {
    const { result } = renderHook(() => useLoginThrottle(options))

    act(() => {
      result.current.registerFailure()
      result.current.registerFailure()
      result.current.registerFailure()
    })
    expect(result.current.isLocked).toBe(true)

    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(result.current.secondsLeft).toBe(5)
    expect(result.current.isLocked).toBe(true)

    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(result.current.isLocked).toBe(false)
    // پس از باز شدن، شمارنده هم صفر می‌شود
    expect(result.current.remainingAttempts).toBe(3)
  })

  it('ورود موفق شمارنده را صفر می‌کند', () => {
    const { result } = renderHook(() => useLoginThrottle(options))

    act(() => result.current.registerFailure())
    act(() => result.current.reset())

    expect(result.current.remainingAttempts).toBe(3)
    expect(result.current.isLocked).toBe(false)
  })

  it('هشدار فقط نزدیک سقف نشان داده می‌شود', () => {
    const { result } = renderHook(() => useLoginThrottle({ maxAttempts: 5, lockoutSeconds: 10 }))

    act(() => result.current.registerFailure())
    // ۴ تلاش مانده — هنوز هشدار لازم نیست
    expect(result.current.showWarning).toBe(false)

    act(() => {
      result.current.registerFailure()
      result.current.registerFailure()
    })
    // ۲ تلاش مانده
    expect(result.current.showWarning).toBe(true)
  })

  it('هنگام قفل، هشدار «تلاش باقی‌مانده» نشان داده نمی‌شود', () => {
    const { result } = renderHook(() => useLoginThrottle(options))

    act(() => {
      result.current.registerFailure()
      result.current.registerFailure()
      result.current.registerFailure()
    })

    expect(result.current.isLocked).toBe(true)
    expect(result.current.showWarning).toBe(false)
  })
})
