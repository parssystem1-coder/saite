export type CustomerStatus = 'active' | 'inactive' | 'blocked' | 'pending_followup'
export type CustomerSegment = 'vip' | 'repeat_buyer' | 'business' | 'new' | 'at_risk' | 'no_purchase'
export interface CustomerAddress { id:string; label:string; recipientName:string; phone:string; province:string; city:string; addressLine:string; postalCode:string; isDefault:boolean }
export interface CustomerConsent { marketing:boolean; sms:boolean; email:boolean; whatsapp:boolean; consentedAt?:string; source?:'registration'|'checkout'|'admin' }
export interface CustomerNote { id:string; body:string; visibility:'internal'|'customer_visible'; createdAt:string; createdBy:string }
export interface CustomerProfile { id:string; name:string; email?:string; phone:string; companyName?:string; nationalId?:string; status:CustomerStatus; segments:CustomerSegment[]; createdAt:string; lastLoginAt?:string; lastOrderAt?:string; orderCount:number; lifetimeValue:number; averageOrderValue:number; returnCount:number; loyaltyPoints:number; addresses:CustomerAddress[]; consents:CustomerConsent; notes:CustomerNote[]; tags:string[] }
