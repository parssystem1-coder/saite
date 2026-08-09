import { describe, expect, it } from 'vitest'
import {
  assertValidTransition,
  isTerminalState,
  InvalidStateTransitionError,
  type OrderState,
} from '@/server/modules/orders/state-machine'

describe('Order State Machine', () => {
  const validTransitions: [OrderState, OrderState][] = [
    ['pending', 'paid'],
    ['pending', 'cancelled'],
    ['paid', 'processing'],
    ['paid', 'refunded'],
    ['processing', 'shipped'],
    ['processing', 'cancelled'],
    ['shipped', 'delivered'],
    ['shipped', 'refunded'],
    ['delivered', 'refunded'],
  ]

  for (const [from, to] of validTransitions) {
    it(`گذار مجاز ${from} → ${to}`, () => {
      expect(() => assertValidTransition(from, to)).not.toThrow()
    })
  }

  const invalidTransitions: [OrderState, OrderState][] = [
    ['pending', 'processing'],
    ['pending', 'shipped'],
    ['paid', 'cancelled'],
    ['paid', 'shipped'],
    ['processing', 'paid'],
    ['shipped', 'pending'],
    ['delivered', 'pending'],
    ['delivered', 'cancelled'],
    ['cancelled', 'paid'],
    ['refunded', 'paid'],
    ['paid', 'delivered'],
  ]

  for (const [from, to] of invalidTransitions) {
    it(`گذار نامجاز ${from} → ${to} خطا می‌دهد`, () => {
      expect(() => assertValidTransition(from, to)).toThrow(InvalidStateTransitionError)
      expect(() => assertValidTransition(from, to)).toThrow(`گذار ${from} → ${to} مجاز نیست`)
    })
  }

  it('حالت‌های پایانی را درست تشخیص می‌دهد', () => {
    expect(isTerminalState('delivered')).toBe(true)
    expect(isTerminalState('cancelled')).toBe(true)
    expect(isTerminalState('refunded')).toBe(true)
    expect(isTerminalState('pending')).toBe(false)
    expect(isTerminalState('paid')).toBe(false)
    expect(isTerminalState('processing')).toBe(false)
    expect(isTerminalState('shipped')).toBe(false)
  })

  it('InvalidStateTransitionError نام درست دارد', () => {
    const err = new InvalidStateTransitionError('pending', 'shipped')
    expect(err.name).toBe('InvalidStateTransitionError')
    expect(err.message).toContain('pending')
    expect(err.message).toContain('shipped')
  })
})
