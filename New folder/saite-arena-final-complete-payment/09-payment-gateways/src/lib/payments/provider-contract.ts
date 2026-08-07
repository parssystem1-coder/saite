import type { PaymentProvider } from '@/types/payment'
export interface CreatePaymentInput { orderId:string; amount:number; currency:'IRR'|'IRT'; callbackUrl:string; idempotencyKey:string }
export interface CreatePaymentResult { authority:string; redirectUrl:string; expiresAt:string }
export interface VerifyPaymentResult { success:boolean; transactionId?:string; providerEventId?:string; message?:string }
export interface RefundPaymentResult { success:boolean; providerRefundId?:string; message?:string }
export interface PaymentGatewayAdapter { createPayment(provider:PaymentProvider,input:CreatePaymentInput):Promise<CreatePaymentResult>; verifyPayment(provider:PaymentProvider,authority:string,amount:number):Promise<VerifyPaymentResult>; refundPayment(provider:PaymentProvider,authority:string,amount:number):Promise<RefundPaymentResult>; healthCheck(provider:PaymentProvider):Promise<'healthy'|'degraded'|'down'> }
