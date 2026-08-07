import type { ReturnRequest, ReturnStatus } from '@/types/order-fulfillment'
export const RETURN_TRANSITIONS: Record<ReturnStatus, ReturnStatus[]> = { requested:['under_review','rejected'], under_review:['approved','rejected'], approved:['received'], rejected:['closed'], received:['refunded','closed'], refunded:['closed'], closed:[] }
export function canTransitionReturn(from:ReturnStatus,to:ReturnStatus){ return RETURN_TRANSITIONS[from].includes(to) }
export function calculateRefundAmount(request:ReturnRequest, orderTotal:number){ if(request.refundAmount!==undefined) return Math.max(0,Math.min(request.refundAmount,orderTotal)); return orderTotal }
