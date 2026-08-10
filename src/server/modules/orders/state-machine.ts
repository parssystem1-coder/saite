import { InvalidStateTransitionError } from '@/server/shared/errors'

export type OrderState = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'

const ALLOWED_TRANSITIONS: Record<OrderState, OrderState[]> = {
  pending: ['paid', 'cancelled'],
  paid: ['processing', 'refunded'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'refunded'],
  delivered: ['refunded'],
  refunded: [],
  cancelled: [],
}

export function assertValidTransition(from: OrderState, to: OrderState): void {
  if (!ALLOWED_TRANSITIONS[from]?.includes(to)) {
    throw new InvalidStateTransitionError(from, to)
  }
}

export function isTerminalState(state: OrderState): boolean {
  return state === 'delivered' || state === 'cancelled' || state === 'refunded'
}

// Re-export برای backward compatibility
export { InvalidStateTransitionError }
