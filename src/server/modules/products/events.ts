export type ProductEvent =
  | { type: 'product.created'; productId: string; actorId: string }
  | { type: 'product.updated'; productId: string; actorId: string }
  | { type: 'product.deleted'; productId: string; actorId: string }
