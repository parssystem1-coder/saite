import 'server-only'
import { shippingRepository } from './repository'
import { eventBus } from '@/server/shared/event-bus'
import { cacheAside, cacheInvalidateByPrefix } from '@/server/shared/cache'

/** TTL برای shipping rates — 5 دقیقه */
const SHIPPING_RATES_TTL = 300

/**
 * ساخت کلید cache از opts
 */
function buildRatesCacheKey(opts: Parameters<typeof shippingRepository.findShippingRates>[0]): string {
  const parts: string[] = []
  if (opts.carrier) parts.push(`carrier:${opts.carrier}`)
  if (opts.zone) parts.push(`zone:${opts.zone}`)
  if (opts.active !== undefined) parts.push(`active:${opts.active}`)
  return parts.join('|') || 'all'
}

export const shippingService = {
  async createShipment(data: Parameters<typeof shippingRepository.createShipment>[0]) {
    const shipment = await shippingRepository.createShipment(data)
    await eventBus.publish('shipment.created', {
      shipmentId: shipment.id,
      orderId: shipment.orderId,
      carrier: shipment.carrier,
    })
    return shipment
  },

  async updateStatus(id: string, status: string, extra?: { shippedAt?: Date; deliveredAt?: Date; trackingNumber?: string }) {
    const shipment = await shippingRepository.updateShipmentStatus(id, status, extra)
    await eventBus.publish('shipment.status_changed', {
      shipmentId: shipment.id,
      orderId: shipment.orderId,
      status: shipment.status,
      trackingNumber: shipment.trackingNumber,
    })
    return shipment
  },

  async markShipped(id: string, trackingNumber?: string) {
    return this.updateStatus(id, 'in_transit', {
      shippedAt: new Date(),
      trackingNumber,
    })
  },

  async markDelivered(id: string) {
    return this.updateStatus(id, 'delivered', {
      deliveredAt: new Date(),
    })
  },

  async getShipment(id: string) {
    return shippingRepository.findShipmentById(id)
  },

  async getShipmentByOrderId(orderId: string) {
    return shippingRepository.findShipmentByOrderId(orderId)
  },

  async listShipments(opts: Parameters<typeof shippingRepository.listShipments>[0]) {
    return shippingRepository.listShipments(opts)
  },

  async createShippingRate(data: Parameters<typeof shippingRepository.createShippingRate>[0]) {
    const rate = await shippingRepository.createShippingRate(data)

    // Invalidate cache shipping rates
    await cacheInvalidateByPrefix('shipping:rates')

    return rate
  },

  async getShippingRates(opts: Parameters<typeof shippingRepository.findShippingRates>[0]) {
    const cacheKey = buildRatesCacheKey(opts)

    return cacheAside(
      cacheKey,
      async () => shippingRepository.findShippingRates(opts),
      { ttl: SHIPPING_RATES_TTL, prefix: 'shipping:rates' }
    )
  },

  async calculateCost(carrier: string, zone: string, weightGrams: number) {
    return shippingRepository.calculateShippingCost(carrier, zone, weightGrams)
  },
}
