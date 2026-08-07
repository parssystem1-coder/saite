import type { ShippingAddress } from '@/types/checkout-order'
export function formatPrintableAddress(address: ShippingAddress): string[] { return [address.receiverName,address.phone,`${address.province}، ${address.city}`,address.address,address.unit ? `پلاک/واحد: ${address.unit}` : '',`کدپستی: ${address.postalCode}`].filter(Boolean) }
