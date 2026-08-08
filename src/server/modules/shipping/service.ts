import 'server-only'
import { shippingRepository } from './repository'
import { eventBus } from '@/server/shared/event-bus'

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
    return shippingRepository.createShippingRate(data)
  },

  async getShippingRates(opts: Parameters<typeof shippingRepository.findShippingRates>[0]) {
    return shippingRepository.findShippingRates(opts)
  },

  async calculateCost(carrier: string, zone: string, weightGrams: number) {
    return shippingRepository.calculateShippingCost(carrier, zone, weightGrams)
  },
}
