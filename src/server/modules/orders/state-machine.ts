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

export class InvalidStateTransitionError extends Error {
  constructor(from: OrderState, to: OrderState) {
    super(`گذار ${from} → ${to} مجاز نیست`)
    this.name = 'InvalidStateTransitionError'
  }
}

export function assertValidTransition(from: OrderState, to: OrderState): void {
  if (!ALLOWED_TRANSITIONS[from]?.includes(to)) {
    throw new InvalidStateTransitionError(from, to)
  }
}

export function isTerminalState(state: OrderState): boolean {
  return state === 'delivered' || state === 'cancelled' || state === 'refunded'
}
