import { z } from 'zod';
import { Prisma } from '@prisma/client';

/////////////////////////////////////////
// HELPER FUNCTIONS
/////////////////////////////////////////

// JSON
//------------------------------------------------------

export type NullableJsonInput = Prisma.JsonValue | null | 'JsonNull' | 'DbNull' | Prisma.NullTypes.DbNull | Prisma.NullTypes.JsonNull;

export const transformJsonNull = (v?: NullableJsonInput) => {
  if (!v || v === 'DbNull') return Prisma.NullTypes.DbNull;
  if (v === 'JsonNull') return Prisma.NullTypes.JsonNull;
  return v;
};

export const JsonValueSchema: z.ZodType<Prisma.JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.literal(null),
    z.record(z.string(), z.lazy(() => JsonValueSchema.optional())),
    z.array(z.lazy(() => JsonValueSchema)),
  ])
);

export type JsonValueType = z.infer<typeof JsonValueSchema>;

export const NullableJsonValue = z
  .union([JsonValueSchema, z.literal('DbNull'), z.literal('JsonNull')])
  .nullable()
  .transform((v) => transformJsonNull(v));

export type NullableJsonValueType = z.infer<typeof NullableJsonValue>;

export const InputJsonValueSchema: z.ZodType<Prisma.InputJsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.object({ toJSON: z.any() }),
    z.record(z.string(), z.lazy(() => z.union([InputJsonValueSchema, z.literal(null)]))),
    z.array(z.lazy(() => z.union([InputJsonValueSchema, z.literal(null)]))),
  ])
);

export type InputJsonValueType = z.infer<typeof InputJsonValueSchema>;


/////////////////////////////////////////
// ENUMS
/////////////////////////////////////////

export const TransactionIsolationLevelSchema = z.enum(['ReadUncommitted','ReadCommitted','RepeatableRead','Serializable']);

export const ProductScalarFieldEnumSchema = z.enum(['id','slug','name','brand','model','sku','category','subCategory','priceType','price','compareAtPrice','stockStatus','images','shortDescription','description','keyFeatures','specs','technology','colorSupport','usageClass','warrantyMonths','condition','compatibleWith','consumables','isFeatured','isBestSeller','createdAt','updatedAt']);

export const OrderScalarFieldEnumSchema = z.enum(['id','customerId','status','totalAmount','currency','shippingAddress','createdAt','updatedAt']);

export const OrderItemScalarFieldEnumSchema = z.enum(['id','orderId','productId','quantity','unitPrice']);

export const PaymentIntentScalarFieldEnumSchema = z.enum(['id','orderId','providerCode','amount','currency','status','idempotencyKey','authority','transactionId','redirectUrl','failureCode','failureMessage','createdAt','expiresAt','verifiedAt']);

export const CustomerScalarFieldEnumSchema = z.enum(['id','email','phone','name','metadata','createdAt','updatedAt']);

export const OutboxEventScalarFieldEnumSchema = z.enum(['id','type','payload','aggregateId','processedAt','retryCount','createdAt']);

export const AiUsageLogScalarFieldEnumSchema = z.enum(['id','feature','promptVersion','provider','model','actorId','inputTokens','outputTokens','estimatedCostRial','durationMs','status','gitSha','createdAt']);

export const FeatureFlagScalarFieldEnumSchema = z.enum(['key','enabled','rolloutPercentage','allowedRoles','updatedAt']);

export const SortOrderSchema = z.enum(['asc','desc']);

export const NullableJsonNullValueInputSchema: z.ZodType<Prisma.NullableJsonNullValueInput> = z.enum(['DbNull','JsonNull',]).transform((value) => value === 'JsonNull' ? Prisma.JsonNull : value === 'DbNull' ? Prisma.DbNull : value);

export const JsonNullValueInputSchema: z.ZodType<Prisma.JsonNullValueInput> = z.enum(['JsonNull',]).transform((value) => (value === 'JsonNull' ? Prisma.JsonNull : value));

export const QueryModeSchema = z.enum(['default','insensitive']);

export const JsonNullValueFilterSchema: z.ZodType<Prisma.JsonNullValueFilter> = z.enum(['DbNull','JsonNull','AnyNull',]).transform((value) => value === 'JsonNull' ? Prisma.JsonNull : value === 'DbNull' ? Prisma.DbNull : value === 'AnyNull' ? Prisma.AnyNull : value);

export const NullsOrderSchema = z.enum(['first','last']);

export const PriceTypeSchema = z.enum(['fixed','quote_only']);

export type PriceTypeType = `${z.infer<typeof PriceTypeSchema>}`

export const StockStatusSchema = z.enum(['in_stock','low_stock','out_of_stock','on_request']);

export type StockStatusType = `${z.infer<typeof StockStatusSchema>}`

export const ProductConditionSchema = z.enum(['new','refurbished']);

export type ProductConditionType = `${z.infer<typeof ProductConditionSchema>}`

export const OrderStatusSchema = z.enum(['pending','paid','processing','shipped','delivered','cancelled','refunded']);

export type OrderStatusType = `${z.infer<typeof OrderStatusSchema>}`

export const PaymentIntentStatusSchema = z.enum(['created','redirect_required','pending','succeeded','failed','cancelled','expired','refunded','partially_refunded','chargeback']);

export type PaymentIntentStatusType = `${z.infer<typeof PaymentIntentStatusSchema>}`

/////////////////////////////////////////
// MODELS
/////////////////////////////////////////

/////////////////////////////////////////
// PRODUCT SCHEMA
/////////////////////////////////////////

export const ProductSchema = z.object({
  priceType: PriceTypeSchema,
  stockStatus: StockStatusSchema,
  condition: ProductConditionSchema,
  id: z.cuid(),
  slug: z.string(),
  name: z.string(),
  brand: z.string(),
  model: z.string(),
  sku: z.string(),
  category: z.string(),
  subCategory: z.string().nullable(),
  price: z.number().int().nullable(),
  compareAtPrice: z.number().int().nullable(),
  images: z.string().array(),
  shortDescription: z.string(),
  description: z.string().nullable(),
  keyFeatures: z.string().array(),
  specs: JsonValueSchema.nullable(),
  technology: z.string().nullable(),
  colorSupport: z.string().nullable(),
  usageClass: z.string().nullable(),
  warrantyMonths: z.number().int().nullable(),
  compatibleWith: z.string().array(),
  consumables: z.string().array(),
  isFeatured: z.boolean(),
  isBestSeller: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Product = z.infer<typeof ProductSchema>

/////////////////////////////////////////
// ORDER SCHEMA
/////////////////////////////////////////

export const OrderSchema = z.object({
  status: OrderStatusSchema,
  id: z.cuid(),
  customerId: z.string(),
  totalAmount: z.number().int(),
  currency: z.string(),
  shippingAddress: JsonValueSchema.nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Order = z.infer<typeof OrderSchema>

/////////////////////////////////////////
// ORDER ITEM SCHEMA
/////////////////////////////////////////

export const OrderItemSchema = z.object({
  id: z.cuid(),
  orderId: z.string(),
  productId: z.string(),
  quantity: z.number().int(),
  unitPrice: z.number().int(),
})

export type OrderItem = z.infer<typeof OrderItemSchema>

/////////////////////////////////////////
// PAYMENT INTENT SCHEMA
/////////////////////////////////////////

export const PaymentIntentSchema = z.object({
  status: PaymentIntentStatusSchema,
  id: z.cuid(),
  orderId: z.string(),
  providerCode: z.string(),
  amount: z.number().int(),
  currency: z.string(),
  idempotencyKey: z.string(),
  authority: z.string().nullable(),
  transactionId: z.string().nullable(),
  redirectUrl: z.string().nullable(),
  failureCode: z.string().nullable(),
  failureMessage: z.string().nullable(),
  createdAt: z.coerce.date(),
  expiresAt: z.coerce.date(),
  verifiedAt: z.coerce.date().nullable(),
})

export type PaymentIntent = z.infer<typeof PaymentIntentSchema>

/////////////////////////////////////////
// CUSTOMER SCHEMA
/////////////////////////////////////////

export const CustomerSchema = z.object({
  id: z.cuid(),
  email: z.string(),
  phone: z.string().nullable(),
  name: z.string(),
  metadata: JsonValueSchema.nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Customer = z.infer<typeof CustomerSchema>

/////////////////////////////////////////
// OUTBOX EVENT SCHEMA
/////////////////////////////////////////

export const OutboxEventSchema = z.object({
  id: z.cuid(),
  type: z.string(),
  payload: JsonValueSchema,
  aggregateId: z.string(),
  processedAt: z.coerce.date().nullable(),
  retryCount: z.number().int(),
  createdAt: z.coerce.date(),
})

export type OutboxEvent = z.infer<typeof OutboxEventSchema>

/////////////////////////////////////////
// AI USAGE LOG SCHEMA
/////////////////////////////////////////

export const AiUsageLogSchema = z.object({
  id: z.cuid(),
  feature: z.string(),
  promptVersion: z.string(),
  provider: z.string(),
  model: z.string(),
  actorId: z.string(),
  inputTokens: z.number().int(),
  outputTokens: z.number().int(),
  estimatedCostRial: z.number().int().nullable(),
  durationMs: z.number().int(),
  status: z.string(),
  gitSha: z.string().nullable(),
  createdAt: z.coerce.date(),
})

export type AiUsageLog = z.infer<typeof AiUsageLogSchema>

/////////////////////////////////////////
// FEATURE FLAG SCHEMA
/////////////////////////////////////////

export const FeatureFlagSchema = z.object({
  key: z.string(),
  enabled: z.boolean(),
  rolloutPercentage: z.number().int(),
  allowedRoles: z.string().array(),
  updatedAt: z.coerce.date(),
})

export type FeatureFlag = z.infer<typeof FeatureFlagSchema>

/////////////////////////////////////////
// SELECT & INCLUDE
/////////////////////////////////////////

// PRODUCT
//------------------------------------------------------

export const ProductIncludeSchema: z.ZodType<Prisma.ProductInclude> = z.object({
  orderItems: z.union([z.boolean(),z.lazy(() => OrderItemFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => ProductCountOutputTypeArgsSchema)]).optional(),
}).strict();

export const ProductArgsSchema: z.ZodType<Prisma.ProductDefaultArgs> = z.object({
  select: z.lazy(() => ProductSelectSchema).optional(),
  include: z.lazy(() => ProductIncludeSchema).optional(),
}).strict();

export const ProductCountOutputTypeArgsSchema: z.ZodType<Prisma.ProductCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => ProductCountOutputTypeSelectSchema).nullish(),
}).strict();

export const ProductCountOutputTypeSelectSchema: z.ZodType<Prisma.ProductCountOutputTypeSelect> = z.object({
  orderItems: z.boolean().optional(),
}).strict();

export const ProductSelectSchema: z.ZodType<Prisma.ProductSelect> = z.object({
  id: z.boolean().optional(),
  slug: z.boolean().optional(),
  name: z.boolean().optional(),
  brand: z.boolean().optional(),
  model: z.boolean().optional(),
  sku: z.boolean().optional(),
  category: z.boolean().optional(),
  subCategory: z.boolean().optional(),
  priceType: z.boolean().optional(),
  price: z.boolean().optional(),
  compareAtPrice: z.boolean().optional(),
  stockStatus: z.boolean().optional(),
  images: z.boolean().optional(),
  shortDescription: z.boolean().optional(),
  description: z.boolean().optional(),
  keyFeatures: z.boolean().optional(),
  specs: z.boolean().optional(),
  technology: z.boolean().optional(),
  colorSupport: z.boolean().optional(),
  usageClass: z.boolean().optional(),
  warrantyMonths: z.boolean().optional(),
  condition: z.boolean().optional(),
  compatibleWith: z.boolean().optional(),
  consumables: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  orderItems: z.union([z.boolean(),z.lazy(() => OrderItemFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => ProductCountOutputTypeArgsSchema)]).optional(),
}).strict()

// ORDER
//------------------------------------------------------

export const OrderIncludeSchema: z.ZodType<Prisma.OrderInclude> = z.object({
  items: z.union([z.boolean(),z.lazy(() => OrderItemFindManyArgsSchema)]).optional(),
  paymentIntents: z.union([z.boolean(),z.lazy(() => PaymentIntentFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => OrderCountOutputTypeArgsSchema)]).optional(),
}).strict();

export const OrderArgsSchema: z.ZodType<Prisma.OrderDefaultArgs> = z.object({
  select: z.lazy(() => OrderSelectSchema).optional(),
  include: z.lazy(() => OrderIncludeSchema).optional(),
}).strict();

export const OrderCountOutputTypeArgsSchema: z.ZodType<Prisma.OrderCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => OrderCountOutputTypeSelectSchema).nullish(),
}).strict();

export const OrderCountOutputTypeSelectSchema: z.ZodType<Prisma.OrderCountOutputTypeSelect> = z.object({
  items: z.boolean().optional(),
  paymentIntents: z.boolean().optional(),
}).strict();

export const OrderSelectSchema: z.ZodType<Prisma.OrderSelect> = z.object({
  id: z.boolean().optional(),
  customerId: z.boolean().optional(),
  status: z.boolean().optional(),
  totalAmount: z.boolean().optional(),
  currency: z.boolean().optional(),
  shippingAddress: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  items: z.union([z.boolean(),z.lazy(() => OrderItemFindManyArgsSchema)]).optional(),
  paymentIntents: z.union([z.boolean(),z.lazy(() => PaymentIntentFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => OrderCountOutputTypeArgsSchema)]).optional(),
}).strict()

// ORDER ITEM
//------------------------------------------------------

export const OrderItemIncludeSchema: z.ZodType<Prisma.OrderItemInclude> = z.object({
  order: z.union([z.boolean(),z.lazy(() => OrderArgsSchema)]).optional(),
  product: z.union([z.boolean(),z.lazy(() => ProductArgsSchema)]).optional(),
}).strict();

export const OrderItemArgsSchema: z.ZodType<Prisma.OrderItemDefaultArgs> = z.object({
  select: z.lazy(() => OrderItemSelectSchema).optional(),
  include: z.lazy(() => OrderItemIncludeSchema).optional(),
}).strict();

export const OrderItemSelectSchema: z.ZodType<Prisma.OrderItemSelect> = z.object({
  id: z.boolean().optional(),
  orderId: z.boolean().optional(),
  productId: z.boolean().optional(),
  quantity: z.boolean().optional(),
  unitPrice: z.boolean().optional(),
  order: z.union([z.boolean(),z.lazy(() => OrderArgsSchema)]).optional(),
  product: z.union([z.boolean(),z.lazy(() => ProductArgsSchema)]).optional(),
}).strict()

// PAYMENT INTENT
//------------------------------------------------------

export const PaymentIntentIncludeSchema: z.ZodType<Prisma.PaymentIntentInclude> = z.object({
  order: z.union([z.boolean(),z.lazy(() => OrderArgsSchema)]).optional(),
}).strict();

export const PaymentIntentArgsSchema: z.ZodType<Prisma.PaymentIntentDefaultArgs> = z.object({
  select: z.lazy(() => PaymentIntentSelectSchema).optional(),
  include: z.lazy(() => PaymentIntentIncludeSchema).optional(),
}).strict();

export const PaymentIntentSelectSchema: z.ZodType<Prisma.PaymentIntentSelect> = z.object({
  id: z.boolean().optional(),
  orderId: z.boolean().optional(),
  providerCode: z.boolean().optional(),
  amount: z.boolean().optional(),
  currency: z.boolean().optional(),
  status: z.boolean().optional(),
  idempotencyKey: z.boolean().optional(),
  authority: z.boolean().optional(),
  transactionId: z.boolean().optional(),
  redirectUrl: z.boolean().optional(),
  failureCode: z.boolean().optional(),
  failureMessage: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  expiresAt: z.boolean().optional(),
  verifiedAt: z.boolean().optional(),
  order: z.union([z.boolean(),z.lazy(() => OrderArgsSchema)]).optional(),
}).strict()

// CUSTOMER
//------------------------------------------------------

export const CustomerSelectSchema: z.ZodType<Prisma.CustomerSelect> = z.object({
  id: z.boolean().optional(),
  email: z.boolean().optional(),
  phone: z.boolean().optional(),
  name: z.boolean().optional(),
  metadata: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
}).strict()

// OUTBOX EVENT
//------------------------------------------------------

export const OutboxEventSelectSchema: z.ZodType<Prisma.OutboxEventSelect> = z.object({
  id: z.boolean().optional(),
  type: z.boolean().optional(),
  payload: z.boolean().optional(),
  aggregateId: z.boolean().optional(),
  processedAt: z.boolean().optional(),
  retryCount: z.boolean().optional(),
  createdAt: z.boolean().optional(),
}).strict()

// AI USAGE LOG
//------------------------------------------------------

export const AiUsageLogSelectSchema: z.ZodType<Prisma.AiUsageLogSelect> = z.object({
  id: z.boolean().optional(),
  feature: z.boolean().optional(),
  promptVersion: z.boolean().optional(),
  provider: z.boolean().optional(),
  model: z.boolean().optional(),
  actorId: z.boolean().optional(),
  inputTokens: z.boolean().optional(),
  outputTokens: z.boolean().optional(),
  estimatedCostRial: z.boolean().optional(),
  durationMs: z.boolean().optional(),
  status: z.boolean().optional(),
  gitSha: z.boolean().optional(),
  createdAt: z.boolean().optional(),
}).strict()

// FEATURE FLAG
//------------------------------------------------------

export const FeatureFlagSelectSchema: z.ZodType<Prisma.FeatureFlagSelect> = z.object({
  key: z.boolean().optional(),
  enabled: z.boolean().optional(),
  rolloutPercentage: z.boolean().optional(),
  allowedRoles: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
}).strict()


/////////////////////////////////////////
// INPUT TYPES
/////////////////////////////////////////

export const ProductWhereInputSchema: z.ZodType<Prisma.ProductWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => ProductWhereInputSchema), z.lazy(() => ProductWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => ProductWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ProductWhereInputSchema), z.lazy(() => ProductWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  slug: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  brand: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  model: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  sku: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  category: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  subCategory: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  priceType: z.union([ z.lazy(() => EnumPriceTypeFilterSchema), z.lazy(() => PriceTypeSchema) ]).optional(),
  price: z.union([ z.lazy(() => IntNullableFilterSchema), z.number() ]).optional().nullable(),
  compareAtPrice: z.union([ z.lazy(() => IntNullableFilterSchema), z.number() ]).optional().nullable(),
  stockStatus: z.union([ z.lazy(() => EnumStockStatusFilterSchema), z.lazy(() => StockStatusSchema) ]).optional(),
  images: z.lazy(() => StringNullableListFilterSchema).optional(),
  shortDescription: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  description: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  keyFeatures: z.lazy(() => StringNullableListFilterSchema).optional(),
  specs: z.lazy(() => JsonNullableFilterSchema).optional(),
  technology: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  colorSupport: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  usageClass: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  warrantyMonths: z.union([ z.lazy(() => IntNullableFilterSchema), z.number() ]).optional().nullable(),
  condition: z.union([ z.lazy(() => EnumProductConditionFilterSchema), z.lazy(() => ProductConditionSchema) ]).optional(),
  compatibleWith: z.lazy(() => StringNullableListFilterSchema).optional(),
  consumables: z.lazy(() => StringNullableListFilterSchema).optional(),
  isFeatured: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  isBestSeller: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  orderItems: z.lazy(() => OrderItemListRelationFilterSchema).optional(),
});

export const ProductOrderByWithRelationInputSchema: z.ZodType<Prisma.ProductOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  slug: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  brand: z.lazy(() => SortOrderSchema).optional(),
  model: z.lazy(() => SortOrderSchema).optional(),
  sku: z.lazy(() => SortOrderSchema).optional(),
  category: z.lazy(() => SortOrderSchema).optional(),
  subCategory: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  priceType: z.lazy(() => SortOrderSchema).optional(),
  price: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  compareAtPrice: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  stockStatus: z.lazy(() => SortOrderSchema).optional(),
  images: z.lazy(() => SortOrderSchema).optional(),
  shortDescription: z.lazy(() => SortOrderSchema).optional(),
  description: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  keyFeatures: z.lazy(() => SortOrderSchema).optional(),
  specs: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  technology: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  colorSupport: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  usageClass: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  warrantyMonths: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  condition: z.lazy(() => SortOrderSchema).optional(),
  compatibleWith: z.lazy(() => SortOrderSchema).optional(),
  consumables: z.lazy(() => SortOrderSchema).optional(),
  isFeatured: z.lazy(() => SortOrderSchema).optional(),
  isBestSeller: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  orderItems: z.lazy(() => OrderItemOrderByRelationAggregateInputSchema).optional(),
});

export const ProductWhereUniqueInputSchema: z.ZodType<Prisma.ProductWhereUniqueInput> = z.union([
  z.object({
    id: z.cuid(),
    slug: z.string(),
    sku: z.string(),
  }),
  z.object({
    id: z.cuid(),
    slug: z.string(),
  }),
  z.object({
    id: z.cuid(),
    sku: z.string(),
  }),
  z.object({
    id: z.cuid(),
  }),
  z.object({
    slug: z.string(),
    sku: z.string(),
  }),
  z.object({
    slug: z.string(),
  }),
  z.object({
    sku: z.string(),
  }),
])
.and(z.strictObject({
  id: z.cuid().optional(),
  slug: z.string().optional(),
  sku: z.string().optional(),
  AND: z.union([ z.lazy(() => ProductWhereInputSchema), z.lazy(() => ProductWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => ProductWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ProductWhereInputSchema), z.lazy(() => ProductWhereInputSchema).array() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  brand: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  model: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  category: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  subCategory: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  priceType: z.union([ z.lazy(() => EnumPriceTypeFilterSchema), z.lazy(() => PriceTypeSchema) ]).optional(),
  price: z.union([ z.lazy(() => IntNullableFilterSchema), z.number().int() ]).optional().nullable(),
  compareAtPrice: z.union([ z.lazy(() => IntNullableFilterSchema), z.number().int() ]).optional().nullable(),
  stockStatus: z.union([ z.lazy(() => EnumStockStatusFilterSchema), z.lazy(() => StockStatusSchema) ]).optional(),
  images: z.lazy(() => StringNullableListFilterSchema).optional(),
  shortDescription: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  description: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  keyFeatures: z.lazy(() => StringNullableListFilterSchema).optional(),
  specs: z.lazy(() => JsonNullableFilterSchema).optional(),
  technology: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  colorSupport: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  usageClass: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  warrantyMonths: z.union([ z.lazy(() => IntNullableFilterSchema), z.number().int() ]).optional().nullable(),
  condition: z.union([ z.lazy(() => EnumProductConditionFilterSchema), z.lazy(() => ProductConditionSchema) ]).optional(),
  compatibleWith: z.lazy(() => StringNullableListFilterSchema).optional(),
  consumables: z.lazy(() => StringNullableListFilterSchema).optional(),
  isFeatured: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  isBestSeller: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  orderItems: z.lazy(() => OrderItemListRelationFilterSchema).optional(),
}));

export const ProductOrderByWithAggregationInputSchema: z.ZodType<Prisma.ProductOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  slug: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  brand: z.lazy(() => SortOrderSchema).optional(),
  model: z.lazy(() => SortOrderSchema).optional(),
  sku: z.lazy(() => SortOrderSchema).optional(),
  category: z.lazy(() => SortOrderSchema).optional(),
  subCategory: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  priceType: z.lazy(() => SortOrderSchema).optional(),
  price: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  compareAtPrice: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  stockStatus: z.lazy(() => SortOrderSchema).optional(),
  images: z.lazy(() => SortOrderSchema).optional(),
  shortDescription: z.lazy(() => SortOrderSchema).optional(),
  description: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  keyFeatures: z.lazy(() => SortOrderSchema).optional(),
  specs: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  technology: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  colorSupport: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  usageClass: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  warrantyMonths: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  condition: z.lazy(() => SortOrderSchema).optional(),
  compatibleWith: z.lazy(() => SortOrderSchema).optional(),
  consumables: z.lazy(() => SortOrderSchema).optional(),
  isFeatured: z.lazy(() => SortOrderSchema).optional(),
  isBestSeller: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => ProductCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => ProductAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => ProductMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => ProductMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => ProductSumOrderByAggregateInputSchema).optional(),
});

export const ProductScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.ProductScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => ProductScalarWhereWithAggregatesInputSchema), z.lazy(() => ProductScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => ProductScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ProductScalarWhereWithAggregatesInputSchema), z.lazy(() => ProductScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  slug: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  brand: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  model: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  sku: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  category: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  subCategory: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  priceType: z.union([ z.lazy(() => EnumPriceTypeWithAggregatesFilterSchema), z.lazy(() => PriceTypeSchema) ]).optional(),
  price: z.union([ z.lazy(() => IntNullableWithAggregatesFilterSchema), z.number() ]).optional().nullable(),
  compareAtPrice: z.union([ z.lazy(() => IntNullableWithAggregatesFilterSchema), z.number() ]).optional().nullable(),
  stockStatus: z.union([ z.lazy(() => EnumStockStatusWithAggregatesFilterSchema), z.lazy(() => StockStatusSchema) ]).optional(),
  images: z.lazy(() => StringNullableListFilterSchema).optional(),
  shortDescription: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  description: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  keyFeatures: z.lazy(() => StringNullableListFilterSchema).optional(),
  specs: z.lazy(() => JsonNullableWithAggregatesFilterSchema).optional(),
  technology: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  colorSupport: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  usageClass: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  warrantyMonths: z.union([ z.lazy(() => IntNullableWithAggregatesFilterSchema), z.number() ]).optional().nullable(),
  condition: z.union([ z.lazy(() => EnumProductConditionWithAggregatesFilterSchema), z.lazy(() => ProductConditionSchema) ]).optional(),
  compatibleWith: z.lazy(() => StringNullableListFilterSchema).optional(),
  consumables: z.lazy(() => StringNullableListFilterSchema).optional(),
  isFeatured: z.union([ z.lazy(() => BoolWithAggregatesFilterSchema), z.boolean() ]).optional(),
  isBestSeller: z.union([ z.lazy(() => BoolWithAggregatesFilterSchema), z.boolean() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
});

export const OrderWhereInputSchema: z.ZodType<Prisma.OrderWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => OrderWhereInputSchema), z.lazy(() => OrderWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => OrderWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => OrderWhereInputSchema), z.lazy(() => OrderWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  customerId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  status: z.union([ z.lazy(() => EnumOrderStatusFilterSchema), z.lazy(() => OrderStatusSchema) ]).optional(),
  totalAmount: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  currency: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  shippingAddress: z.lazy(() => JsonNullableFilterSchema).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  items: z.lazy(() => OrderItemListRelationFilterSchema).optional(),
  paymentIntents: z.lazy(() => PaymentIntentListRelationFilterSchema).optional(),
});

export const OrderOrderByWithRelationInputSchema: z.ZodType<Prisma.OrderOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  customerId: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  totalAmount: z.lazy(() => SortOrderSchema).optional(),
  currency: z.lazy(() => SortOrderSchema).optional(),
  shippingAddress: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  items: z.lazy(() => OrderItemOrderByRelationAggregateInputSchema).optional(),
  paymentIntents: z.lazy(() => PaymentIntentOrderByRelationAggregateInputSchema).optional(),
});

export const OrderWhereUniqueInputSchema: z.ZodType<Prisma.OrderWhereUniqueInput> = z.object({
  id: z.cuid(),
})
.and(z.strictObject({
  id: z.cuid().optional(),
  AND: z.union([ z.lazy(() => OrderWhereInputSchema), z.lazy(() => OrderWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => OrderWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => OrderWhereInputSchema), z.lazy(() => OrderWhereInputSchema).array() ]).optional(),
  customerId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  status: z.union([ z.lazy(() => EnumOrderStatusFilterSchema), z.lazy(() => OrderStatusSchema) ]).optional(),
  totalAmount: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  currency: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  shippingAddress: z.lazy(() => JsonNullableFilterSchema).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  items: z.lazy(() => OrderItemListRelationFilterSchema).optional(),
  paymentIntents: z.lazy(() => PaymentIntentListRelationFilterSchema).optional(),
}));

export const OrderOrderByWithAggregationInputSchema: z.ZodType<Prisma.OrderOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  customerId: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  totalAmount: z.lazy(() => SortOrderSchema).optional(),
  currency: z.lazy(() => SortOrderSchema).optional(),
  shippingAddress: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => OrderCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => OrderAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => OrderMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => OrderMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => OrderSumOrderByAggregateInputSchema).optional(),
});

export const OrderScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.OrderScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => OrderScalarWhereWithAggregatesInputSchema), z.lazy(() => OrderScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => OrderScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => OrderScalarWhereWithAggregatesInputSchema), z.lazy(() => OrderScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  customerId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  status: z.union([ z.lazy(() => EnumOrderStatusWithAggregatesFilterSchema), z.lazy(() => OrderStatusSchema) ]).optional(),
  totalAmount: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  currency: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  shippingAddress: z.lazy(() => JsonNullableWithAggregatesFilterSchema).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
});

export const OrderItemWhereInputSchema: z.ZodType<Prisma.OrderItemWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => OrderItemWhereInputSchema), z.lazy(() => OrderItemWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => OrderItemWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => OrderItemWhereInputSchema), z.lazy(() => OrderItemWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  orderId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  productId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  quantity: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  unitPrice: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  order: z.union([ z.lazy(() => OrderScalarRelationFilterSchema), z.lazy(() => OrderWhereInputSchema) ]).optional(),
  product: z.union([ z.lazy(() => ProductScalarRelationFilterSchema), z.lazy(() => ProductWhereInputSchema) ]).optional(),
});

export const OrderItemOrderByWithRelationInputSchema: z.ZodType<Prisma.OrderItemOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  orderId: z.lazy(() => SortOrderSchema).optional(),
  productId: z.lazy(() => SortOrderSchema).optional(),
  quantity: z.lazy(() => SortOrderSchema).optional(),
  unitPrice: z.lazy(() => SortOrderSchema).optional(),
  order: z.lazy(() => OrderOrderByWithRelationInputSchema).optional(),
  product: z.lazy(() => ProductOrderByWithRelationInputSchema).optional(),
});

export const OrderItemWhereUniqueInputSchema: z.ZodType<Prisma.OrderItemWhereUniqueInput> = z.object({
  id: z.cuid(),
})
.and(z.strictObject({
  id: z.cuid().optional(),
  AND: z.union([ z.lazy(() => OrderItemWhereInputSchema), z.lazy(() => OrderItemWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => OrderItemWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => OrderItemWhereInputSchema), z.lazy(() => OrderItemWhereInputSchema).array() ]).optional(),
  orderId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  productId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  quantity: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  unitPrice: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  order: z.union([ z.lazy(() => OrderScalarRelationFilterSchema), z.lazy(() => OrderWhereInputSchema) ]).optional(),
  product: z.union([ z.lazy(() => ProductScalarRelationFilterSchema), z.lazy(() => ProductWhereInputSchema) ]).optional(),
}));

export const OrderItemOrderByWithAggregationInputSchema: z.ZodType<Prisma.OrderItemOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  orderId: z.lazy(() => SortOrderSchema).optional(),
  productId: z.lazy(() => SortOrderSchema).optional(),
  quantity: z.lazy(() => SortOrderSchema).optional(),
  unitPrice: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => OrderItemCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => OrderItemAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => OrderItemMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => OrderItemMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => OrderItemSumOrderByAggregateInputSchema).optional(),
});

export const OrderItemScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.OrderItemScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => OrderItemScalarWhereWithAggregatesInputSchema), z.lazy(() => OrderItemScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => OrderItemScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => OrderItemScalarWhereWithAggregatesInputSchema), z.lazy(() => OrderItemScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  orderId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  productId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  quantity: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  unitPrice: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
});

export const PaymentIntentWhereInputSchema: z.ZodType<Prisma.PaymentIntentWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => PaymentIntentWhereInputSchema), z.lazy(() => PaymentIntentWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => PaymentIntentWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PaymentIntentWhereInputSchema), z.lazy(() => PaymentIntentWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  orderId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  providerCode: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  amount: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  currency: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  status: z.union([ z.lazy(() => EnumPaymentIntentStatusFilterSchema), z.lazy(() => PaymentIntentStatusSchema) ]).optional(),
  idempotencyKey: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  authority: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  transactionId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  redirectUrl: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  failureCode: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  failureMessage: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  expiresAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  verifiedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  order: z.union([ z.lazy(() => OrderScalarRelationFilterSchema), z.lazy(() => OrderWhereInputSchema) ]).optional(),
});

export const PaymentIntentOrderByWithRelationInputSchema: z.ZodType<Prisma.PaymentIntentOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  orderId: z.lazy(() => SortOrderSchema).optional(),
  providerCode: z.lazy(() => SortOrderSchema).optional(),
  amount: z.lazy(() => SortOrderSchema).optional(),
  currency: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  idempotencyKey: z.lazy(() => SortOrderSchema).optional(),
  authority: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  transactionId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  redirectUrl: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  failureCode: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  failureMessage: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  verifiedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  order: z.lazy(() => OrderOrderByWithRelationInputSchema).optional(),
});

export const PaymentIntentWhereUniqueInputSchema: z.ZodType<Prisma.PaymentIntentWhereUniqueInput> = z.union([
  z.object({
    id: z.cuid(),
    idempotencyKey: z.string(),
    authority: z.string(),
  }),
  z.object({
    id: z.cuid(),
    idempotencyKey: z.string(),
  }),
  z.object({
    id: z.cuid(),
    authority: z.string(),
  }),
  z.object({
    id: z.cuid(),
  }),
  z.object({
    idempotencyKey: z.string(),
    authority: z.string(),
  }),
  z.object({
    idempotencyKey: z.string(),
  }),
  z.object({
    authority: z.string(),
  }),
])
.and(z.strictObject({
  id: z.cuid().optional(),
  idempotencyKey: z.string().optional(),
  authority: z.string().optional(),
  AND: z.union([ z.lazy(() => PaymentIntentWhereInputSchema), z.lazy(() => PaymentIntentWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => PaymentIntentWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PaymentIntentWhereInputSchema), z.lazy(() => PaymentIntentWhereInputSchema).array() ]).optional(),
  orderId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  providerCode: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  amount: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  currency: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  status: z.union([ z.lazy(() => EnumPaymentIntentStatusFilterSchema), z.lazy(() => PaymentIntentStatusSchema) ]).optional(),
  transactionId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  redirectUrl: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  failureCode: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  failureMessage: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  expiresAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  verifiedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  order: z.union([ z.lazy(() => OrderScalarRelationFilterSchema), z.lazy(() => OrderWhereInputSchema) ]).optional(),
}));

export const PaymentIntentOrderByWithAggregationInputSchema: z.ZodType<Prisma.PaymentIntentOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  orderId: z.lazy(() => SortOrderSchema).optional(),
  providerCode: z.lazy(() => SortOrderSchema).optional(),
  amount: z.lazy(() => SortOrderSchema).optional(),
  currency: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  idempotencyKey: z.lazy(() => SortOrderSchema).optional(),
  authority: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  transactionId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  redirectUrl: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  failureCode: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  failureMessage: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  verifiedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  _count: z.lazy(() => PaymentIntentCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => PaymentIntentAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => PaymentIntentMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => PaymentIntentMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => PaymentIntentSumOrderByAggregateInputSchema).optional(),
});

export const PaymentIntentScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.PaymentIntentScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => PaymentIntentScalarWhereWithAggregatesInputSchema), z.lazy(() => PaymentIntentScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => PaymentIntentScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PaymentIntentScalarWhereWithAggregatesInputSchema), z.lazy(() => PaymentIntentScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  orderId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  providerCode: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  amount: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  currency: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  status: z.union([ z.lazy(() => EnumPaymentIntentStatusWithAggregatesFilterSchema), z.lazy(() => PaymentIntentStatusSchema) ]).optional(),
  idempotencyKey: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  authority: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  transactionId: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  redirectUrl: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  failureCode: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  failureMessage: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  expiresAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  verifiedAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
});

export const CustomerWhereInputSchema: z.ZodType<Prisma.CustomerWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => CustomerWhereInputSchema), z.lazy(() => CustomerWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => CustomerWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => CustomerWhereInputSchema), z.lazy(() => CustomerWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  email: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  phone: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  name: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  metadata: z.lazy(() => JsonNullableFilterSchema).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
});

export const CustomerOrderByWithRelationInputSchema: z.ZodType<Prisma.CustomerOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  phone: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  metadata: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const CustomerWhereUniqueInputSchema: z.ZodType<Prisma.CustomerWhereUniqueInput> = z.union([
  z.object({
    id: z.cuid(),
    email: z.string(),
  }),
  z.object({
    id: z.cuid(),
  }),
  z.object({
    email: z.string(),
  }),
])
.and(z.strictObject({
  id: z.cuid().optional(),
  email: z.string().optional(),
  AND: z.union([ z.lazy(() => CustomerWhereInputSchema), z.lazy(() => CustomerWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => CustomerWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => CustomerWhereInputSchema), z.lazy(() => CustomerWhereInputSchema).array() ]).optional(),
  phone: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  name: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  metadata: z.lazy(() => JsonNullableFilterSchema).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
}));

export const CustomerOrderByWithAggregationInputSchema: z.ZodType<Prisma.CustomerOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  phone: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  metadata: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => CustomerCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => CustomerMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => CustomerMinOrderByAggregateInputSchema).optional(),
});

export const CustomerScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.CustomerScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => CustomerScalarWhereWithAggregatesInputSchema), z.lazy(() => CustomerScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => CustomerScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => CustomerScalarWhereWithAggregatesInputSchema), z.lazy(() => CustomerScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  email: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  phone: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  name: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  metadata: z.lazy(() => JsonNullableWithAggregatesFilterSchema).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
});

export const OutboxEventWhereInputSchema: z.ZodType<Prisma.OutboxEventWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => OutboxEventWhereInputSchema), z.lazy(() => OutboxEventWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => OutboxEventWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => OutboxEventWhereInputSchema), z.lazy(() => OutboxEventWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  type: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  payload: z.lazy(() => JsonFilterSchema).optional(),
  aggregateId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  processedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  retryCount: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
});

export const OutboxEventOrderByWithRelationInputSchema: z.ZodType<Prisma.OutboxEventOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  type: z.lazy(() => SortOrderSchema).optional(),
  payload: z.lazy(() => SortOrderSchema).optional(),
  aggregateId: z.lazy(() => SortOrderSchema).optional(),
  processedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  retryCount: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
});

export const OutboxEventWhereUniqueInputSchema: z.ZodType<Prisma.OutboxEventWhereUniqueInput> = z.object({
  id: z.cuid(),
})
.and(z.strictObject({
  id: z.cuid().optional(),
  AND: z.union([ z.lazy(() => OutboxEventWhereInputSchema), z.lazy(() => OutboxEventWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => OutboxEventWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => OutboxEventWhereInputSchema), z.lazy(() => OutboxEventWhereInputSchema).array() ]).optional(),
  type: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  payload: z.lazy(() => JsonFilterSchema).optional(),
  aggregateId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  processedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  retryCount: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
}));

export const OutboxEventOrderByWithAggregationInputSchema: z.ZodType<Prisma.OutboxEventOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  type: z.lazy(() => SortOrderSchema).optional(),
  payload: z.lazy(() => SortOrderSchema).optional(),
  aggregateId: z.lazy(() => SortOrderSchema).optional(),
  processedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  retryCount: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => OutboxEventCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => OutboxEventAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => OutboxEventMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => OutboxEventMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => OutboxEventSumOrderByAggregateInputSchema).optional(),
});

export const OutboxEventScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.OutboxEventScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => OutboxEventScalarWhereWithAggregatesInputSchema), z.lazy(() => OutboxEventScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => OutboxEventScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => OutboxEventScalarWhereWithAggregatesInputSchema), z.lazy(() => OutboxEventScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  type: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  payload: z.lazy(() => JsonWithAggregatesFilterSchema).optional(),
  aggregateId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  processedAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  retryCount: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
});

export const AiUsageLogWhereInputSchema: z.ZodType<Prisma.AiUsageLogWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => AiUsageLogWhereInputSchema), z.lazy(() => AiUsageLogWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => AiUsageLogWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => AiUsageLogWhereInputSchema), z.lazy(() => AiUsageLogWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  feature: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  promptVersion: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  provider: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  model: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  actorId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  inputTokens: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  outputTokens: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  estimatedCostRial: z.union([ z.lazy(() => IntNullableFilterSchema), z.number() ]).optional().nullable(),
  durationMs: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  status: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  gitSha: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
});

export const AiUsageLogOrderByWithRelationInputSchema: z.ZodType<Prisma.AiUsageLogOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  feature: z.lazy(() => SortOrderSchema).optional(),
  promptVersion: z.lazy(() => SortOrderSchema).optional(),
  provider: z.lazy(() => SortOrderSchema).optional(),
  model: z.lazy(() => SortOrderSchema).optional(),
  actorId: z.lazy(() => SortOrderSchema).optional(),
  inputTokens: z.lazy(() => SortOrderSchema).optional(),
  outputTokens: z.lazy(() => SortOrderSchema).optional(),
  estimatedCostRial: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  durationMs: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  gitSha: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
});

export const AiUsageLogWhereUniqueInputSchema: z.ZodType<Prisma.AiUsageLogWhereUniqueInput> = z.object({
  id: z.cuid(),
})
.and(z.strictObject({
  id: z.cuid().optional(),
  AND: z.union([ z.lazy(() => AiUsageLogWhereInputSchema), z.lazy(() => AiUsageLogWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => AiUsageLogWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => AiUsageLogWhereInputSchema), z.lazy(() => AiUsageLogWhereInputSchema).array() ]).optional(),
  feature: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  promptVersion: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  provider: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  model: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  actorId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  inputTokens: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  outputTokens: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  estimatedCostRial: z.union([ z.lazy(() => IntNullableFilterSchema), z.number().int() ]).optional().nullable(),
  durationMs: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  status: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  gitSha: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
}));

export const AiUsageLogOrderByWithAggregationInputSchema: z.ZodType<Prisma.AiUsageLogOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  feature: z.lazy(() => SortOrderSchema).optional(),
  promptVersion: z.lazy(() => SortOrderSchema).optional(),
  provider: z.lazy(() => SortOrderSchema).optional(),
  model: z.lazy(() => SortOrderSchema).optional(),
  actorId: z.lazy(() => SortOrderSchema).optional(),
  inputTokens: z.lazy(() => SortOrderSchema).optional(),
  outputTokens: z.lazy(() => SortOrderSchema).optional(),
  estimatedCostRial: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  durationMs: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  gitSha: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => AiUsageLogCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => AiUsageLogAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => AiUsageLogMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => AiUsageLogMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => AiUsageLogSumOrderByAggregateInputSchema).optional(),
});

export const AiUsageLogScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.AiUsageLogScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => AiUsageLogScalarWhereWithAggregatesInputSchema), z.lazy(() => AiUsageLogScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => AiUsageLogScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => AiUsageLogScalarWhereWithAggregatesInputSchema), z.lazy(() => AiUsageLogScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  feature: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  promptVersion: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  provider: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  model: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  actorId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  inputTokens: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  outputTokens: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  estimatedCostRial: z.union([ z.lazy(() => IntNullableWithAggregatesFilterSchema), z.number() ]).optional().nullable(),
  durationMs: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  status: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  gitSha: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
});

export const FeatureFlagWhereInputSchema: z.ZodType<Prisma.FeatureFlagWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => FeatureFlagWhereInputSchema), z.lazy(() => FeatureFlagWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => FeatureFlagWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => FeatureFlagWhereInputSchema), z.lazy(() => FeatureFlagWhereInputSchema).array() ]).optional(),
  key: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  enabled: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  rolloutPercentage: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  allowedRoles: z.lazy(() => StringNullableListFilterSchema).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
});

export const FeatureFlagOrderByWithRelationInputSchema: z.ZodType<Prisma.FeatureFlagOrderByWithRelationInput> = z.strictObject({
  key: z.lazy(() => SortOrderSchema).optional(),
  enabled: z.lazy(() => SortOrderSchema).optional(),
  rolloutPercentage: z.lazy(() => SortOrderSchema).optional(),
  allowedRoles: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const FeatureFlagWhereUniqueInputSchema: z.ZodType<Prisma.FeatureFlagWhereUniqueInput> = z.object({
  key: z.string(),
})
.and(z.strictObject({
  key: z.string().optional(),
  AND: z.union([ z.lazy(() => FeatureFlagWhereInputSchema), z.lazy(() => FeatureFlagWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => FeatureFlagWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => FeatureFlagWhereInputSchema), z.lazy(() => FeatureFlagWhereInputSchema).array() ]).optional(),
  enabled: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  rolloutPercentage: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  allowedRoles: z.lazy(() => StringNullableListFilterSchema).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
}));

export const FeatureFlagOrderByWithAggregationInputSchema: z.ZodType<Prisma.FeatureFlagOrderByWithAggregationInput> = z.strictObject({
  key: z.lazy(() => SortOrderSchema).optional(),
  enabled: z.lazy(() => SortOrderSchema).optional(),
  rolloutPercentage: z.lazy(() => SortOrderSchema).optional(),
  allowedRoles: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => FeatureFlagCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => FeatureFlagAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => FeatureFlagMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => FeatureFlagMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => FeatureFlagSumOrderByAggregateInputSchema).optional(),
});

export const FeatureFlagScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.FeatureFlagScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => FeatureFlagScalarWhereWithAggregatesInputSchema), z.lazy(() => FeatureFlagScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => FeatureFlagScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => FeatureFlagScalarWhereWithAggregatesInputSchema), z.lazy(() => FeatureFlagScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  key: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  enabled: z.union([ z.lazy(() => BoolWithAggregatesFilterSchema), z.boolean() ]).optional(),
  rolloutPercentage: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  allowedRoles: z.lazy(() => StringNullableListFilterSchema).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
});

export const ProductCreateInputSchema: z.ZodType<Prisma.ProductCreateInput> = z.strictObject({
  id: z.cuid().optional(),
  slug: z.string(),
  name: z.string(),
  brand: z.string(),
  model: z.string(),
  sku: z.string(),
  category: z.string(),
  subCategory: z.string().optional().nullable(),
  priceType: z.lazy(() => PriceTypeSchema),
  price: z.number().int().optional().nullable(),
  compareAtPrice: z.number().int().optional().nullable(),
  stockStatus: z.lazy(() => StockStatusSchema).optional(),
  images: z.union([ z.lazy(() => ProductCreateimagesInputSchema), z.string().array() ]).optional(),
  shortDescription: z.string(),
  description: z.string().optional().nullable(),
  keyFeatures: z.union([ z.lazy(() => ProductCreatekeyFeaturesInputSchema), z.string().array() ]).optional(),
  specs: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  technology: z.string().optional().nullable(),
  colorSupport: z.string().optional().nullable(),
  usageClass: z.string().optional().nullable(),
  warrantyMonths: z.number().int().optional().nullable(),
  condition: z.lazy(() => ProductConditionSchema).optional(),
  compatibleWith: z.union([ z.lazy(() => ProductCreatecompatibleWithInputSchema), z.string().array() ]).optional(),
  consumables: z.union([ z.lazy(() => ProductCreateconsumablesInputSchema), z.string().array() ]).optional(),
  isFeatured: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  orderItems: z.lazy(() => OrderItemCreateNestedManyWithoutProductInputSchema).optional(),
});

export const ProductUncheckedCreateInputSchema: z.ZodType<Prisma.ProductUncheckedCreateInput> = z.strictObject({
  id: z.cuid().optional(),
  slug: z.string(),
  name: z.string(),
  brand: z.string(),
  model: z.string(),
  sku: z.string(),
  category: z.string(),
  subCategory: z.string().optional().nullable(),
  priceType: z.lazy(() => PriceTypeSchema),
  price: z.number().int().optional().nullable(),
  compareAtPrice: z.number().int().optional().nullable(),
  stockStatus: z.lazy(() => StockStatusSchema).optional(),
  images: z.union([ z.lazy(() => ProductCreateimagesInputSchema), z.string().array() ]).optional(),
  shortDescription: z.string(),
  description: z.string().optional().nullable(),
  keyFeatures: z.union([ z.lazy(() => ProductCreatekeyFeaturesInputSchema), z.string().array() ]).optional(),
  specs: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  technology: z.string().optional().nullable(),
  colorSupport: z.string().optional().nullable(),
  usageClass: z.string().optional().nullable(),
  warrantyMonths: z.number().int().optional().nullable(),
  condition: z.lazy(() => ProductConditionSchema).optional(),
  compatibleWith: z.union([ z.lazy(() => ProductCreatecompatibleWithInputSchema), z.string().array() ]).optional(),
  consumables: z.union([ z.lazy(() => ProductCreateconsumablesInputSchema), z.string().array() ]).optional(),
  isFeatured: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  orderItems: z.lazy(() => OrderItemUncheckedCreateNestedManyWithoutProductInputSchema).optional(),
});

export const ProductUpdateInputSchema: z.ZodType<Prisma.ProductUpdateInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  slug: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  brand: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  model: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sku: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  category: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  subCategory: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  priceType: z.union([ z.lazy(() => PriceTypeSchema), z.lazy(() => EnumPriceTypeFieldUpdateOperationsInputSchema) ]).optional(),
  price: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  compareAtPrice: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  stockStatus: z.union([ z.lazy(() => StockStatusSchema), z.lazy(() => EnumStockStatusFieldUpdateOperationsInputSchema) ]).optional(),
  images: z.union([ z.lazy(() => ProductUpdateimagesInputSchema), z.string().array() ]).optional(),
  shortDescription: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  keyFeatures: z.union([ z.lazy(() => ProductUpdatekeyFeaturesInputSchema), z.string().array() ]).optional(),
  specs: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  technology: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  colorSupport: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  usageClass: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  warrantyMonths: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  condition: z.union([ z.lazy(() => ProductConditionSchema), z.lazy(() => EnumProductConditionFieldUpdateOperationsInputSchema) ]).optional(),
  compatibleWith: z.union([ z.lazy(() => ProductUpdatecompatibleWithInputSchema), z.string().array() ]).optional(),
  consumables: z.union([ z.lazy(() => ProductUpdateconsumablesInputSchema), z.string().array() ]).optional(),
  isFeatured: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  isBestSeller: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  orderItems: z.lazy(() => OrderItemUpdateManyWithoutProductNestedInputSchema).optional(),
});

export const ProductUncheckedUpdateInputSchema: z.ZodType<Prisma.ProductUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  slug: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  brand: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  model: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sku: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  category: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  subCategory: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  priceType: z.union([ z.lazy(() => PriceTypeSchema), z.lazy(() => EnumPriceTypeFieldUpdateOperationsInputSchema) ]).optional(),
  price: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  compareAtPrice: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  stockStatus: z.union([ z.lazy(() => StockStatusSchema), z.lazy(() => EnumStockStatusFieldUpdateOperationsInputSchema) ]).optional(),
  images: z.union([ z.lazy(() => ProductUpdateimagesInputSchema), z.string().array() ]).optional(),
  shortDescription: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  keyFeatures: z.union([ z.lazy(() => ProductUpdatekeyFeaturesInputSchema), z.string().array() ]).optional(),
  specs: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  technology: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  colorSupport: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  usageClass: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  warrantyMonths: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  condition: z.union([ z.lazy(() => ProductConditionSchema), z.lazy(() => EnumProductConditionFieldUpdateOperationsInputSchema) ]).optional(),
  compatibleWith: z.union([ z.lazy(() => ProductUpdatecompatibleWithInputSchema), z.string().array() ]).optional(),
  consumables: z.union([ z.lazy(() => ProductUpdateconsumablesInputSchema), z.string().array() ]).optional(),
  isFeatured: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  isBestSeller: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  orderItems: z.lazy(() => OrderItemUncheckedUpdateManyWithoutProductNestedInputSchema).optional(),
});

export const ProductCreateManyInputSchema: z.ZodType<Prisma.ProductCreateManyInput> = z.strictObject({
  id: z.cuid().optional(),
  slug: z.string(),
  name: z.string(),
  brand: z.string(),
  model: z.string(),
  sku: z.string(),
  category: z.string(),
  subCategory: z.string().optional().nullable(),
  priceType: z.lazy(() => PriceTypeSchema),
  price: z.number().int().optional().nullable(),
  compareAtPrice: z.number().int().optional().nullable(),
  stockStatus: z.lazy(() => StockStatusSchema).optional(),
  images: z.union([ z.lazy(() => ProductCreateimagesInputSchema), z.string().array() ]).optional(),
  shortDescription: z.string(),
  description: z.string().optional().nullable(),
  keyFeatures: z.union([ z.lazy(() => ProductCreatekeyFeaturesInputSchema), z.string().array() ]).optional(),
  specs: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  technology: z.string().optional().nullable(),
  colorSupport: z.string().optional().nullable(),
  usageClass: z.string().optional().nullable(),
  warrantyMonths: z.number().int().optional().nullable(),
  condition: z.lazy(() => ProductConditionSchema).optional(),
  compatibleWith: z.union([ z.lazy(() => ProductCreatecompatibleWithInputSchema), z.string().array() ]).optional(),
  consumables: z.union([ z.lazy(() => ProductCreateconsumablesInputSchema), z.string().array() ]).optional(),
  isFeatured: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const ProductUpdateManyMutationInputSchema: z.ZodType<Prisma.ProductUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  slug: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  brand: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  model: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sku: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  category: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  subCategory: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  priceType: z.union([ z.lazy(() => PriceTypeSchema), z.lazy(() => EnumPriceTypeFieldUpdateOperationsInputSchema) ]).optional(),
  price: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  compareAtPrice: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  stockStatus: z.union([ z.lazy(() => StockStatusSchema), z.lazy(() => EnumStockStatusFieldUpdateOperationsInputSchema) ]).optional(),
  images: z.union([ z.lazy(() => ProductUpdateimagesInputSchema), z.string().array() ]).optional(),
  shortDescription: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  keyFeatures: z.union([ z.lazy(() => ProductUpdatekeyFeaturesInputSchema), z.string().array() ]).optional(),
  specs: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  technology: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  colorSupport: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  usageClass: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  warrantyMonths: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  condition: z.union([ z.lazy(() => ProductConditionSchema), z.lazy(() => EnumProductConditionFieldUpdateOperationsInputSchema) ]).optional(),
  compatibleWith: z.union([ z.lazy(() => ProductUpdatecompatibleWithInputSchema), z.string().array() ]).optional(),
  consumables: z.union([ z.lazy(() => ProductUpdateconsumablesInputSchema), z.string().array() ]).optional(),
  isFeatured: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  isBestSeller: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const ProductUncheckedUpdateManyInputSchema: z.ZodType<Prisma.ProductUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  slug: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  brand: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  model: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sku: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  category: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  subCategory: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  priceType: z.union([ z.lazy(() => PriceTypeSchema), z.lazy(() => EnumPriceTypeFieldUpdateOperationsInputSchema) ]).optional(),
  price: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  compareAtPrice: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  stockStatus: z.union([ z.lazy(() => StockStatusSchema), z.lazy(() => EnumStockStatusFieldUpdateOperationsInputSchema) ]).optional(),
  images: z.union([ z.lazy(() => ProductUpdateimagesInputSchema), z.string().array() ]).optional(),
  shortDescription: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  keyFeatures: z.union([ z.lazy(() => ProductUpdatekeyFeaturesInputSchema), z.string().array() ]).optional(),
  specs: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  technology: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  colorSupport: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  usageClass: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  warrantyMonths: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  condition: z.union([ z.lazy(() => ProductConditionSchema), z.lazy(() => EnumProductConditionFieldUpdateOperationsInputSchema) ]).optional(),
  compatibleWith: z.union([ z.lazy(() => ProductUpdatecompatibleWithInputSchema), z.string().array() ]).optional(),
  consumables: z.union([ z.lazy(() => ProductUpdateconsumablesInputSchema), z.string().array() ]).optional(),
  isFeatured: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  isBestSeller: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const OrderCreateInputSchema: z.ZodType<Prisma.OrderCreateInput> = z.strictObject({
  id: z.cuid().optional(),
  customerId: z.string(),
  status: z.lazy(() => OrderStatusSchema).optional(),
  totalAmount: z.number().int(),
  currency: z.string().optional(),
  shippingAddress: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  items: z.lazy(() => OrderItemCreateNestedManyWithoutOrderInputSchema).optional(),
  paymentIntents: z.lazy(() => PaymentIntentCreateNestedManyWithoutOrderInputSchema).optional(),
});

export const OrderUncheckedCreateInputSchema: z.ZodType<Prisma.OrderUncheckedCreateInput> = z.strictObject({
  id: z.cuid().optional(),
  customerId: z.string(),
  status: z.lazy(() => OrderStatusSchema).optional(),
  totalAmount: z.number().int(),
  currency: z.string().optional(),
  shippingAddress: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  items: z.lazy(() => OrderItemUncheckedCreateNestedManyWithoutOrderInputSchema).optional(),
  paymentIntents: z.lazy(() => PaymentIntentUncheckedCreateNestedManyWithoutOrderInputSchema).optional(),
});

export const OrderUpdateInputSchema: z.ZodType<Prisma.OrderUpdateInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  customerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => OrderStatusSchema), z.lazy(() => EnumOrderStatusFieldUpdateOperationsInputSchema) ]).optional(),
  totalAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  currency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  shippingAddress: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  items: z.lazy(() => OrderItemUpdateManyWithoutOrderNestedInputSchema).optional(),
  paymentIntents: z.lazy(() => PaymentIntentUpdateManyWithoutOrderNestedInputSchema).optional(),
});

export const OrderUncheckedUpdateInputSchema: z.ZodType<Prisma.OrderUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  customerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => OrderStatusSchema), z.lazy(() => EnumOrderStatusFieldUpdateOperationsInputSchema) ]).optional(),
  totalAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  currency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  shippingAddress: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  items: z.lazy(() => OrderItemUncheckedUpdateManyWithoutOrderNestedInputSchema).optional(),
  paymentIntents: z.lazy(() => PaymentIntentUncheckedUpdateManyWithoutOrderNestedInputSchema).optional(),
});

export const OrderCreateManyInputSchema: z.ZodType<Prisma.OrderCreateManyInput> = z.strictObject({
  id: z.cuid().optional(),
  customerId: z.string(),
  status: z.lazy(() => OrderStatusSchema).optional(),
  totalAmount: z.number().int(),
  currency: z.string().optional(),
  shippingAddress: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const OrderUpdateManyMutationInputSchema: z.ZodType<Prisma.OrderUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  customerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => OrderStatusSchema), z.lazy(() => EnumOrderStatusFieldUpdateOperationsInputSchema) ]).optional(),
  totalAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  currency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  shippingAddress: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const OrderUncheckedUpdateManyInputSchema: z.ZodType<Prisma.OrderUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  customerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => OrderStatusSchema), z.lazy(() => EnumOrderStatusFieldUpdateOperationsInputSchema) ]).optional(),
  totalAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  currency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  shippingAddress: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const OrderItemCreateInputSchema: z.ZodType<Prisma.OrderItemCreateInput> = z.strictObject({
  id: z.cuid().optional(),
  quantity: z.number().int(),
  unitPrice: z.number().int(),
  order: z.lazy(() => OrderCreateNestedOneWithoutItemsInputSchema),
  product: z.lazy(() => ProductCreateNestedOneWithoutOrderItemsInputSchema),
});

export const OrderItemUncheckedCreateInputSchema: z.ZodType<Prisma.OrderItemUncheckedCreateInput> = z.strictObject({
  id: z.cuid().optional(),
  orderId: z.string(),
  productId: z.string(),
  quantity: z.number().int(),
  unitPrice: z.number().int(),
});

export const OrderItemUpdateInputSchema: z.ZodType<Prisma.OrderItemUpdateInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  quantity: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  unitPrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.lazy(() => OrderUpdateOneRequiredWithoutItemsNestedInputSchema).optional(),
  product: z.lazy(() => ProductUpdateOneRequiredWithoutOrderItemsNestedInputSchema).optional(),
});

export const OrderItemUncheckedUpdateInputSchema: z.ZodType<Prisma.OrderItemUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  orderId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  productId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  quantity: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  unitPrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
});

export const OrderItemCreateManyInputSchema: z.ZodType<Prisma.OrderItemCreateManyInput> = z.strictObject({
  id: z.cuid().optional(),
  orderId: z.string(),
  productId: z.string(),
  quantity: z.number().int(),
  unitPrice: z.number().int(),
});

export const OrderItemUpdateManyMutationInputSchema: z.ZodType<Prisma.OrderItemUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  quantity: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  unitPrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
});

export const OrderItemUncheckedUpdateManyInputSchema: z.ZodType<Prisma.OrderItemUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  orderId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  productId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  quantity: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  unitPrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
});

export const PaymentIntentCreateInputSchema: z.ZodType<Prisma.PaymentIntentCreateInput> = z.strictObject({
  id: z.cuid().optional(),
  providerCode: z.string(),
  amount: z.number().int(),
  currency: z.string().optional(),
  status: z.lazy(() => PaymentIntentStatusSchema).optional(),
  idempotencyKey: z.string(),
  authority: z.string().optional().nullable(),
  transactionId: z.string().optional().nullable(),
  redirectUrl: z.string().optional().nullable(),
  failureCode: z.string().optional().nullable(),
  failureMessage: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date(),
  verifiedAt: z.coerce.date().optional().nullable(),
  order: z.lazy(() => OrderCreateNestedOneWithoutPaymentIntentsInputSchema),
});

export const PaymentIntentUncheckedCreateInputSchema: z.ZodType<Prisma.PaymentIntentUncheckedCreateInput> = z.strictObject({
  id: z.cuid().optional(),
  orderId: z.string(),
  providerCode: z.string(),
  amount: z.number().int(),
  currency: z.string().optional(),
  status: z.lazy(() => PaymentIntentStatusSchema).optional(),
  idempotencyKey: z.string(),
  authority: z.string().optional().nullable(),
  transactionId: z.string().optional().nullable(),
  redirectUrl: z.string().optional().nullable(),
  failureCode: z.string().optional().nullable(),
  failureMessage: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date(),
  verifiedAt: z.coerce.date().optional().nullable(),
});

export const PaymentIntentUpdateInputSchema: z.ZodType<Prisma.PaymentIntentUpdateInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  providerCode: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  amount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  currency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => PaymentIntentStatusSchema), z.lazy(() => EnumPaymentIntentStatusFieldUpdateOperationsInputSchema) ]).optional(),
  idempotencyKey: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  authority: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  transactionId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  redirectUrl: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  failureCode: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  failureMessage: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  verifiedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  order: z.lazy(() => OrderUpdateOneRequiredWithoutPaymentIntentsNestedInputSchema).optional(),
});

export const PaymentIntentUncheckedUpdateInputSchema: z.ZodType<Prisma.PaymentIntentUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  orderId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  providerCode: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  amount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  currency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => PaymentIntentStatusSchema), z.lazy(() => EnumPaymentIntentStatusFieldUpdateOperationsInputSchema) ]).optional(),
  idempotencyKey: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  authority: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  transactionId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  redirectUrl: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  failureCode: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  failureMessage: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  verifiedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const PaymentIntentCreateManyInputSchema: z.ZodType<Prisma.PaymentIntentCreateManyInput> = z.strictObject({
  id: z.cuid().optional(),
  orderId: z.string(),
  providerCode: z.string(),
  amount: z.number().int(),
  currency: z.string().optional(),
  status: z.lazy(() => PaymentIntentStatusSchema).optional(),
  idempotencyKey: z.string(),
  authority: z.string().optional().nullable(),
  transactionId: z.string().optional().nullable(),
  redirectUrl: z.string().optional().nullable(),
  failureCode: z.string().optional().nullable(),
  failureMessage: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date(),
  verifiedAt: z.coerce.date().optional().nullable(),
});

export const PaymentIntentUpdateManyMutationInputSchema: z.ZodType<Prisma.PaymentIntentUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  providerCode: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  amount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  currency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => PaymentIntentStatusSchema), z.lazy(() => EnumPaymentIntentStatusFieldUpdateOperationsInputSchema) ]).optional(),
  idempotencyKey: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  authority: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  transactionId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  redirectUrl: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  failureCode: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  failureMessage: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  verifiedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const PaymentIntentUncheckedUpdateManyInputSchema: z.ZodType<Prisma.PaymentIntentUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  orderId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  providerCode: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  amount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  currency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => PaymentIntentStatusSchema), z.lazy(() => EnumPaymentIntentStatusFieldUpdateOperationsInputSchema) ]).optional(),
  idempotencyKey: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  authority: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  transactionId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  redirectUrl: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  failureCode: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  failureMessage: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  verifiedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const CustomerCreateInputSchema: z.ZodType<Prisma.CustomerCreateInput> = z.strictObject({
  id: z.cuid().optional(),
  email: z.string(),
  phone: z.string().optional().nullable(),
  name: z.string(),
  metadata: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const CustomerUncheckedCreateInputSchema: z.ZodType<Prisma.CustomerUncheckedCreateInput> = z.strictObject({
  id: z.cuid().optional(),
  email: z.string(),
  phone: z.string().optional().nullable(),
  name: z.string(),
  metadata: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const CustomerUpdateInputSchema: z.ZodType<Prisma.CustomerUpdateInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  phone: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  metadata: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const CustomerUncheckedUpdateInputSchema: z.ZodType<Prisma.CustomerUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  phone: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  metadata: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const CustomerCreateManyInputSchema: z.ZodType<Prisma.CustomerCreateManyInput> = z.strictObject({
  id: z.cuid().optional(),
  email: z.string(),
  phone: z.string().optional().nullable(),
  name: z.string(),
  metadata: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const CustomerUpdateManyMutationInputSchema: z.ZodType<Prisma.CustomerUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  phone: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  metadata: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const CustomerUncheckedUpdateManyInputSchema: z.ZodType<Prisma.CustomerUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  phone: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  metadata: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const OutboxEventCreateInputSchema: z.ZodType<Prisma.OutboxEventCreateInput> = z.strictObject({
  id: z.cuid().optional(),
  type: z.string(),
  payload: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]),
  aggregateId: z.string(),
  processedAt: z.coerce.date().optional().nullable(),
  retryCount: z.number().int().optional(),
  createdAt: z.coerce.date().optional(),
});

export const OutboxEventUncheckedCreateInputSchema: z.ZodType<Prisma.OutboxEventUncheckedCreateInput> = z.strictObject({
  id: z.cuid().optional(),
  type: z.string(),
  payload: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]),
  aggregateId: z.string(),
  processedAt: z.coerce.date().optional().nullable(),
  retryCount: z.number().int().optional(),
  createdAt: z.coerce.date().optional(),
});

export const OutboxEventUpdateInputSchema: z.ZodType<Prisma.OutboxEventUpdateInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  payload: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  aggregateId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  processedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  retryCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const OutboxEventUncheckedUpdateInputSchema: z.ZodType<Prisma.OutboxEventUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  payload: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  aggregateId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  processedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  retryCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const OutboxEventCreateManyInputSchema: z.ZodType<Prisma.OutboxEventCreateManyInput> = z.strictObject({
  id: z.cuid().optional(),
  type: z.string(),
  payload: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]),
  aggregateId: z.string(),
  processedAt: z.coerce.date().optional().nullable(),
  retryCount: z.number().int().optional(),
  createdAt: z.coerce.date().optional(),
});

export const OutboxEventUpdateManyMutationInputSchema: z.ZodType<Prisma.OutboxEventUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  payload: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  aggregateId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  processedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  retryCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const OutboxEventUncheckedUpdateManyInputSchema: z.ZodType<Prisma.OutboxEventUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  payload: z.union([ z.lazy(() => JsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  aggregateId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  processedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  retryCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const AiUsageLogCreateInputSchema: z.ZodType<Prisma.AiUsageLogCreateInput> = z.strictObject({
  id: z.cuid().optional(),
  feature: z.string(),
  promptVersion: z.string(),
  provider: z.string(),
  model: z.string(),
  actorId: z.string(),
  inputTokens: z.number().int(),
  outputTokens: z.number().int(),
  estimatedCostRial: z.number().int().optional().nullable(),
  durationMs: z.number().int(),
  status: z.string(),
  gitSha: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
});

export const AiUsageLogUncheckedCreateInputSchema: z.ZodType<Prisma.AiUsageLogUncheckedCreateInput> = z.strictObject({
  id: z.cuid().optional(),
  feature: z.string(),
  promptVersion: z.string(),
  provider: z.string(),
  model: z.string(),
  actorId: z.string(),
  inputTokens: z.number().int(),
  outputTokens: z.number().int(),
  estimatedCostRial: z.number().int().optional().nullable(),
  durationMs: z.number().int(),
  status: z.string(),
  gitSha: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
});

export const AiUsageLogUpdateInputSchema: z.ZodType<Prisma.AiUsageLogUpdateInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  feature: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  promptVersion: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  provider: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  model: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  actorId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  inputTokens: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  outputTokens: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  estimatedCostRial: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  durationMs: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  gitSha: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const AiUsageLogUncheckedUpdateInputSchema: z.ZodType<Prisma.AiUsageLogUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  feature: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  promptVersion: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  provider: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  model: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  actorId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  inputTokens: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  outputTokens: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  estimatedCostRial: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  durationMs: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  gitSha: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const AiUsageLogCreateManyInputSchema: z.ZodType<Prisma.AiUsageLogCreateManyInput> = z.strictObject({
  id: z.cuid().optional(),
  feature: z.string(),
  promptVersion: z.string(),
  provider: z.string(),
  model: z.string(),
  actorId: z.string(),
  inputTokens: z.number().int(),
  outputTokens: z.number().int(),
  estimatedCostRial: z.number().int().optional().nullable(),
  durationMs: z.number().int(),
  status: z.string(),
  gitSha: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
});

export const AiUsageLogUpdateManyMutationInputSchema: z.ZodType<Prisma.AiUsageLogUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  feature: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  promptVersion: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  provider: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  model: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  actorId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  inputTokens: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  outputTokens: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  estimatedCostRial: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  durationMs: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  gitSha: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const AiUsageLogUncheckedUpdateManyInputSchema: z.ZodType<Prisma.AiUsageLogUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  feature: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  promptVersion: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  provider: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  model: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  actorId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  inputTokens: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  outputTokens: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  estimatedCostRial: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  durationMs: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  gitSha: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const FeatureFlagCreateInputSchema: z.ZodType<Prisma.FeatureFlagCreateInput> = z.strictObject({
  key: z.string(),
  enabled: z.boolean().optional(),
  rolloutPercentage: z.number().int().optional(),
  allowedRoles: z.union([ z.lazy(() => FeatureFlagCreateallowedRolesInputSchema), z.string().array() ]).optional(),
  updatedAt: z.coerce.date().optional(),
});

export const FeatureFlagUncheckedCreateInputSchema: z.ZodType<Prisma.FeatureFlagUncheckedCreateInput> = z.strictObject({
  key: z.string(),
  enabled: z.boolean().optional(),
  rolloutPercentage: z.number().int().optional(),
  allowedRoles: z.union([ z.lazy(() => FeatureFlagCreateallowedRolesInputSchema), z.string().array() ]).optional(),
  updatedAt: z.coerce.date().optional(),
});

export const FeatureFlagUpdateInputSchema: z.ZodType<Prisma.FeatureFlagUpdateInput> = z.strictObject({
  key: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  enabled: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  rolloutPercentage: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  allowedRoles: z.union([ z.lazy(() => FeatureFlagUpdateallowedRolesInputSchema), z.string().array() ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const FeatureFlagUncheckedUpdateInputSchema: z.ZodType<Prisma.FeatureFlagUncheckedUpdateInput> = z.strictObject({
  key: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  enabled: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  rolloutPercentage: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  allowedRoles: z.union([ z.lazy(() => FeatureFlagUpdateallowedRolesInputSchema), z.string().array() ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const FeatureFlagCreateManyInputSchema: z.ZodType<Prisma.FeatureFlagCreateManyInput> = z.strictObject({
  key: z.string(),
  enabled: z.boolean().optional(),
  rolloutPercentage: z.number().int().optional(),
  allowedRoles: z.union([ z.lazy(() => FeatureFlagCreateallowedRolesInputSchema), z.string().array() ]).optional(),
  updatedAt: z.coerce.date().optional(),
});

export const FeatureFlagUpdateManyMutationInputSchema: z.ZodType<Prisma.FeatureFlagUpdateManyMutationInput> = z.strictObject({
  key: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  enabled: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  rolloutPercentage: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  allowedRoles: z.union([ z.lazy(() => FeatureFlagUpdateallowedRolesInputSchema), z.string().array() ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const FeatureFlagUncheckedUpdateManyInputSchema: z.ZodType<Prisma.FeatureFlagUncheckedUpdateManyInput> = z.strictObject({
  key: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  enabled: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  rolloutPercentage: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  allowedRoles: z.union([ z.lazy(() => FeatureFlagUpdateallowedRolesInputSchema), z.string().array() ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const StringFilterSchema: z.ZodType<Prisma.StringFilter> = z.strictObject({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringFilterSchema) ]).optional(),
});

export const StringNullableFilterSchema: z.ZodType<Prisma.StringNullableFilter> = z.strictObject({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableFilterSchema) ]).optional().nullable(),
});

export const EnumPriceTypeFilterSchema: z.ZodType<Prisma.EnumPriceTypeFilter> = z.strictObject({
  equals: z.lazy(() => PriceTypeSchema).optional(),
  in: z.lazy(() => PriceTypeSchema).array().optional(),
  notIn: z.lazy(() => PriceTypeSchema).array().optional(),
  not: z.union([ z.lazy(() => PriceTypeSchema), z.lazy(() => NestedEnumPriceTypeFilterSchema) ]).optional(),
});

export const IntNullableFilterSchema: z.ZodType<Prisma.IntNullableFilter> = z.strictObject({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntNullableFilterSchema) ]).optional().nullable(),
});

export const EnumStockStatusFilterSchema: z.ZodType<Prisma.EnumStockStatusFilter> = z.strictObject({
  equals: z.lazy(() => StockStatusSchema).optional(),
  in: z.lazy(() => StockStatusSchema).array().optional(),
  notIn: z.lazy(() => StockStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => StockStatusSchema), z.lazy(() => NestedEnumStockStatusFilterSchema) ]).optional(),
});

export const StringNullableListFilterSchema: z.ZodType<Prisma.StringNullableListFilter> = z.strictObject({
  equals: z.string().array().optional().nullable(),
  has: z.string().optional().nullable(),
  hasEvery: z.string().array().optional(),
  hasSome: z.string().array().optional(),
  isEmpty: z.boolean().optional(),
});

export const JsonNullableFilterSchema: z.ZodType<Prisma.JsonNullableFilter> = z.strictObject({
  equals: InputJsonValueSchema.optional(),
  path: z.string().array().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  string_contains: z.string().optional(),
  string_starts_with: z.string().optional(),
  string_ends_with: z.string().optional(),
  array_starts_with: InputJsonValueSchema.optional().nullable(),
  array_ends_with: InputJsonValueSchema.optional().nullable(),
  array_contains: InputJsonValueSchema.optional().nullable(),
  lt: InputJsonValueSchema.optional(),
  lte: InputJsonValueSchema.optional(),
  gt: InputJsonValueSchema.optional(),
  gte: InputJsonValueSchema.optional(),
  not: InputJsonValueSchema.optional(),
});

export const EnumProductConditionFilterSchema: z.ZodType<Prisma.EnumProductConditionFilter> = z.strictObject({
  equals: z.lazy(() => ProductConditionSchema).optional(),
  in: z.lazy(() => ProductConditionSchema).array().optional(),
  notIn: z.lazy(() => ProductConditionSchema).array().optional(),
  not: z.union([ z.lazy(() => ProductConditionSchema), z.lazy(() => NestedEnumProductConditionFilterSchema) ]).optional(),
});

export const BoolFilterSchema: z.ZodType<Prisma.BoolFilter> = z.strictObject({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolFilterSchema) ]).optional(),
});

export const DateTimeFilterSchema: z.ZodType<Prisma.DateTimeFilter> = z.strictObject({
  equals: z.coerce.date().optional(),
  in: z.coerce.date().array().optional(),
  notIn: z.coerce.date().array().optional(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeFilterSchema) ]).optional(),
});

export const OrderItemListRelationFilterSchema: z.ZodType<Prisma.OrderItemListRelationFilter> = z.strictObject({
  every: z.lazy(() => OrderItemWhereInputSchema).optional(),
  some: z.lazy(() => OrderItemWhereInputSchema).optional(),
  none: z.lazy(() => OrderItemWhereInputSchema).optional(),
});

export const SortOrderInputSchema: z.ZodType<Prisma.SortOrderInput> = z.strictObject({
  sort: z.lazy(() => SortOrderSchema),
  nulls: z.lazy(() => NullsOrderSchema).optional(),
});

export const OrderItemOrderByRelationAggregateInputSchema: z.ZodType<Prisma.OrderItemOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const ProductCountOrderByAggregateInputSchema: z.ZodType<Prisma.ProductCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  slug: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  brand: z.lazy(() => SortOrderSchema).optional(),
  model: z.lazy(() => SortOrderSchema).optional(),
  sku: z.lazy(() => SortOrderSchema).optional(),
  category: z.lazy(() => SortOrderSchema).optional(),
  subCategory: z.lazy(() => SortOrderSchema).optional(),
  priceType: z.lazy(() => SortOrderSchema).optional(),
  price: z.lazy(() => SortOrderSchema).optional(),
  compareAtPrice: z.lazy(() => SortOrderSchema).optional(),
  stockStatus: z.lazy(() => SortOrderSchema).optional(),
  images: z.lazy(() => SortOrderSchema).optional(),
  shortDescription: z.lazy(() => SortOrderSchema).optional(),
  description: z.lazy(() => SortOrderSchema).optional(),
  keyFeatures: z.lazy(() => SortOrderSchema).optional(),
  specs: z.lazy(() => SortOrderSchema).optional(),
  technology: z.lazy(() => SortOrderSchema).optional(),
  colorSupport: z.lazy(() => SortOrderSchema).optional(),
  usageClass: z.lazy(() => SortOrderSchema).optional(),
  warrantyMonths: z.lazy(() => SortOrderSchema).optional(),
  condition: z.lazy(() => SortOrderSchema).optional(),
  compatibleWith: z.lazy(() => SortOrderSchema).optional(),
  consumables: z.lazy(() => SortOrderSchema).optional(),
  isFeatured: z.lazy(() => SortOrderSchema).optional(),
  isBestSeller: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const ProductAvgOrderByAggregateInputSchema: z.ZodType<Prisma.ProductAvgOrderByAggregateInput> = z.strictObject({
  price: z.lazy(() => SortOrderSchema).optional(),
  compareAtPrice: z.lazy(() => SortOrderSchema).optional(),
  warrantyMonths: z.lazy(() => SortOrderSchema).optional(),
});

export const ProductMaxOrderByAggregateInputSchema: z.ZodType<Prisma.ProductMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  slug: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  brand: z.lazy(() => SortOrderSchema).optional(),
  model: z.lazy(() => SortOrderSchema).optional(),
  sku: z.lazy(() => SortOrderSchema).optional(),
  category: z.lazy(() => SortOrderSchema).optional(),
  subCategory: z.lazy(() => SortOrderSchema).optional(),
  priceType: z.lazy(() => SortOrderSchema).optional(),
  price: z.lazy(() => SortOrderSchema).optional(),
  compareAtPrice: z.lazy(() => SortOrderSchema).optional(),
  stockStatus: z.lazy(() => SortOrderSchema).optional(),
  shortDescription: z.lazy(() => SortOrderSchema).optional(),
  description: z.lazy(() => SortOrderSchema).optional(),
  technology: z.lazy(() => SortOrderSchema).optional(),
  colorSupport: z.lazy(() => SortOrderSchema).optional(),
  usageClass: z.lazy(() => SortOrderSchema).optional(),
  warrantyMonths: z.lazy(() => SortOrderSchema).optional(),
  condition: z.lazy(() => SortOrderSchema).optional(),
  isFeatured: z.lazy(() => SortOrderSchema).optional(),
  isBestSeller: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const ProductMinOrderByAggregateInputSchema: z.ZodType<Prisma.ProductMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  slug: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  brand: z.lazy(() => SortOrderSchema).optional(),
  model: z.lazy(() => SortOrderSchema).optional(),
  sku: z.lazy(() => SortOrderSchema).optional(),
  category: z.lazy(() => SortOrderSchema).optional(),
  subCategory: z.lazy(() => SortOrderSchema).optional(),
  priceType: z.lazy(() => SortOrderSchema).optional(),
  price: z.lazy(() => SortOrderSchema).optional(),
  compareAtPrice: z.lazy(() => SortOrderSchema).optional(),
  stockStatus: z.lazy(() => SortOrderSchema).optional(),
  shortDescription: z.lazy(() => SortOrderSchema).optional(),
  description: z.lazy(() => SortOrderSchema).optional(),
  technology: z.lazy(() => SortOrderSchema).optional(),
  colorSupport: z.lazy(() => SortOrderSchema).optional(),
  usageClass: z.lazy(() => SortOrderSchema).optional(),
  warrantyMonths: z.lazy(() => SortOrderSchema).optional(),
  condition: z.lazy(() => SortOrderSchema).optional(),
  isFeatured: z.lazy(() => SortOrderSchema).optional(),
  isBestSeller: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const ProductSumOrderByAggregateInputSchema: z.ZodType<Prisma.ProductSumOrderByAggregateInput> = z.strictObject({
  price: z.lazy(() => SortOrderSchema).optional(),
  compareAtPrice: z.lazy(() => SortOrderSchema).optional(),
  warrantyMonths: z.lazy(() => SortOrderSchema).optional(),
});

export const StringWithAggregatesFilterSchema: z.ZodType<Prisma.StringWithAggregatesFilter> = z.strictObject({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedStringFilterSchema).optional(),
  _max: z.lazy(() => NestedStringFilterSchema).optional(),
});

export const StringNullableWithAggregatesFilterSchema: z.ZodType<Prisma.StringNullableWithAggregatesFilter> = z.strictObject({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedStringNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedStringNullableFilterSchema).optional(),
});

export const EnumPriceTypeWithAggregatesFilterSchema: z.ZodType<Prisma.EnumPriceTypeWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => PriceTypeSchema).optional(),
  in: z.lazy(() => PriceTypeSchema).array().optional(),
  notIn: z.lazy(() => PriceTypeSchema).array().optional(),
  not: z.union([ z.lazy(() => PriceTypeSchema), z.lazy(() => NestedEnumPriceTypeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumPriceTypeFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumPriceTypeFilterSchema).optional(),
});

export const IntNullableWithAggregatesFilterSchema: z.ZodType<Prisma.IntNullableWithAggregatesFilter> = z.strictObject({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _avg: z.lazy(() => NestedFloatNullableFilterSchema).optional(),
  _sum: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedIntNullableFilterSchema).optional(),
});

export const EnumStockStatusWithAggregatesFilterSchema: z.ZodType<Prisma.EnumStockStatusWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => StockStatusSchema).optional(),
  in: z.lazy(() => StockStatusSchema).array().optional(),
  notIn: z.lazy(() => StockStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => StockStatusSchema), z.lazy(() => NestedEnumStockStatusWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumStockStatusFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumStockStatusFilterSchema).optional(),
});

export const JsonNullableWithAggregatesFilterSchema: z.ZodType<Prisma.JsonNullableWithAggregatesFilter> = z.strictObject({
  equals: InputJsonValueSchema.optional(),
  path: z.string().array().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  string_contains: z.string().optional(),
  string_starts_with: z.string().optional(),
  string_ends_with: z.string().optional(),
  array_starts_with: InputJsonValueSchema.optional().nullable(),
  array_ends_with: InputJsonValueSchema.optional().nullable(),
  array_contains: InputJsonValueSchema.optional().nullable(),
  lt: InputJsonValueSchema.optional(),
  lte: InputJsonValueSchema.optional(),
  gt: InputJsonValueSchema.optional(),
  gte: InputJsonValueSchema.optional(),
  not: InputJsonValueSchema.optional(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedJsonNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedJsonNullableFilterSchema).optional(),
});

export const EnumProductConditionWithAggregatesFilterSchema: z.ZodType<Prisma.EnumProductConditionWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => ProductConditionSchema).optional(),
  in: z.lazy(() => ProductConditionSchema).array().optional(),
  notIn: z.lazy(() => ProductConditionSchema).array().optional(),
  not: z.union([ z.lazy(() => ProductConditionSchema), z.lazy(() => NestedEnumProductConditionWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumProductConditionFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumProductConditionFilterSchema).optional(),
});

export const BoolWithAggregatesFilterSchema: z.ZodType<Prisma.BoolWithAggregatesFilter> = z.strictObject({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedBoolFilterSchema).optional(),
  _max: z.lazy(() => NestedBoolFilterSchema).optional(),
});

export const DateTimeWithAggregatesFilterSchema: z.ZodType<Prisma.DateTimeWithAggregatesFilter> = z.strictObject({
  equals: z.coerce.date().optional(),
  in: z.coerce.date().array().optional(),
  notIn: z.coerce.date().array().optional(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedDateTimeFilterSchema).optional(),
  _max: z.lazy(() => NestedDateTimeFilterSchema).optional(),
});

export const EnumOrderStatusFilterSchema: z.ZodType<Prisma.EnumOrderStatusFilter> = z.strictObject({
  equals: z.lazy(() => OrderStatusSchema).optional(),
  in: z.lazy(() => OrderStatusSchema).array().optional(),
  notIn: z.lazy(() => OrderStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => OrderStatusSchema), z.lazy(() => NestedEnumOrderStatusFilterSchema) ]).optional(),
});

export const IntFilterSchema: z.ZodType<Prisma.IntFilter> = z.strictObject({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntFilterSchema) ]).optional(),
});

export const PaymentIntentListRelationFilterSchema: z.ZodType<Prisma.PaymentIntentListRelationFilter> = z.strictObject({
  every: z.lazy(() => PaymentIntentWhereInputSchema).optional(),
  some: z.lazy(() => PaymentIntentWhereInputSchema).optional(),
  none: z.lazy(() => PaymentIntentWhereInputSchema).optional(),
});

export const PaymentIntentOrderByRelationAggregateInputSchema: z.ZodType<Prisma.PaymentIntentOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const OrderCountOrderByAggregateInputSchema: z.ZodType<Prisma.OrderCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  customerId: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  totalAmount: z.lazy(() => SortOrderSchema).optional(),
  currency: z.lazy(() => SortOrderSchema).optional(),
  shippingAddress: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const OrderAvgOrderByAggregateInputSchema: z.ZodType<Prisma.OrderAvgOrderByAggregateInput> = z.strictObject({
  totalAmount: z.lazy(() => SortOrderSchema).optional(),
});

export const OrderMaxOrderByAggregateInputSchema: z.ZodType<Prisma.OrderMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  customerId: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  totalAmount: z.lazy(() => SortOrderSchema).optional(),
  currency: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const OrderMinOrderByAggregateInputSchema: z.ZodType<Prisma.OrderMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  customerId: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  totalAmount: z.lazy(() => SortOrderSchema).optional(),
  currency: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const OrderSumOrderByAggregateInputSchema: z.ZodType<Prisma.OrderSumOrderByAggregateInput> = z.strictObject({
  totalAmount: z.lazy(() => SortOrderSchema).optional(),
});

export const EnumOrderStatusWithAggregatesFilterSchema: z.ZodType<Prisma.EnumOrderStatusWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => OrderStatusSchema).optional(),
  in: z.lazy(() => OrderStatusSchema).array().optional(),
  notIn: z.lazy(() => OrderStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => OrderStatusSchema), z.lazy(() => NestedEnumOrderStatusWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumOrderStatusFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumOrderStatusFilterSchema).optional(),
});

export const IntWithAggregatesFilterSchema: z.ZodType<Prisma.IntWithAggregatesFilter> = z.strictObject({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _avg: z.lazy(() => NestedFloatFilterSchema).optional(),
  _sum: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedIntFilterSchema).optional(),
  _max: z.lazy(() => NestedIntFilterSchema).optional(),
});

export const OrderScalarRelationFilterSchema: z.ZodType<Prisma.OrderScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => OrderWhereInputSchema).optional(),
  isNot: z.lazy(() => OrderWhereInputSchema).optional(),
});

export const ProductScalarRelationFilterSchema: z.ZodType<Prisma.ProductScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => ProductWhereInputSchema).optional(),
  isNot: z.lazy(() => ProductWhereInputSchema).optional(),
});

export const OrderItemCountOrderByAggregateInputSchema: z.ZodType<Prisma.OrderItemCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  orderId: z.lazy(() => SortOrderSchema).optional(),
  productId: z.lazy(() => SortOrderSchema).optional(),
  quantity: z.lazy(() => SortOrderSchema).optional(),
  unitPrice: z.lazy(() => SortOrderSchema).optional(),
});

export const OrderItemAvgOrderByAggregateInputSchema: z.ZodType<Prisma.OrderItemAvgOrderByAggregateInput> = z.strictObject({
  quantity: z.lazy(() => SortOrderSchema).optional(),
  unitPrice: z.lazy(() => SortOrderSchema).optional(),
});

export const OrderItemMaxOrderByAggregateInputSchema: z.ZodType<Prisma.OrderItemMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  orderId: z.lazy(() => SortOrderSchema).optional(),
  productId: z.lazy(() => SortOrderSchema).optional(),
  quantity: z.lazy(() => SortOrderSchema).optional(),
  unitPrice: z.lazy(() => SortOrderSchema).optional(),
});

export const OrderItemMinOrderByAggregateInputSchema: z.ZodType<Prisma.OrderItemMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  orderId: z.lazy(() => SortOrderSchema).optional(),
  productId: z.lazy(() => SortOrderSchema).optional(),
  quantity: z.lazy(() => SortOrderSchema).optional(),
  unitPrice: z.lazy(() => SortOrderSchema).optional(),
});

export const OrderItemSumOrderByAggregateInputSchema: z.ZodType<Prisma.OrderItemSumOrderByAggregateInput> = z.strictObject({
  quantity: z.lazy(() => SortOrderSchema).optional(),
  unitPrice: z.lazy(() => SortOrderSchema).optional(),
});

export const EnumPaymentIntentStatusFilterSchema: z.ZodType<Prisma.EnumPaymentIntentStatusFilter> = z.strictObject({
  equals: z.lazy(() => PaymentIntentStatusSchema).optional(),
  in: z.lazy(() => PaymentIntentStatusSchema).array().optional(),
  notIn: z.lazy(() => PaymentIntentStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => PaymentIntentStatusSchema), z.lazy(() => NestedEnumPaymentIntentStatusFilterSchema) ]).optional(),
});

export const DateTimeNullableFilterSchema: z.ZodType<Prisma.DateTimeNullableFilter> = z.strictObject({
  equals: z.coerce.date().optional().nullable(),
  in: z.coerce.date().array().optional().nullable(),
  notIn: z.coerce.date().array().optional().nullable(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeNullableFilterSchema) ]).optional().nullable(),
});

export const PaymentIntentCountOrderByAggregateInputSchema: z.ZodType<Prisma.PaymentIntentCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  orderId: z.lazy(() => SortOrderSchema).optional(),
  providerCode: z.lazy(() => SortOrderSchema).optional(),
  amount: z.lazy(() => SortOrderSchema).optional(),
  currency: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  idempotencyKey: z.lazy(() => SortOrderSchema).optional(),
  authority: z.lazy(() => SortOrderSchema).optional(),
  transactionId: z.lazy(() => SortOrderSchema).optional(),
  redirectUrl: z.lazy(() => SortOrderSchema).optional(),
  failureCode: z.lazy(() => SortOrderSchema).optional(),
  failureMessage: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  verifiedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const PaymentIntentAvgOrderByAggregateInputSchema: z.ZodType<Prisma.PaymentIntentAvgOrderByAggregateInput> = z.strictObject({
  amount: z.lazy(() => SortOrderSchema).optional(),
});

export const PaymentIntentMaxOrderByAggregateInputSchema: z.ZodType<Prisma.PaymentIntentMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  orderId: z.lazy(() => SortOrderSchema).optional(),
  providerCode: z.lazy(() => SortOrderSchema).optional(),
  amount: z.lazy(() => SortOrderSchema).optional(),
  currency: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  idempotencyKey: z.lazy(() => SortOrderSchema).optional(),
  authority: z.lazy(() => SortOrderSchema).optional(),
  transactionId: z.lazy(() => SortOrderSchema).optional(),
  redirectUrl: z.lazy(() => SortOrderSchema).optional(),
  failureCode: z.lazy(() => SortOrderSchema).optional(),
  failureMessage: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  verifiedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const PaymentIntentMinOrderByAggregateInputSchema: z.ZodType<Prisma.PaymentIntentMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  orderId: z.lazy(() => SortOrderSchema).optional(),
  providerCode: z.lazy(() => SortOrderSchema).optional(),
  amount: z.lazy(() => SortOrderSchema).optional(),
  currency: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  idempotencyKey: z.lazy(() => SortOrderSchema).optional(),
  authority: z.lazy(() => SortOrderSchema).optional(),
  transactionId: z.lazy(() => SortOrderSchema).optional(),
  redirectUrl: z.lazy(() => SortOrderSchema).optional(),
  failureCode: z.lazy(() => SortOrderSchema).optional(),
  failureMessage: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  verifiedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const PaymentIntentSumOrderByAggregateInputSchema: z.ZodType<Prisma.PaymentIntentSumOrderByAggregateInput> = z.strictObject({
  amount: z.lazy(() => SortOrderSchema).optional(),
});

export const EnumPaymentIntentStatusWithAggregatesFilterSchema: z.ZodType<Prisma.EnumPaymentIntentStatusWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => PaymentIntentStatusSchema).optional(),
  in: z.lazy(() => PaymentIntentStatusSchema).array().optional(),
  notIn: z.lazy(() => PaymentIntentStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => PaymentIntentStatusSchema), z.lazy(() => NestedEnumPaymentIntentStatusWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumPaymentIntentStatusFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumPaymentIntentStatusFilterSchema).optional(),
});

export const DateTimeNullableWithAggregatesFilterSchema: z.ZodType<Prisma.DateTimeNullableWithAggregatesFilter> = z.strictObject({
  equals: z.coerce.date().optional().nullable(),
  in: z.coerce.date().array().optional().nullable(),
  notIn: z.coerce.date().array().optional().nullable(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedDateTimeNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedDateTimeNullableFilterSchema).optional(),
});

export const CustomerCountOrderByAggregateInputSchema: z.ZodType<Prisma.CustomerCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  phone: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  metadata: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const CustomerMaxOrderByAggregateInputSchema: z.ZodType<Prisma.CustomerMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  phone: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const CustomerMinOrderByAggregateInputSchema: z.ZodType<Prisma.CustomerMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  phone: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const JsonFilterSchema: z.ZodType<Prisma.JsonFilter> = z.strictObject({
  equals: InputJsonValueSchema.optional(),
  path: z.string().array().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  string_contains: z.string().optional(),
  string_starts_with: z.string().optional(),
  string_ends_with: z.string().optional(),
  array_starts_with: InputJsonValueSchema.optional().nullable(),
  array_ends_with: InputJsonValueSchema.optional().nullable(),
  array_contains: InputJsonValueSchema.optional().nullable(),
  lt: InputJsonValueSchema.optional(),
  lte: InputJsonValueSchema.optional(),
  gt: InputJsonValueSchema.optional(),
  gte: InputJsonValueSchema.optional(),
  not: InputJsonValueSchema.optional(),
});

export const OutboxEventCountOrderByAggregateInputSchema: z.ZodType<Prisma.OutboxEventCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  type: z.lazy(() => SortOrderSchema).optional(),
  payload: z.lazy(() => SortOrderSchema).optional(),
  aggregateId: z.lazy(() => SortOrderSchema).optional(),
  processedAt: z.lazy(() => SortOrderSchema).optional(),
  retryCount: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
});

export const OutboxEventAvgOrderByAggregateInputSchema: z.ZodType<Prisma.OutboxEventAvgOrderByAggregateInput> = z.strictObject({
  retryCount: z.lazy(() => SortOrderSchema).optional(),
});

export const OutboxEventMaxOrderByAggregateInputSchema: z.ZodType<Prisma.OutboxEventMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  type: z.lazy(() => SortOrderSchema).optional(),
  aggregateId: z.lazy(() => SortOrderSchema).optional(),
  processedAt: z.lazy(() => SortOrderSchema).optional(),
  retryCount: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
});

export const OutboxEventMinOrderByAggregateInputSchema: z.ZodType<Prisma.OutboxEventMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  type: z.lazy(() => SortOrderSchema).optional(),
  aggregateId: z.lazy(() => SortOrderSchema).optional(),
  processedAt: z.lazy(() => SortOrderSchema).optional(),
  retryCount: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
});

export const OutboxEventSumOrderByAggregateInputSchema: z.ZodType<Prisma.OutboxEventSumOrderByAggregateInput> = z.strictObject({
  retryCount: z.lazy(() => SortOrderSchema).optional(),
});

export const JsonWithAggregatesFilterSchema: z.ZodType<Prisma.JsonWithAggregatesFilter> = z.strictObject({
  equals: InputJsonValueSchema.optional(),
  path: z.string().array().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  string_contains: z.string().optional(),
  string_starts_with: z.string().optional(),
  string_ends_with: z.string().optional(),
  array_starts_with: InputJsonValueSchema.optional().nullable(),
  array_ends_with: InputJsonValueSchema.optional().nullable(),
  array_contains: InputJsonValueSchema.optional().nullable(),
  lt: InputJsonValueSchema.optional(),
  lte: InputJsonValueSchema.optional(),
  gt: InputJsonValueSchema.optional(),
  gte: InputJsonValueSchema.optional(),
  not: InputJsonValueSchema.optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedJsonFilterSchema).optional(),
  _max: z.lazy(() => NestedJsonFilterSchema).optional(),
});

export const AiUsageLogCountOrderByAggregateInputSchema: z.ZodType<Prisma.AiUsageLogCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  feature: z.lazy(() => SortOrderSchema).optional(),
  promptVersion: z.lazy(() => SortOrderSchema).optional(),
  provider: z.lazy(() => SortOrderSchema).optional(),
  model: z.lazy(() => SortOrderSchema).optional(),
  actorId: z.lazy(() => SortOrderSchema).optional(),
  inputTokens: z.lazy(() => SortOrderSchema).optional(),
  outputTokens: z.lazy(() => SortOrderSchema).optional(),
  estimatedCostRial: z.lazy(() => SortOrderSchema).optional(),
  durationMs: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  gitSha: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
});

export const AiUsageLogAvgOrderByAggregateInputSchema: z.ZodType<Prisma.AiUsageLogAvgOrderByAggregateInput> = z.strictObject({
  inputTokens: z.lazy(() => SortOrderSchema).optional(),
  outputTokens: z.lazy(() => SortOrderSchema).optional(),
  estimatedCostRial: z.lazy(() => SortOrderSchema).optional(),
  durationMs: z.lazy(() => SortOrderSchema).optional(),
});

export const AiUsageLogMaxOrderByAggregateInputSchema: z.ZodType<Prisma.AiUsageLogMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  feature: z.lazy(() => SortOrderSchema).optional(),
  promptVersion: z.lazy(() => SortOrderSchema).optional(),
  provider: z.lazy(() => SortOrderSchema).optional(),
  model: z.lazy(() => SortOrderSchema).optional(),
  actorId: z.lazy(() => SortOrderSchema).optional(),
  inputTokens: z.lazy(() => SortOrderSchema).optional(),
  outputTokens: z.lazy(() => SortOrderSchema).optional(),
  estimatedCostRial: z.lazy(() => SortOrderSchema).optional(),
  durationMs: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  gitSha: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
});

export const AiUsageLogMinOrderByAggregateInputSchema: z.ZodType<Prisma.AiUsageLogMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  feature: z.lazy(() => SortOrderSchema).optional(),
  promptVersion: z.lazy(() => SortOrderSchema).optional(),
  provider: z.lazy(() => SortOrderSchema).optional(),
  model: z.lazy(() => SortOrderSchema).optional(),
  actorId: z.lazy(() => SortOrderSchema).optional(),
  inputTokens: z.lazy(() => SortOrderSchema).optional(),
  outputTokens: z.lazy(() => SortOrderSchema).optional(),
  estimatedCostRial: z.lazy(() => SortOrderSchema).optional(),
  durationMs: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  gitSha: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
});

export const AiUsageLogSumOrderByAggregateInputSchema: z.ZodType<Prisma.AiUsageLogSumOrderByAggregateInput> = z.strictObject({
  inputTokens: z.lazy(() => SortOrderSchema).optional(),
  outputTokens: z.lazy(() => SortOrderSchema).optional(),
  estimatedCostRial: z.lazy(() => SortOrderSchema).optional(),
  durationMs: z.lazy(() => SortOrderSchema).optional(),
});

export const FeatureFlagCountOrderByAggregateInputSchema: z.ZodType<Prisma.FeatureFlagCountOrderByAggregateInput> = z.strictObject({
  key: z.lazy(() => SortOrderSchema).optional(),
  enabled: z.lazy(() => SortOrderSchema).optional(),
  rolloutPercentage: z.lazy(() => SortOrderSchema).optional(),
  allowedRoles: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const FeatureFlagAvgOrderByAggregateInputSchema: z.ZodType<Prisma.FeatureFlagAvgOrderByAggregateInput> = z.strictObject({
  rolloutPercentage: z.lazy(() => SortOrderSchema).optional(),
});

export const FeatureFlagMaxOrderByAggregateInputSchema: z.ZodType<Prisma.FeatureFlagMaxOrderByAggregateInput> = z.strictObject({
  key: z.lazy(() => SortOrderSchema).optional(),
  enabled: z.lazy(() => SortOrderSchema).optional(),
  rolloutPercentage: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const FeatureFlagMinOrderByAggregateInputSchema: z.ZodType<Prisma.FeatureFlagMinOrderByAggregateInput> = z.strictObject({
  key: z.lazy(() => SortOrderSchema).optional(),
  enabled: z.lazy(() => SortOrderSchema).optional(),
  rolloutPercentage: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const FeatureFlagSumOrderByAggregateInputSchema: z.ZodType<Prisma.FeatureFlagSumOrderByAggregateInput> = z.strictObject({
  rolloutPercentage: z.lazy(() => SortOrderSchema).optional(),
});

export const ProductCreateimagesInputSchema: z.ZodType<Prisma.ProductCreateimagesInput> = z.strictObject({
  set: z.string().array(),
});

export const ProductCreatekeyFeaturesInputSchema: z.ZodType<Prisma.ProductCreatekeyFeaturesInput> = z.strictObject({
  set: z.string().array(),
});

export const ProductCreatecompatibleWithInputSchema: z.ZodType<Prisma.ProductCreatecompatibleWithInput> = z.strictObject({
  set: z.string().array(),
});

export const ProductCreateconsumablesInputSchema: z.ZodType<Prisma.ProductCreateconsumablesInput> = z.strictObject({
  set: z.string().array(),
});

export const OrderItemCreateNestedManyWithoutProductInputSchema: z.ZodType<Prisma.OrderItemCreateNestedManyWithoutProductInput> = z.strictObject({
  create: z.union([ z.lazy(() => OrderItemCreateWithoutProductInputSchema), z.lazy(() => OrderItemCreateWithoutProductInputSchema).array(), z.lazy(() => OrderItemUncheckedCreateWithoutProductInputSchema), z.lazy(() => OrderItemUncheckedCreateWithoutProductInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => OrderItemCreateOrConnectWithoutProductInputSchema), z.lazy(() => OrderItemCreateOrConnectWithoutProductInputSchema).array() ]).optional(),
  createMany: z.lazy(() => OrderItemCreateManyProductInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => OrderItemWhereUniqueInputSchema), z.lazy(() => OrderItemWhereUniqueInputSchema).array() ]).optional(),
});

export const OrderItemUncheckedCreateNestedManyWithoutProductInputSchema: z.ZodType<Prisma.OrderItemUncheckedCreateNestedManyWithoutProductInput> = z.strictObject({
  create: z.union([ z.lazy(() => OrderItemCreateWithoutProductInputSchema), z.lazy(() => OrderItemCreateWithoutProductInputSchema).array(), z.lazy(() => OrderItemUncheckedCreateWithoutProductInputSchema), z.lazy(() => OrderItemUncheckedCreateWithoutProductInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => OrderItemCreateOrConnectWithoutProductInputSchema), z.lazy(() => OrderItemCreateOrConnectWithoutProductInputSchema).array() ]).optional(),
  createMany: z.lazy(() => OrderItemCreateManyProductInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => OrderItemWhereUniqueInputSchema), z.lazy(() => OrderItemWhereUniqueInputSchema).array() ]).optional(),
});

export const StringFieldUpdateOperationsInputSchema: z.ZodType<Prisma.StringFieldUpdateOperationsInput> = z.strictObject({
  set: z.string().optional(),
});

export const NullableStringFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableStringFieldUpdateOperationsInput> = z.strictObject({
  set: z.string().optional().nullable(),
});

export const EnumPriceTypeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumPriceTypeFieldUpdateOperationsInput> = z.strictObject({
  set: z.lazy(() => PriceTypeSchema).optional(),
});

export const NullableIntFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableIntFieldUpdateOperationsInput> = z.strictObject({
  set: z.number().optional().nullable(),
  increment: z.number().optional(),
  decrement: z.number().optional(),
  multiply: z.number().optional(),
  divide: z.number().optional(),
});

export const EnumStockStatusFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumStockStatusFieldUpdateOperationsInput> = z.strictObject({
  set: z.lazy(() => StockStatusSchema).optional(),
});

export const ProductUpdateimagesInputSchema: z.ZodType<Prisma.ProductUpdateimagesInput> = z.strictObject({
  set: z.string().array().optional(),
  push: z.union([ z.string(),z.string().array() ]).optional(),
});

export const ProductUpdatekeyFeaturesInputSchema: z.ZodType<Prisma.ProductUpdatekeyFeaturesInput> = z.strictObject({
  set: z.string().array().optional(),
  push: z.union([ z.string(),z.string().array() ]).optional(),
});

export const EnumProductConditionFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumProductConditionFieldUpdateOperationsInput> = z.strictObject({
  set: z.lazy(() => ProductConditionSchema).optional(),
});

export const ProductUpdatecompatibleWithInputSchema: z.ZodType<Prisma.ProductUpdatecompatibleWithInput> = z.strictObject({
  set: z.string().array().optional(),
  push: z.union([ z.string(),z.string().array() ]).optional(),
});

export const ProductUpdateconsumablesInputSchema: z.ZodType<Prisma.ProductUpdateconsumablesInput> = z.strictObject({
  set: z.string().array().optional(),
  push: z.union([ z.string(),z.string().array() ]).optional(),
});

export const BoolFieldUpdateOperationsInputSchema: z.ZodType<Prisma.BoolFieldUpdateOperationsInput> = z.strictObject({
  set: z.boolean().optional(),
});

export const DateTimeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.DateTimeFieldUpdateOperationsInput> = z.strictObject({
  set: z.coerce.date().optional(),
});

export const OrderItemUpdateManyWithoutProductNestedInputSchema: z.ZodType<Prisma.OrderItemUpdateManyWithoutProductNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => OrderItemCreateWithoutProductInputSchema), z.lazy(() => OrderItemCreateWithoutProductInputSchema).array(), z.lazy(() => OrderItemUncheckedCreateWithoutProductInputSchema), z.lazy(() => OrderItemUncheckedCreateWithoutProductInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => OrderItemCreateOrConnectWithoutProductInputSchema), z.lazy(() => OrderItemCreateOrConnectWithoutProductInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => OrderItemUpsertWithWhereUniqueWithoutProductInputSchema), z.lazy(() => OrderItemUpsertWithWhereUniqueWithoutProductInputSchema).array() ]).optional(),
  createMany: z.lazy(() => OrderItemCreateManyProductInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => OrderItemWhereUniqueInputSchema), z.lazy(() => OrderItemWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => OrderItemWhereUniqueInputSchema), z.lazy(() => OrderItemWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => OrderItemWhereUniqueInputSchema), z.lazy(() => OrderItemWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => OrderItemWhereUniqueInputSchema), z.lazy(() => OrderItemWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => OrderItemUpdateWithWhereUniqueWithoutProductInputSchema), z.lazy(() => OrderItemUpdateWithWhereUniqueWithoutProductInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => OrderItemUpdateManyWithWhereWithoutProductInputSchema), z.lazy(() => OrderItemUpdateManyWithWhereWithoutProductInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => OrderItemScalarWhereInputSchema), z.lazy(() => OrderItemScalarWhereInputSchema).array() ]).optional(),
});

export const OrderItemUncheckedUpdateManyWithoutProductNestedInputSchema: z.ZodType<Prisma.OrderItemUncheckedUpdateManyWithoutProductNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => OrderItemCreateWithoutProductInputSchema), z.lazy(() => OrderItemCreateWithoutProductInputSchema).array(), z.lazy(() => OrderItemUncheckedCreateWithoutProductInputSchema), z.lazy(() => OrderItemUncheckedCreateWithoutProductInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => OrderItemCreateOrConnectWithoutProductInputSchema), z.lazy(() => OrderItemCreateOrConnectWithoutProductInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => OrderItemUpsertWithWhereUniqueWithoutProductInputSchema), z.lazy(() => OrderItemUpsertWithWhereUniqueWithoutProductInputSchema).array() ]).optional(),
  createMany: z.lazy(() => OrderItemCreateManyProductInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => OrderItemWhereUniqueInputSchema), z.lazy(() => OrderItemWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => OrderItemWhereUniqueInputSchema), z.lazy(() => OrderItemWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => OrderItemWhereUniqueInputSchema), z.lazy(() => OrderItemWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => OrderItemWhereUniqueInputSchema), z.lazy(() => OrderItemWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => OrderItemUpdateWithWhereUniqueWithoutProductInputSchema), z.lazy(() => OrderItemUpdateWithWhereUniqueWithoutProductInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => OrderItemUpdateManyWithWhereWithoutProductInputSchema), z.lazy(() => OrderItemUpdateManyWithWhereWithoutProductInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => OrderItemScalarWhereInputSchema), z.lazy(() => OrderItemScalarWhereInputSchema).array() ]).optional(),
});

export const OrderItemCreateNestedManyWithoutOrderInputSchema: z.ZodType<Prisma.OrderItemCreateNestedManyWithoutOrderInput> = z.strictObject({
  create: z.union([ z.lazy(() => OrderItemCreateWithoutOrderInputSchema), z.lazy(() => OrderItemCreateWithoutOrderInputSchema).array(), z.lazy(() => OrderItemUncheckedCreateWithoutOrderInputSchema), z.lazy(() => OrderItemUncheckedCreateWithoutOrderInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => OrderItemCreateOrConnectWithoutOrderInputSchema), z.lazy(() => OrderItemCreateOrConnectWithoutOrderInputSchema).array() ]).optional(),
  createMany: z.lazy(() => OrderItemCreateManyOrderInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => OrderItemWhereUniqueInputSchema), z.lazy(() => OrderItemWhereUniqueInputSchema).array() ]).optional(),
});

export const PaymentIntentCreateNestedManyWithoutOrderInputSchema: z.ZodType<Prisma.PaymentIntentCreateNestedManyWithoutOrderInput> = z.strictObject({
  create: z.union([ z.lazy(() => PaymentIntentCreateWithoutOrderInputSchema), z.lazy(() => PaymentIntentCreateWithoutOrderInputSchema).array(), z.lazy(() => PaymentIntentUncheckedCreateWithoutOrderInputSchema), z.lazy(() => PaymentIntentUncheckedCreateWithoutOrderInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PaymentIntentCreateOrConnectWithoutOrderInputSchema), z.lazy(() => PaymentIntentCreateOrConnectWithoutOrderInputSchema).array() ]).optional(),
  createMany: z.lazy(() => PaymentIntentCreateManyOrderInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => PaymentIntentWhereUniqueInputSchema), z.lazy(() => PaymentIntentWhereUniqueInputSchema).array() ]).optional(),
});

export const OrderItemUncheckedCreateNestedManyWithoutOrderInputSchema: z.ZodType<Prisma.OrderItemUncheckedCreateNestedManyWithoutOrderInput> = z.strictObject({
  create: z.union([ z.lazy(() => OrderItemCreateWithoutOrderInputSchema), z.lazy(() => OrderItemCreateWithoutOrderInputSchema).array(), z.lazy(() => OrderItemUncheckedCreateWithoutOrderInputSchema), z.lazy(() => OrderItemUncheckedCreateWithoutOrderInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => OrderItemCreateOrConnectWithoutOrderInputSchema), z.lazy(() => OrderItemCreateOrConnectWithoutOrderInputSchema).array() ]).optional(),
  createMany: z.lazy(() => OrderItemCreateManyOrderInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => OrderItemWhereUniqueInputSchema), z.lazy(() => OrderItemWhereUniqueInputSchema).array() ]).optional(),
});

export const PaymentIntentUncheckedCreateNestedManyWithoutOrderInputSchema: z.ZodType<Prisma.PaymentIntentUncheckedCreateNestedManyWithoutOrderInput> = z.strictObject({
  create: z.union([ z.lazy(() => PaymentIntentCreateWithoutOrderInputSchema), z.lazy(() => PaymentIntentCreateWithoutOrderInputSchema).array(), z.lazy(() => PaymentIntentUncheckedCreateWithoutOrderInputSchema), z.lazy(() => PaymentIntentUncheckedCreateWithoutOrderInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PaymentIntentCreateOrConnectWithoutOrderInputSchema), z.lazy(() => PaymentIntentCreateOrConnectWithoutOrderInputSchema).array() ]).optional(),
  createMany: z.lazy(() => PaymentIntentCreateManyOrderInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => PaymentIntentWhereUniqueInputSchema), z.lazy(() => PaymentIntentWhereUniqueInputSchema).array() ]).optional(),
});

export const EnumOrderStatusFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumOrderStatusFieldUpdateOperationsInput> = z.strictObject({
  set: z.lazy(() => OrderStatusSchema).optional(),
});

export const IntFieldUpdateOperationsInputSchema: z.ZodType<Prisma.IntFieldUpdateOperationsInput> = z.strictObject({
  set: z.number().optional(),
  increment: z.number().optional(),
  decrement: z.number().optional(),
  multiply: z.number().optional(),
  divide: z.number().optional(),
});

export const OrderItemUpdateManyWithoutOrderNestedInputSchema: z.ZodType<Prisma.OrderItemUpdateManyWithoutOrderNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => OrderItemCreateWithoutOrderInputSchema), z.lazy(() => OrderItemCreateWithoutOrderInputSchema).array(), z.lazy(() => OrderItemUncheckedCreateWithoutOrderInputSchema), z.lazy(() => OrderItemUncheckedCreateWithoutOrderInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => OrderItemCreateOrConnectWithoutOrderInputSchema), z.lazy(() => OrderItemCreateOrConnectWithoutOrderInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => OrderItemUpsertWithWhereUniqueWithoutOrderInputSchema), z.lazy(() => OrderItemUpsertWithWhereUniqueWithoutOrderInputSchema).array() ]).optional(),
  createMany: z.lazy(() => OrderItemCreateManyOrderInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => OrderItemWhereUniqueInputSchema), z.lazy(() => OrderItemWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => OrderItemWhereUniqueInputSchema), z.lazy(() => OrderItemWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => OrderItemWhereUniqueInputSchema), z.lazy(() => OrderItemWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => OrderItemWhereUniqueInputSchema), z.lazy(() => OrderItemWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => OrderItemUpdateWithWhereUniqueWithoutOrderInputSchema), z.lazy(() => OrderItemUpdateWithWhereUniqueWithoutOrderInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => OrderItemUpdateManyWithWhereWithoutOrderInputSchema), z.lazy(() => OrderItemUpdateManyWithWhereWithoutOrderInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => OrderItemScalarWhereInputSchema), z.lazy(() => OrderItemScalarWhereInputSchema).array() ]).optional(),
});

export const PaymentIntentUpdateManyWithoutOrderNestedInputSchema: z.ZodType<Prisma.PaymentIntentUpdateManyWithoutOrderNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => PaymentIntentCreateWithoutOrderInputSchema), z.lazy(() => PaymentIntentCreateWithoutOrderInputSchema).array(), z.lazy(() => PaymentIntentUncheckedCreateWithoutOrderInputSchema), z.lazy(() => PaymentIntentUncheckedCreateWithoutOrderInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PaymentIntentCreateOrConnectWithoutOrderInputSchema), z.lazy(() => PaymentIntentCreateOrConnectWithoutOrderInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => PaymentIntentUpsertWithWhereUniqueWithoutOrderInputSchema), z.lazy(() => PaymentIntentUpsertWithWhereUniqueWithoutOrderInputSchema).array() ]).optional(),
  createMany: z.lazy(() => PaymentIntentCreateManyOrderInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => PaymentIntentWhereUniqueInputSchema), z.lazy(() => PaymentIntentWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => PaymentIntentWhereUniqueInputSchema), z.lazy(() => PaymentIntentWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => PaymentIntentWhereUniqueInputSchema), z.lazy(() => PaymentIntentWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => PaymentIntentWhereUniqueInputSchema), z.lazy(() => PaymentIntentWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => PaymentIntentUpdateWithWhereUniqueWithoutOrderInputSchema), z.lazy(() => PaymentIntentUpdateWithWhereUniqueWithoutOrderInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => PaymentIntentUpdateManyWithWhereWithoutOrderInputSchema), z.lazy(() => PaymentIntentUpdateManyWithWhereWithoutOrderInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => PaymentIntentScalarWhereInputSchema), z.lazy(() => PaymentIntentScalarWhereInputSchema).array() ]).optional(),
});

export const OrderItemUncheckedUpdateManyWithoutOrderNestedInputSchema: z.ZodType<Prisma.OrderItemUncheckedUpdateManyWithoutOrderNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => OrderItemCreateWithoutOrderInputSchema), z.lazy(() => OrderItemCreateWithoutOrderInputSchema).array(), z.lazy(() => OrderItemUncheckedCreateWithoutOrderInputSchema), z.lazy(() => OrderItemUncheckedCreateWithoutOrderInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => OrderItemCreateOrConnectWithoutOrderInputSchema), z.lazy(() => OrderItemCreateOrConnectWithoutOrderInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => OrderItemUpsertWithWhereUniqueWithoutOrderInputSchema), z.lazy(() => OrderItemUpsertWithWhereUniqueWithoutOrderInputSchema).array() ]).optional(),
  createMany: z.lazy(() => OrderItemCreateManyOrderInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => OrderItemWhereUniqueInputSchema), z.lazy(() => OrderItemWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => OrderItemWhereUniqueInputSchema), z.lazy(() => OrderItemWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => OrderItemWhereUniqueInputSchema), z.lazy(() => OrderItemWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => OrderItemWhereUniqueInputSchema), z.lazy(() => OrderItemWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => OrderItemUpdateWithWhereUniqueWithoutOrderInputSchema), z.lazy(() => OrderItemUpdateWithWhereUniqueWithoutOrderInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => OrderItemUpdateManyWithWhereWithoutOrderInputSchema), z.lazy(() => OrderItemUpdateManyWithWhereWithoutOrderInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => OrderItemScalarWhereInputSchema), z.lazy(() => OrderItemScalarWhereInputSchema).array() ]).optional(),
});

export const PaymentIntentUncheckedUpdateManyWithoutOrderNestedInputSchema: z.ZodType<Prisma.PaymentIntentUncheckedUpdateManyWithoutOrderNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => PaymentIntentCreateWithoutOrderInputSchema), z.lazy(() => PaymentIntentCreateWithoutOrderInputSchema).array(), z.lazy(() => PaymentIntentUncheckedCreateWithoutOrderInputSchema), z.lazy(() => PaymentIntentUncheckedCreateWithoutOrderInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PaymentIntentCreateOrConnectWithoutOrderInputSchema), z.lazy(() => PaymentIntentCreateOrConnectWithoutOrderInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => PaymentIntentUpsertWithWhereUniqueWithoutOrderInputSchema), z.lazy(() => PaymentIntentUpsertWithWhereUniqueWithoutOrderInputSchema).array() ]).optional(),
  createMany: z.lazy(() => PaymentIntentCreateManyOrderInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => PaymentIntentWhereUniqueInputSchema), z.lazy(() => PaymentIntentWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => PaymentIntentWhereUniqueInputSchema), z.lazy(() => PaymentIntentWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => PaymentIntentWhereUniqueInputSchema), z.lazy(() => PaymentIntentWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => PaymentIntentWhereUniqueInputSchema), z.lazy(() => PaymentIntentWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => PaymentIntentUpdateWithWhereUniqueWithoutOrderInputSchema), z.lazy(() => PaymentIntentUpdateWithWhereUniqueWithoutOrderInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => PaymentIntentUpdateManyWithWhereWithoutOrderInputSchema), z.lazy(() => PaymentIntentUpdateManyWithWhereWithoutOrderInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => PaymentIntentScalarWhereInputSchema), z.lazy(() => PaymentIntentScalarWhereInputSchema).array() ]).optional(),
});

export const OrderCreateNestedOneWithoutItemsInputSchema: z.ZodType<Prisma.OrderCreateNestedOneWithoutItemsInput> = z.strictObject({
  create: z.union([ z.lazy(() => OrderCreateWithoutItemsInputSchema), z.lazy(() => OrderUncheckedCreateWithoutItemsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => OrderCreateOrConnectWithoutItemsInputSchema).optional(),
  connect: z.lazy(() => OrderWhereUniqueInputSchema).optional(),
});

export const ProductCreateNestedOneWithoutOrderItemsInputSchema: z.ZodType<Prisma.ProductCreateNestedOneWithoutOrderItemsInput> = z.strictObject({
  create: z.union([ z.lazy(() => ProductCreateWithoutOrderItemsInputSchema), z.lazy(() => ProductUncheckedCreateWithoutOrderItemsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => ProductCreateOrConnectWithoutOrderItemsInputSchema).optional(),
  connect: z.lazy(() => ProductWhereUniqueInputSchema).optional(),
});

export const OrderUpdateOneRequiredWithoutItemsNestedInputSchema: z.ZodType<Prisma.OrderUpdateOneRequiredWithoutItemsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => OrderCreateWithoutItemsInputSchema), z.lazy(() => OrderUncheckedCreateWithoutItemsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => OrderCreateOrConnectWithoutItemsInputSchema).optional(),
  upsert: z.lazy(() => OrderUpsertWithoutItemsInputSchema).optional(),
  connect: z.lazy(() => OrderWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => OrderUpdateToOneWithWhereWithoutItemsInputSchema), z.lazy(() => OrderUpdateWithoutItemsInputSchema), z.lazy(() => OrderUncheckedUpdateWithoutItemsInputSchema) ]).optional(),
});

export const ProductUpdateOneRequiredWithoutOrderItemsNestedInputSchema: z.ZodType<Prisma.ProductUpdateOneRequiredWithoutOrderItemsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => ProductCreateWithoutOrderItemsInputSchema), z.lazy(() => ProductUncheckedCreateWithoutOrderItemsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => ProductCreateOrConnectWithoutOrderItemsInputSchema).optional(),
  upsert: z.lazy(() => ProductUpsertWithoutOrderItemsInputSchema).optional(),
  connect: z.lazy(() => ProductWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => ProductUpdateToOneWithWhereWithoutOrderItemsInputSchema), z.lazy(() => ProductUpdateWithoutOrderItemsInputSchema), z.lazy(() => ProductUncheckedUpdateWithoutOrderItemsInputSchema) ]).optional(),
});

export const OrderCreateNestedOneWithoutPaymentIntentsInputSchema: z.ZodType<Prisma.OrderCreateNestedOneWithoutPaymentIntentsInput> = z.strictObject({
  create: z.union([ z.lazy(() => OrderCreateWithoutPaymentIntentsInputSchema), z.lazy(() => OrderUncheckedCreateWithoutPaymentIntentsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => OrderCreateOrConnectWithoutPaymentIntentsInputSchema).optional(),
  connect: z.lazy(() => OrderWhereUniqueInputSchema).optional(),
});

export const EnumPaymentIntentStatusFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumPaymentIntentStatusFieldUpdateOperationsInput> = z.strictObject({
  set: z.lazy(() => PaymentIntentStatusSchema).optional(),
});

export const NullableDateTimeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableDateTimeFieldUpdateOperationsInput> = z.strictObject({
  set: z.coerce.date().optional().nullable(),
});

export const OrderUpdateOneRequiredWithoutPaymentIntentsNestedInputSchema: z.ZodType<Prisma.OrderUpdateOneRequiredWithoutPaymentIntentsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => OrderCreateWithoutPaymentIntentsInputSchema), z.lazy(() => OrderUncheckedCreateWithoutPaymentIntentsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => OrderCreateOrConnectWithoutPaymentIntentsInputSchema).optional(),
  upsert: z.lazy(() => OrderUpsertWithoutPaymentIntentsInputSchema).optional(),
  connect: z.lazy(() => OrderWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => OrderUpdateToOneWithWhereWithoutPaymentIntentsInputSchema), z.lazy(() => OrderUpdateWithoutPaymentIntentsInputSchema), z.lazy(() => OrderUncheckedUpdateWithoutPaymentIntentsInputSchema) ]).optional(),
});

export const FeatureFlagCreateallowedRolesInputSchema: z.ZodType<Prisma.FeatureFlagCreateallowedRolesInput> = z.strictObject({
  set: z.string().array(),
});

export const FeatureFlagUpdateallowedRolesInputSchema: z.ZodType<Prisma.FeatureFlagUpdateallowedRolesInput> = z.strictObject({
  set: z.string().array().optional(),
  push: z.union([ z.string(),z.string().array() ]).optional(),
});

export const NestedStringFilterSchema: z.ZodType<Prisma.NestedStringFilter> = z.strictObject({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringFilterSchema) ]).optional(),
});

export const NestedStringNullableFilterSchema: z.ZodType<Prisma.NestedStringNullableFilter> = z.strictObject({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableFilterSchema) ]).optional().nullable(),
});

export const NestedEnumPriceTypeFilterSchema: z.ZodType<Prisma.NestedEnumPriceTypeFilter> = z.strictObject({
  equals: z.lazy(() => PriceTypeSchema).optional(),
  in: z.lazy(() => PriceTypeSchema).array().optional(),
  notIn: z.lazy(() => PriceTypeSchema).array().optional(),
  not: z.union([ z.lazy(() => PriceTypeSchema), z.lazy(() => NestedEnumPriceTypeFilterSchema) ]).optional(),
});

export const NestedIntNullableFilterSchema: z.ZodType<Prisma.NestedIntNullableFilter> = z.strictObject({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntNullableFilterSchema) ]).optional().nullable(),
});

export const NestedEnumStockStatusFilterSchema: z.ZodType<Prisma.NestedEnumStockStatusFilter> = z.strictObject({
  equals: z.lazy(() => StockStatusSchema).optional(),
  in: z.lazy(() => StockStatusSchema).array().optional(),
  notIn: z.lazy(() => StockStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => StockStatusSchema), z.lazy(() => NestedEnumStockStatusFilterSchema) ]).optional(),
});

export const NestedEnumProductConditionFilterSchema: z.ZodType<Prisma.NestedEnumProductConditionFilter> = z.strictObject({
  equals: z.lazy(() => ProductConditionSchema).optional(),
  in: z.lazy(() => ProductConditionSchema).array().optional(),
  notIn: z.lazy(() => ProductConditionSchema).array().optional(),
  not: z.union([ z.lazy(() => ProductConditionSchema), z.lazy(() => NestedEnumProductConditionFilterSchema) ]).optional(),
});

export const NestedBoolFilterSchema: z.ZodType<Prisma.NestedBoolFilter> = z.strictObject({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolFilterSchema) ]).optional(),
});

export const NestedDateTimeFilterSchema: z.ZodType<Prisma.NestedDateTimeFilter> = z.strictObject({
  equals: z.coerce.date().optional(),
  in: z.coerce.date().array().optional(),
  notIn: z.coerce.date().array().optional(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeFilterSchema) ]).optional(),
});

export const NestedStringWithAggregatesFilterSchema: z.ZodType<Prisma.NestedStringWithAggregatesFilter> = z.strictObject({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedStringFilterSchema).optional(),
  _max: z.lazy(() => NestedStringFilterSchema).optional(),
});

export const NestedIntFilterSchema: z.ZodType<Prisma.NestedIntFilter> = z.strictObject({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntFilterSchema) ]).optional(),
});

export const NestedStringNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedStringNullableWithAggregatesFilter> = z.strictObject({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedStringNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedStringNullableFilterSchema).optional(),
});

export const NestedEnumPriceTypeWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumPriceTypeWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => PriceTypeSchema).optional(),
  in: z.lazy(() => PriceTypeSchema).array().optional(),
  notIn: z.lazy(() => PriceTypeSchema).array().optional(),
  not: z.union([ z.lazy(() => PriceTypeSchema), z.lazy(() => NestedEnumPriceTypeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumPriceTypeFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumPriceTypeFilterSchema).optional(),
});

export const NestedIntNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedIntNullableWithAggregatesFilter> = z.strictObject({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _avg: z.lazy(() => NestedFloatNullableFilterSchema).optional(),
  _sum: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedIntNullableFilterSchema).optional(),
});

export const NestedFloatNullableFilterSchema: z.ZodType<Prisma.NestedFloatNullableFilter> = z.strictObject({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedFloatNullableFilterSchema) ]).optional().nullable(),
});

export const NestedEnumStockStatusWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumStockStatusWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => StockStatusSchema).optional(),
  in: z.lazy(() => StockStatusSchema).array().optional(),
  notIn: z.lazy(() => StockStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => StockStatusSchema), z.lazy(() => NestedEnumStockStatusWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumStockStatusFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumStockStatusFilterSchema).optional(),
});

export const NestedJsonNullableFilterSchema: z.ZodType<Prisma.NestedJsonNullableFilter> = z.strictObject({
  equals: InputJsonValueSchema.optional(),
  path: z.string().array().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  string_contains: z.string().optional(),
  string_starts_with: z.string().optional(),
  string_ends_with: z.string().optional(),
  array_starts_with: InputJsonValueSchema.optional().nullable(),
  array_ends_with: InputJsonValueSchema.optional().nullable(),
  array_contains: InputJsonValueSchema.optional().nullable(),
  lt: InputJsonValueSchema.optional(),
  lte: InputJsonValueSchema.optional(),
  gt: InputJsonValueSchema.optional(),
  gte: InputJsonValueSchema.optional(),
  not: InputJsonValueSchema.optional(),
});

export const NestedEnumProductConditionWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumProductConditionWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => ProductConditionSchema).optional(),
  in: z.lazy(() => ProductConditionSchema).array().optional(),
  notIn: z.lazy(() => ProductConditionSchema).array().optional(),
  not: z.union([ z.lazy(() => ProductConditionSchema), z.lazy(() => NestedEnumProductConditionWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumProductConditionFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumProductConditionFilterSchema).optional(),
});

export const NestedBoolWithAggregatesFilterSchema: z.ZodType<Prisma.NestedBoolWithAggregatesFilter> = z.strictObject({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedBoolFilterSchema).optional(),
  _max: z.lazy(() => NestedBoolFilterSchema).optional(),
});

export const NestedDateTimeWithAggregatesFilterSchema: z.ZodType<Prisma.NestedDateTimeWithAggregatesFilter> = z.strictObject({
  equals: z.coerce.date().optional(),
  in: z.coerce.date().array().optional(),
  notIn: z.coerce.date().array().optional(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedDateTimeFilterSchema).optional(),
  _max: z.lazy(() => NestedDateTimeFilterSchema).optional(),
});

export const NestedEnumOrderStatusFilterSchema: z.ZodType<Prisma.NestedEnumOrderStatusFilter> = z.strictObject({
  equals: z.lazy(() => OrderStatusSchema).optional(),
  in: z.lazy(() => OrderStatusSchema).array().optional(),
  notIn: z.lazy(() => OrderStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => OrderStatusSchema), z.lazy(() => NestedEnumOrderStatusFilterSchema) ]).optional(),
});

export const NestedEnumOrderStatusWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumOrderStatusWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => OrderStatusSchema).optional(),
  in: z.lazy(() => OrderStatusSchema).array().optional(),
  notIn: z.lazy(() => OrderStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => OrderStatusSchema), z.lazy(() => NestedEnumOrderStatusWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumOrderStatusFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumOrderStatusFilterSchema).optional(),
});

export const NestedIntWithAggregatesFilterSchema: z.ZodType<Prisma.NestedIntWithAggregatesFilter> = z.strictObject({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _avg: z.lazy(() => NestedFloatFilterSchema).optional(),
  _sum: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedIntFilterSchema).optional(),
  _max: z.lazy(() => NestedIntFilterSchema).optional(),
});

export const NestedFloatFilterSchema: z.ZodType<Prisma.NestedFloatFilter> = z.strictObject({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedFloatFilterSchema) ]).optional(),
});

export const NestedEnumPaymentIntentStatusFilterSchema: z.ZodType<Prisma.NestedEnumPaymentIntentStatusFilter> = z.strictObject({
  equals: z.lazy(() => PaymentIntentStatusSchema).optional(),
  in: z.lazy(() => PaymentIntentStatusSchema).array().optional(),
  notIn: z.lazy(() => PaymentIntentStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => PaymentIntentStatusSchema), z.lazy(() => NestedEnumPaymentIntentStatusFilterSchema) ]).optional(),
});

export const NestedDateTimeNullableFilterSchema: z.ZodType<Prisma.NestedDateTimeNullableFilter> = z.strictObject({
  equals: z.coerce.date().optional().nullable(),
  in: z.coerce.date().array().optional().nullable(),
  notIn: z.coerce.date().array().optional().nullable(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeNullableFilterSchema) ]).optional().nullable(),
});

export const NestedEnumPaymentIntentStatusWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumPaymentIntentStatusWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => PaymentIntentStatusSchema).optional(),
  in: z.lazy(() => PaymentIntentStatusSchema).array().optional(),
  notIn: z.lazy(() => PaymentIntentStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => PaymentIntentStatusSchema), z.lazy(() => NestedEnumPaymentIntentStatusWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumPaymentIntentStatusFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumPaymentIntentStatusFilterSchema).optional(),
});

export const NestedDateTimeNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedDateTimeNullableWithAggregatesFilter> = z.strictObject({
  equals: z.coerce.date().optional().nullable(),
  in: z.coerce.date().array().optional().nullable(),
  notIn: z.coerce.date().array().optional().nullable(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedDateTimeNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedDateTimeNullableFilterSchema).optional(),
});

export const NestedJsonFilterSchema: z.ZodType<Prisma.NestedJsonFilter> = z.strictObject({
  equals: InputJsonValueSchema.optional(),
  path: z.string().array().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  string_contains: z.string().optional(),
  string_starts_with: z.string().optional(),
  string_ends_with: z.string().optional(),
  array_starts_with: InputJsonValueSchema.optional().nullable(),
  array_ends_with: InputJsonValueSchema.optional().nullable(),
  array_contains: InputJsonValueSchema.optional().nullable(),
  lt: InputJsonValueSchema.optional(),
  lte: InputJsonValueSchema.optional(),
  gt: InputJsonValueSchema.optional(),
  gte: InputJsonValueSchema.optional(),
  not: InputJsonValueSchema.optional(),
});

export const OrderItemCreateWithoutProductInputSchema: z.ZodType<Prisma.OrderItemCreateWithoutProductInput> = z.strictObject({
  id: z.cuid().optional(),
  quantity: z.number().int(),
  unitPrice: z.number().int(),
  order: z.lazy(() => OrderCreateNestedOneWithoutItemsInputSchema),
});

export const OrderItemUncheckedCreateWithoutProductInputSchema: z.ZodType<Prisma.OrderItemUncheckedCreateWithoutProductInput> = z.strictObject({
  id: z.cuid().optional(),
  orderId: z.string(),
  quantity: z.number().int(),
  unitPrice: z.number().int(),
});

export const OrderItemCreateOrConnectWithoutProductInputSchema: z.ZodType<Prisma.OrderItemCreateOrConnectWithoutProductInput> = z.strictObject({
  where: z.lazy(() => OrderItemWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => OrderItemCreateWithoutProductInputSchema), z.lazy(() => OrderItemUncheckedCreateWithoutProductInputSchema) ]),
});

export const OrderItemCreateManyProductInputEnvelopeSchema: z.ZodType<Prisma.OrderItemCreateManyProductInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => OrderItemCreateManyProductInputSchema), z.lazy(() => OrderItemCreateManyProductInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const OrderItemUpsertWithWhereUniqueWithoutProductInputSchema: z.ZodType<Prisma.OrderItemUpsertWithWhereUniqueWithoutProductInput> = z.strictObject({
  where: z.lazy(() => OrderItemWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => OrderItemUpdateWithoutProductInputSchema), z.lazy(() => OrderItemUncheckedUpdateWithoutProductInputSchema) ]),
  create: z.union([ z.lazy(() => OrderItemCreateWithoutProductInputSchema), z.lazy(() => OrderItemUncheckedCreateWithoutProductInputSchema) ]),
});

export const OrderItemUpdateWithWhereUniqueWithoutProductInputSchema: z.ZodType<Prisma.OrderItemUpdateWithWhereUniqueWithoutProductInput> = z.strictObject({
  where: z.lazy(() => OrderItemWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => OrderItemUpdateWithoutProductInputSchema), z.lazy(() => OrderItemUncheckedUpdateWithoutProductInputSchema) ]),
});

export const OrderItemUpdateManyWithWhereWithoutProductInputSchema: z.ZodType<Prisma.OrderItemUpdateManyWithWhereWithoutProductInput> = z.strictObject({
  where: z.lazy(() => OrderItemScalarWhereInputSchema),
  data: z.union([ z.lazy(() => OrderItemUpdateManyMutationInputSchema), z.lazy(() => OrderItemUncheckedUpdateManyWithoutProductInputSchema) ]),
});

export const OrderItemScalarWhereInputSchema: z.ZodType<Prisma.OrderItemScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => OrderItemScalarWhereInputSchema), z.lazy(() => OrderItemScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => OrderItemScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => OrderItemScalarWhereInputSchema), z.lazy(() => OrderItemScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  orderId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  productId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  quantity: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  unitPrice: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
});

export const OrderItemCreateWithoutOrderInputSchema: z.ZodType<Prisma.OrderItemCreateWithoutOrderInput> = z.strictObject({
  id: z.cuid().optional(),
  quantity: z.number().int(),
  unitPrice: z.number().int(),
  product: z.lazy(() => ProductCreateNestedOneWithoutOrderItemsInputSchema),
});

export const OrderItemUncheckedCreateWithoutOrderInputSchema: z.ZodType<Prisma.OrderItemUncheckedCreateWithoutOrderInput> = z.strictObject({
  id: z.cuid().optional(),
  productId: z.string(),
  quantity: z.number().int(),
  unitPrice: z.number().int(),
});

export const OrderItemCreateOrConnectWithoutOrderInputSchema: z.ZodType<Prisma.OrderItemCreateOrConnectWithoutOrderInput> = z.strictObject({
  where: z.lazy(() => OrderItemWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => OrderItemCreateWithoutOrderInputSchema), z.lazy(() => OrderItemUncheckedCreateWithoutOrderInputSchema) ]),
});

export const OrderItemCreateManyOrderInputEnvelopeSchema: z.ZodType<Prisma.OrderItemCreateManyOrderInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => OrderItemCreateManyOrderInputSchema), z.lazy(() => OrderItemCreateManyOrderInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const PaymentIntentCreateWithoutOrderInputSchema: z.ZodType<Prisma.PaymentIntentCreateWithoutOrderInput> = z.strictObject({
  id: z.cuid().optional(),
  providerCode: z.string(),
  amount: z.number().int(),
  currency: z.string().optional(),
  status: z.lazy(() => PaymentIntentStatusSchema).optional(),
  idempotencyKey: z.string(),
  authority: z.string().optional().nullable(),
  transactionId: z.string().optional().nullable(),
  redirectUrl: z.string().optional().nullable(),
  failureCode: z.string().optional().nullable(),
  failureMessage: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date(),
  verifiedAt: z.coerce.date().optional().nullable(),
});

export const PaymentIntentUncheckedCreateWithoutOrderInputSchema: z.ZodType<Prisma.PaymentIntentUncheckedCreateWithoutOrderInput> = z.strictObject({
  id: z.cuid().optional(),
  providerCode: z.string(),
  amount: z.number().int(),
  currency: z.string().optional(),
  status: z.lazy(() => PaymentIntentStatusSchema).optional(),
  idempotencyKey: z.string(),
  authority: z.string().optional().nullable(),
  transactionId: z.string().optional().nullable(),
  redirectUrl: z.string().optional().nullable(),
  failureCode: z.string().optional().nullable(),
  failureMessage: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date(),
  verifiedAt: z.coerce.date().optional().nullable(),
});

export const PaymentIntentCreateOrConnectWithoutOrderInputSchema: z.ZodType<Prisma.PaymentIntentCreateOrConnectWithoutOrderInput> = z.strictObject({
  where: z.lazy(() => PaymentIntentWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => PaymentIntentCreateWithoutOrderInputSchema), z.lazy(() => PaymentIntentUncheckedCreateWithoutOrderInputSchema) ]),
});

export const PaymentIntentCreateManyOrderInputEnvelopeSchema: z.ZodType<Prisma.PaymentIntentCreateManyOrderInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => PaymentIntentCreateManyOrderInputSchema), z.lazy(() => PaymentIntentCreateManyOrderInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const OrderItemUpsertWithWhereUniqueWithoutOrderInputSchema: z.ZodType<Prisma.OrderItemUpsertWithWhereUniqueWithoutOrderInput> = z.strictObject({
  where: z.lazy(() => OrderItemWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => OrderItemUpdateWithoutOrderInputSchema), z.lazy(() => OrderItemUncheckedUpdateWithoutOrderInputSchema) ]),
  create: z.union([ z.lazy(() => OrderItemCreateWithoutOrderInputSchema), z.lazy(() => OrderItemUncheckedCreateWithoutOrderInputSchema) ]),
});

export const OrderItemUpdateWithWhereUniqueWithoutOrderInputSchema: z.ZodType<Prisma.OrderItemUpdateWithWhereUniqueWithoutOrderInput> = z.strictObject({
  where: z.lazy(() => OrderItemWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => OrderItemUpdateWithoutOrderInputSchema), z.lazy(() => OrderItemUncheckedUpdateWithoutOrderInputSchema) ]),
});

export const OrderItemUpdateManyWithWhereWithoutOrderInputSchema: z.ZodType<Prisma.OrderItemUpdateManyWithWhereWithoutOrderInput> = z.strictObject({
  where: z.lazy(() => OrderItemScalarWhereInputSchema),
  data: z.union([ z.lazy(() => OrderItemUpdateManyMutationInputSchema), z.lazy(() => OrderItemUncheckedUpdateManyWithoutOrderInputSchema) ]),
});

export const PaymentIntentUpsertWithWhereUniqueWithoutOrderInputSchema: z.ZodType<Prisma.PaymentIntentUpsertWithWhereUniqueWithoutOrderInput> = z.strictObject({
  where: z.lazy(() => PaymentIntentWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => PaymentIntentUpdateWithoutOrderInputSchema), z.lazy(() => PaymentIntentUncheckedUpdateWithoutOrderInputSchema) ]),
  create: z.union([ z.lazy(() => PaymentIntentCreateWithoutOrderInputSchema), z.lazy(() => PaymentIntentUncheckedCreateWithoutOrderInputSchema) ]),
});

export const PaymentIntentUpdateWithWhereUniqueWithoutOrderInputSchema: z.ZodType<Prisma.PaymentIntentUpdateWithWhereUniqueWithoutOrderInput> = z.strictObject({
  where: z.lazy(() => PaymentIntentWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => PaymentIntentUpdateWithoutOrderInputSchema), z.lazy(() => PaymentIntentUncheckedUpdateWithoutOrderInputSchema) ]),
});

export const PaymentIntentUpdateManyWithWhereWithoutOrderInputSchema: z.ZodType<Prisma.PaymentIntentUpdateManyWithWhereWithoutOrderInput> = z.strictObject({
  where: z.lazy(() => PaymentIntentScalarWhereInputSchema),
  data: z.union([ z.lazy(() => PaymentIntentUpdateManyMutationInputSchema), z.lazy(() => PaymentIntentUncheckedUpdateManyWithoutOrderInputSchema) ]),
});

export const PaymentIntentScalarWhereInputSchema: z.ZodType<Prisma.PaymentIntentScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => PaymentIntentScalarWhereInputSchema), z.lazy(() => PaymentIntentScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => PaymentIntentScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PaymentIntentScalarWhereInputSchema), z.lazy(() => PaymentIntentScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  orderId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  providerCode: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  amount: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  currency: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  status: z.union([ z.lazy(() => EnumPaymentIntentStatusFilterSchema), z.lazy(() => PaymentIntentStatusSchema) ]).optional(),
  idempotencyKey: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  authority: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  transactionId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  redirectUrl: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  failureCode: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  failureMessage: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  expiresAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  verifiedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
});

export const OrderCreateWithoutItemsInputSchema: z.ZodType<Prisma.OrderCreateWithoutItemsInput> = z.strictObject({
  id: z.cuid().optional(),
  customerId: z.string(),
  status: z.lazy(() => OrderStatusSchema).optional(),
  totalAmount: z.number().int(),
  currency: z.string().optional(),
  shippingAddress: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  paymentIntents: z.lazy(() => PaymentIntentCreateNestedManyWithoutOrderInputSchema).optional(),
});

export const OrderUncheckedCreateWithoutItemsInputSchema: z.ZodType<Prisma.OrderUncheckedCreateWithoutItemsInput> = z.strictObject({
  id: z.cuid().optional(),
  customerId: z.string(),
  status: z.lazy(() => OrderStatusSchema).optional(),
  totalAmount: z.number().int(),
  currency: z.string().optional(),
  shippingAddress: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  paymentIntents: z.lazy(() => PaymentIntentUncheckedCreateNestedManyWithoutOrderInputSchema).optional(),
});

export const OrderCreateOrConnectWithoutItemsInputSchema: z.ZodType<Prisma.OrderCreateOrConnectWithoutItemsInput> = z.strictObject({
  where: z.lazy(() => OrderWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => OrderCreateWithoutItemsInputSchema), z.lazy(() => OrderUncheckedCreateWithoutItemsInputSchema) ]),
});

export const ProductCreateWithoutOrderItemsInputSchema: z.ZodType<Prisma.ProductCreateWithoutOrderItemsInput> = z.strictObject({
  id: z.cuid().optional(),
  slug: z.string(),
  name: z.string(),
  brand: z.string(),
  model: z.string(),
  sku: z.string(),
  category: z.string(),
  subCategory: z.string().optional().nullable(),
  priceType: z.lazy(() => PriceTypeSchema),
  price: z.number().int().optional().nullable(),
  compareAtPrice: z.number().int().optional().nullable(),
  stockStatus: z.lazy(() => StockStatusSchema).optional(),
  images: z.union([ z.lazy(() => ProductCreateimagesInputSchema), z.string().array() ]).optional(),
  shortDescription: z.string(),
  description: z.string().optional().nullable(),
  keyFeatures: z.union([ z.lazy(() => ProductCreatekeyFeaturesInputSchema), z.string().array() ]).optional(),
  specs: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  technology: z.string().optional().nullable(),
  colorSupport: z.string().optional().nullable(),
  usageClass: z.string().optional().nullable(),
  warrantyMonths: z.number().int().optional().nullable(),
  condition: z.lazy(() => ProductConditionSchema).optional(),
  compatibleWith: z.union([ z.lazy(() => ProductCreatecompatibleWithInputSchema), z.string().array() ]).optional(),
  consumables: z.union([ z.lazy(() => ProductCreateconsumablesInputSchema), z.string().array() ]).optional(),
  isFeatured: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const ProductUncheckedCreateWithoutOrderItemsInputSchema: z.ZodType<Prisma.ProductUncheckedCreateWithoutOrderItemsInput> = z.strictObject({
  id: z.cuid().optional(),
  slug: z.string(),
  name: z.string(),
  brand: z.string(),
  model: z.string(),
  sku: z.string(),
  category: z.string(),
  subCategory: z.string().optional().nullable(),
  priceType: z.lazy(() => PriceTypeSchema),
  price: z.number().int().optional().nullable(),
  compareAtPrice: z.number().int().optional().nullable(),
  stockStatus: z.lazy(() => StockStatusSchema).optional(),
  images: z.union([ z.lazy(() => ProductCreateimagesInputSchema), z.string().array() ]).optional(),
  shortDescription: z.string(),
  description: z.string().optional().nullable(),
  keyFeatures: z.union([ z.lazy(() => ProductCreatekeyFeaturesInputSchema), z.string().array() ]).optional(),
  specs: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  technology: z.string().optional().nullable(),
  colorSupport: z.string().optional().nullable(),
  usageClass: z.string().optional().nullable(),
  warrantyMonths: z.number().int().optional().nullable(),
  condition: z.lazy(() => ProductConditionSchema).optional(),
  compatibleWith: z.union([ z.lazy(() => ProductCreatecompatibleWithInputSchema), z.string().array() ]).optional(),
  consumables: z.union([ z.lazy(() => ProductCreateconsumablesInputSchema), z.string().array() ]).optional(),
  isFeatured: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const ProductCreateOrConnectWithoutOrderItemsInputSchema: z.ZodType<Prisma.ProductCreateOrConnectWithoutOrderItemsInput> = z.strictObject({
  where: z.lazy(() => ProductWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => ProductCreateWithoutOrderItemsInputSchema), z.lazy(() => ProductUncheckedCreateWithoutOrderItemsInputSchema) ]),
});

export const OrderUpsertWithoutItemsInputSchema: z.ZodType<Prisma.OrderUpsertWithoutItemsInput> = z.strictObject({
  update: z.union([ z.lazy(() => OrderUpdateWithoutItemsInputSchema), z.lazy(() => OrderUncheckedUpdateWithoutItemsInputSchema) ]),
  create: z.union([ z.lazy(() => OrderCreateWithoutItemsInputSchema), z.lazy(() => OrderUncheckedCreateWithoutItemsInputSchema) ]),
  where: z.lazy(() => OrderWhereInputSchema).optional(),
});

export const OrderUpdateToOneWithWhereWithoutItemsInputSchema: z.ZodType<Prisma.OrderUpdateToOneWithWhereWithoutItemsInput> = z.strictObject({
  where: z.lazy(() => OrderWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => OrderUpdateWithoutItemsInputSchema), z.lazy(() => OrderUncheckedUpdateWithoutItemsInputSchema) ]),
});

export const OrderUpdateWithoutItemsInputSchema: z.ZodType<Prisma.OrderUpdateWithoutItemsInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  customerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => OrderStatusSchema), z.lazy(() => EnumOrderStatusFieldUpdateOperationsInputSchema) ]).optional(),
  totalAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  currency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  shippingAddress: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  paymentIntents: z.lazy(() => PaymentIntentUpdateManyWithoutOrderNestedInputSchema).optional(),
});

export const OrderUncheckedUpdateWithoutItemsInputSchema: z.ZodType<Prisma.OrderUncheckedUpdateWithoutItemsInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  customerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => OrderStatusSchema), z.lazy(() => EnumOrderStatusFieldUpdateOperationsInputSchema) ]).optional(),
  totalAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  currency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  shippingAddress: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  paymentIntents: z.lazy(() => PaymentIntentUncheckedUpdateManyWithoutOrderNestedInputSchema).optional(),
});

export const ProductUpsertWithoutOrderItemsInputSchema: z.ZodType<Prisma.ProductUpsertWithoutOrderItemsInput> = z.strictObject({
  update: z.union([ z.lazy(() => ProductUpdateWithoutOrderItemsInputSchema), z.lazy(() => ProductUncheckedUpdateWithoutOrderItemsInputSchema) ]),
  create: z.union([ z.lazy(() => ProductCreateWithoutOrderItemsInputSchema), z.lazy(() => ProductUncheckedCreateWithoutOrderItemsInputSchema) ]),
  where: z.lazy(() => ProductWhereInputSchema).optional(),
});

export const ProductUpdateToOneWithWhereWithoutOrderItemsInputSchema: z.ZodType<Prisma.ProductUpdateToOneWithWhereWithoutOrderItemsInput> = z.strictObject({
  where: z.lazy(() => ProductWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => ProductUpdateWithoutOrderItemsInputSchema), z.lazy(() => ProductUncheckedUpdateWithoutOrderItemsInputSchema) ]),
});

export const ProductUpdateWithoutOrderItemsInputSchema: z.ZodType<Prisma.ProductUpdateWithoutOrderItemsInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  slug: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  brand: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  model: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sku: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  category: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  subCategory: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  priceType: z.union([ z.lazy(() => PriceTypeSchema), z.lazy(() => EnumPriceTypeFieldUpdateOperationsInputSchema) ]).optional(),
  price: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  compareAtPrice: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  stockStatus: z.union([ z.lazy(() => StockStatusSchema), z.lazy(() => EnumStockStatusFieldUpdateOperationsInputSchema) ]).optional(),
  images: z.union([ z.lazy(() => ProductUpdateimagesInputSchema), z.string().array() ]).optional(),
  shortDescription: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  keyFeatures: z.union([ z.lazy(() => ProductUpdatekeyFeaturesInputSchema), z.string().array() ]).optional(),
  specs: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  technology: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  colorSupport: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  usageClass: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  warrantyMonths: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  condition: z.union([ z.lazy(() => ProductConditionSchema), z.lazy(() => EnumProductConditionFieldUpdateOperationsInputSchema) ]).optional(),
  compatibleWith: z.union([ z.lazy(() => ProductUpdatecompatibleWithInputSchema), z.string().array() ]).optional(),
  consumables: z.union([ z.lazy(() => ProductUpdateconsumablesInputSchema), z.string().array() ]).optional(),
  isFeatured: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  isBestSeller: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const ProductUncheckedUpdateWithoutOrderItemsInputSchema: z.ZodType<Prisma.ProductUncheckedUpdateWithoutOrderItemsInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  slug: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  brand: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  model: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sku: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  category: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  subCategory: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  priceType: z.union([ z.lazy(() => PriceTypeSchema), z.lazy(() => EnumPriceTypeFieldUpdateOperationsInputSchema) ]).optional(),
  price: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  compareAtPrice: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  stockStatus: z.union([ z.lazy(() => StockStatusSchema), z.lazy(() => EnumStockStatusFieldUpdateOperationsInputSchema) ]).optional(),
  images: z.union([ z.lazy(() => ProductUpdateimagesInputSchema), z.string().array() ]).optional(),
  shortDescription: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  keyFeatures: z.union([ z.lazy(() => ProductUpdatekeyFeaturesInputSchema), z.string().array() ]).optional(),
  specs: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  technology: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  colorSupport: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  usageClass: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  warrantyMonths: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  condition: z.union([ z.lazy(() => ProductConditionSchema), z.lazy(() => EnumProductConditionFieldUpdateOperationsInputSchema) ]).optional(),
  compatibleWith: z.union([ z.lazy(() => ProductUpdatecompatibleWithInputSchema), z.string().array() ]).optional(),
  consumables: z.union([ z.lazy(() => ProductUpdateconsumablesInputSchema), z.string().array() ]).optional(),
  isFeatured: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  isBestSeller: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const OrderCreateWithoutPaymentIntentsInputSchema: z.ZodType<Prisma.OrderCreateWithoutPaymentIntentsInput> = z.strictObject({
  id: z.cuid().optional(),
  customerId: z.string(),
  status: z.lazy(() => OrderStatusSchema).optional(),
  totalAmount: z.number().int(),
  currency: z.string().optional(),
  shippingAddress: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  items: z.lazy(() => OrderItemCreateNestedManyWithoutOrderInputSchema).optional(),
});

export const OrderUncheckedCreateWithoutPaymentIntentsInputSchema: z.ZodType<Prisma.OrderUncheckedCreateWithoutPaymentIntentsInput> = z.strictObject({
  id: z.cuid().optional(),
  customerId: z.string(),
  status: z.lazy(() => OrderStatusSchema).optional(),
  totalAmount: z.number().int(),
  currency: z.string().optional(),
  shippingAddress: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  items: z.lazy(() => OrderItemUncheckedCreateNestedManyWithoutOrderInputSchema).optional(),
});

export const OrderCreateOrConnectWithoutPaymentIntentsInputSchema: z.ZodType<Prisma.OrderCreateOrConnectWithoutPaymentIntentsInput> = z.strictObject({
  where: z.lazy(() => OrderWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => OrderCreateWithoutPaymentIntentsInputSchema), z.lazy(() => OrderUncheckedCreateWithoutPaymentIntentsInputSchema) ]),
});

export const OrderUpsertWithoutPaymentIntentsInputSchema: z.ZodType<Prisma.OrderUpsertWithoutPaymentIntentsInput> = z.strictObject({
  update: z.union([ z.lazy(() => OrderUpdateWithoutPaymentIntentsInputSchema), z.lazy(() => OrderUncheckedUpdateWithoutPaymentIntentsInputSchema) ]),
  create: z.union([ z.lazy(() => OrderCreateWithoutPaymentIntentsInputSchema), z.lazy(() => OrderUncheckedCreateWithoutPaymentIntentsInputSchema) ]),
  where: z.lazy(() => OrderWhereInputSchema).optional(),
});

export const OrderUpdateToOneWithWhereWithoutPaymentIntentsInputSchema: z.ZodType<Prisma.OrderUpdateToOneWithWhereWithoutPaymentIntentsInput> = z.strictObject({
  where: z.lazy(() => OrderWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => OrderUpdateWithoutPaymentIntentsInputSchema), z.lazy(() => OrderUncheckedUpdateWithoutPaymentIntentsInputSchema) ]),
});

export const OrderUpdateWithoutPaymentIntentsInputSchema: z.ZodType<Prisma.OrderUpdateWithoutPaymentIntentsInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  customerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => OrderStatusSchema), z.lazy(() => EnumOrderStatusFieldUpdateOperationsInputSchema) ]).optional(),
  totalAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  currency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  shippingAddress: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  items: z.lazy(() => OrderItemUpdateManyWithoutOrderNestedInputSchema).optional(),
});

export const OrderUncheckedUpdateWithoutPaymentIntentsInputSchema: z.ZodType<Prisma.OrderUncheckedUpdateWithoutPaymentIntentsInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  customerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => OrderStatusSchema), z.lazy(() => EnumOrderStatusFieldUpdateOperationsInputSchema) ]).optional(),
  totalAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  currency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  shippingAddress: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  items: z.lazy(() => OrderItemUncheckedUpdateManyWithoutOrderNestedInputSchema).optional(),
});

export const OrderItemCreateManyProductInputSchema: z.ZodType<Prisma.OrderItemCreateManyProductInput> = z.strictObject({
  id: z.cuid().optional(),
  orderId: z.string(),
  quantity: z.number().int(),
  unitPrice: z.number().int(),
});

export const OrderItemUpdateWithoutProductInputSchema: z.ZodType<Prisma.OrderItemUpdateWithoutProductInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  quantity: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  unitPrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.lazy(() => OrderUpdateOneRequiredWithoutItemsNestedInputSchema).optional(),
});

export const OrderItemUncheckedUpdateWithoutProductInputSchema: z.ZodType<Prisma.OrderItemUncheckedUpdateWithoutProductInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  orderId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  quantity: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  unitPrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
});

export const OrderItemUncheckedUpdateManyWithoutProductInputSchema: z.ZodType<Prisma.OrderItemUncheckedUpdateManyWithoutProductInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  orderId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  quantity: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  unitPrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
});

export const OrderItemCreateManyOrderInputSchema: z.ZodType<Prisma.OrderItemCreateManyOrderInput> = z.strictObject({
  id: z.cuid().optional(),
  productId: z.string(),
  quantity: z.number().int(),
  unitPrice: z.number().int(),
});

export const PaymentIntentCreateManyOrderInputSchema: z.ZodType<Prisma.PaymentIntentCreateManyOrderInput> = z.strictObject({
  id: z.cuid().optional(),
  providerCode: z.string(),
  amount: z.number().int(),
  currency: z.string().optional(),
  status: z.lazy(() => PaymentIntentStatusSchema).optional(),
  idempotencyKey: z.string(),
  authority: z.string().optional().nullable(),
  transactionId: z.string().optional().nullable(),
  redirectUrl: z.string().optional().nullable(),
  failureCode: z.string().optional().nullable(),
  failureMessage: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date(),
  verifiedAt: z.coerce.date().optional().nullable(),
});

export const OrderItemUpdateWithoutOrderInputSchema: z.ZodType<Prisma.OrderItemUpdateWithoutOrderInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  quantity: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  unitPrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  product: z.lazy(() => ProductUpdateOneRequiredWithoutOrderItemsNestedInputSchema).optional(),
});

export const OrderItemUncheckedUpdateWithoutOrderInputSchema: z.ZodType<Prisma.OrderItemUncheckedUpdateWithoutOrderInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  productId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  quantity: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  unitPrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
});

export const OrderItemUncheckedUpdateManyWithoutOrderInputSchema: z.ZodType<Prisma.OrderItemUncheckedUpdateManyWithoutOrderInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  productId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  quantity: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  unitPrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
});

export const PaymentIntentUpdateWithoutOrderInputSchema: z.ZodType<Prisma.PaymentIntentUpdateWithoutOrderInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  providerCode: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  amount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  currency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => PaymentIntentStatusSchema), z.lazy(() => EnumPaymentIntentStatusFieldUpdateOperationsInputSchema) ]).optional(),
  idempotencyKey: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  authority: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  transactionId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  redirectUrl: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  failureCode: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  failureMessage: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  verifiedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const PaymentIntentUncheckedUpdateWithoutOrderInputSchema: z.ZodType<Prisma.PaymentIntentUncheckedUpdateWithoutOrderInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  providerCode: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  amount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  currency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => PaymentIntentStatusSchema), z.lazy(() => EnumPaymentIntentStatusFieldUpdateOperationsInputSchema) ]).optional(),
  idempotencyKey: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  authority: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  transactionId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  redirectUrl: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  failureCode: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  failureMessage: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  verifiedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const PaymentIntentUncheckedUpdateManyWithoutOrderInputSchema: z.ZodType<Prisma.PaymentIntentUncheckedUpdateManyWithoutOrderInput> = z.strictObject({
  id: z.union([ z.cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  providerCode: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  amount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  currency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => PaymentIntentStatusSchema), z.lazy(() => EnumPaymentIntentStatusFieldUpdateOperationsInputSchema) ]).optional(),
  idempotencyKey: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  authority: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  transactionId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  redirectUrl: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  failureCode: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  failureMessage: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  verifiedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

/////////////////////////////////////////
// ARGS
/////////////////////////////////////////

export const ProductFindFirstArgsSchema: z.ZodType<Prisma.ProductFindFirstArgs> = z.object({
  select: ProductSelectSchema.optional(),
  include: ProductIncludeSchema.optional(),
  where: ProductWhereInputSchema.optional(), 
  orderBy: z.union([ ProductOrderByWithRelationInputSchema.array(), ProductOrderByWithRelationInputSchema ]).optional(),
  cursor: ProductWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ ProductScalarFieldEnumSchema, ProductScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const ProductFindFirstOrThrowArgsSchema: z.ZodType<Prisma.ProductFindFirstOrThrowArgs> = z.object({
  select: ProductSelectSchema.optional(),
  include: ProductIncludeSchema.optional(),
  where: ProductWhereInputSchema.optional(), 
  orderBy: z.union([ ProductOrderByWithRelationInputSchema.array(), ProductOrderByWithRelationInputSchema ]).optional(),
  cursor: ProductWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ ProductScalarFieldEnumSchema, ProductScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const ProductFindManyArgsSchema: z.ZodType<Prisma.ProductFindManyArgs> = z.object({
  select: ProductSelectSchema.optional(),
  include: ProductIncludeSchema.optional(),
  where: ProductWhereInputSchema.optional(), 
  orderBy: z.union([ ProductOrderByWithRelationInputSchema.array(), ProductOrderByWithRelationInputSchema ]).optional(),
  cursor: ProductWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ ProductScalarFieldEnumSchema, ProductScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const ProductAggregateArgsSchema: z.ZodType<Prisma.ProductAggregateArgs> = z.object({
  where: ProductWhereInputSchema.optional(), 
  orderBy: z.union([ ProductOrderByWithRelationInputSchema.array(), ProductOrderByWithRelationInputSchema ]).optional(),
  cursor: ProductWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const ProductGroupByArgsSchema: z.ZodType<Prisma.ProductGroupByArgs> = z.object({
  where: ProductWhereInputSchema.optional(), 
  orderBy: z.union([ ProductOrderByWithAggregationInputSchema.array(), ProductOrderByWithAggregationInputSchema ]).optional(),
  by: ProductScalarFieldEnumSchema.array(), 
  having: ProductScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const ProductFindUniqueArgsSchema: z.ZodType<Prisma.ProductFindUniqueArgs> = z.object({
  select: ProductSelectSchema.optional(),
  include: ProductIncludeSchema.optional(),
  where: ProductWhereUniqueInputSchema, 
}).strict();

export const ProductFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.ProductFindUniqueOrThrowArgs> = z.object({
  select: ProductSelectSchema.optional(),
  include: ProductIncludeSchema.optional(),
  where: ProductWhereUniqueInputSchema, 
}).strict();

export const OrderFindFirstArgsSchema: z.ZodType<Prisma.OrderFindFirstArgs> = z.object({
  select: OrderSelectSchema.optional(),
  include: OrderIncludeSchema.optional(),
  where: OrderWhereInputSchema.optional(), 
  orderBy: z.union([ OrderOrderByWithRelationInputSchema.array(), OrderOrderByWithRelationInputSchema ]).optional(),
  cursor: OrderWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ OrderScalarFieldEnumSchema, OrderScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const OrderFindFirstOrThrowArgsSchema: z.ZodType<Prisma.OrderFindFirstOrThrowArgs> = z.object({
  select: OrderSelectSchema.optional(),
  include: OrderIncludeSchema.optional(),
  where: OrderWhereInputSchema.optional(), 
  orderBy: z.union([ OrderOrderByWithRelationInputSchema.array(), OrderOrderByWithRelationInputSchema ]).optional(),
  cursor: OrderWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ OrderScalarFieldEnumSchema, OrderScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const OrderFindManyArgsSchema: z.ZodType<Prisma.OrderFindManyArgs> = z.object({
  select: OrderSelectSchema.optional(),
  include: OrderIncludeSchema.optional(),
  where: OrderWhereInputSchema.optional(), 
  orderBy: z.union([ OrderOrderByWithRelationInputSchema.array(), OrderOrderByWithRelationInputSchema ]).optional(),
  cursor: OrderWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ OrderScalarFieldEnumSchema, OrderScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const OrderAggregateArgsSchema: z.ZodType<Prisma.OrderAggregateArgs> = z.object({
  where: OrderWhereInputSchema.optional(), 
  orderBy: z.union([ OrderOrderByWithRelationInputSchema.array(), OrderOrderByWithRelationInputSchema ]).optional(),
  cursor: OrderWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const OrderGroupByArgsSchema: z.ZodType<Prisma.OrderGroupByArgs> = z.object({
  where: OrderWhereInputSchema.optional(), 
  orderBy: z.union([ OrderOrderByWithAggregationInputSchema.array(), OrderOrderByWithAggregationInputSchema ]).optional(),
  by: OrderScalarFieldEnumSchema.array(), 
  having: OrderScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const OrderFindUniqueArgsSchema: z.ZodType<Prisma.OrderFindUniqueArgs> = z.object({
  select: OrderSelectSchema.optional(),
  include: OrderIncludeSchema.optional(),
  where: OrderWhereUniqueInputSchema, 
}).strict();

export const OrderFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.OrderFindUniqueOrThrowArgs> = z.object({
  select: OrderSelectSchema.optional(),
  include: OrderIncludeSchema.optional(),
  where: OrderWhereUniqueInputSchema, 
}).strict();

export const OrderItemFindFirstArgsSchema: z.ZodType<Prisma.OrderItemFindFirstArgs> = z.object({
  select: OrderItemSelectSchema.optional(),
  include: OrderItemIncludeSchema.optional(),
  where: OrderItemWhereInputSchema.optional(), 
  orderBy: z.union([ OrderItemOrderByWithRelationInputSchema.array(), OrderItemOrderByWithRelationInputSchema ]).optional(),
  cursor: OrderItemWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ OrderItemScalarFieldEnumSchema, OrderItemScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const OrderItemFindFirstOrThrowArgsSchema: z.ZodType<Prisma.OrderItemFindFirstOrThrowArgs> = z.object({
  select: OrderItemSelectSchema.optional(),
  include: OrderItemIncludeSchema.optional(),
  where: OrderItemWhereInputSchema.optional(), 
  orderBy: z.union([ OrderItemOrderByWithRelationInputSchema.array(), OrderItemOrderByWithRelationInputSchema ]).optional(),
  cursor: OrderItemWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ OrderItemScalarFieldEnumSchema, OrderItemScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const OrderItemFindManyArgsSchema: z.ZodType<Prisma.OrderItemFindManyArgs> = z.object({
  select: OrderItemSelectSchema.optional(),
  include: OrderItemIncludeSchema.optional(),
  where: OrderItemWhereInputSchema.optional(), 
  orderBy: z.union([ OrderItemOrderByWithRelationInputSchema.array(), OrderItemOrderByWithRelationInputSchema ]).optional(),
  cursor: OrderItemWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ OrderItemScalarFieldEnumSchema, OrderItemScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const OrderItemAggregateArgsSchema: z.ZodType<Prisma.OrderItemAggregateArgs> = z.object({
  where: OrderItemWhereInputSchema.optional(), 
  orderBy: z.union([ OrderItemOrderByWithRelationInputSchema.array(), OrderItemOrderByWithRelationInputSchema ]).optional(),
  cursor: OrderItemWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const OrderItemGroupByArgsSchema: z.ZodType<Prisma.OrderItemGroupByArgs> = z.object({
  where: OrderItemWhereInputSchema.optional(), 
  orderBy: z.union([ OrderItemOrderByWithAggregationInputSchema.array(), OrderItemOrderByWithAggregationInputSchema ]).optional(),
  by: OrderItemScalarFieldEnumSchema.array(), 
  having: OrderItemScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const OrderItemFindUniqueArgsSchema: z.ZodType<Prisma.OrderItemFindUniqueArgs> = z.object({
  select: OrderItemSelectSchema.optional(),
  include: OrderItemIncludeSchema.optional(),
  where: OrderItemWhereUniqueInputSchema, 
}).strict();

export const OrderItemFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.OrderItemFindUniqueOrThrowArgs> = z.object({
  select: OrderItemSelectSchema.optional(),
  include: OrderItemIncludeSchema.optional(),
  where: OrderItemWhereUniqueInputSchema, 
}).strict();

export const PaymentIntentFindFirstArgsSchema: z.ZodType<Prisma.PaymentIntentFindFirstArgs> = z.object({
  select: PaymentIntentSelectSchema.optional(),
  include: PaymentIntentIncludeSchema.optional(),
  where: PaymentIntentWhereInputSchema.optional(), 
  orderBy: z.union([ PaymentIntentOrderByWithRelationInputSchema.array(), PaymentIntentOrderByWithRelationInputSchema ]).optional(),
  cursor: PaymentIntentWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PaymentIntentScalarFieldEnumSchema, PaymentIntentScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const PaymentIntentFindFirstOrThrowArgsSchema: z.ZodType<Prisma.PaymentIntentFindFirstOrThrowArgs> = z.object({
  select: PaymentIntentSelectSchema.optional(),
  include: PaymentIntentIncludeSchema.optional(),
  where: PaymentIntentWhereInputSchema.optional(), 
  orderBy: z.union([ PaymentIntentOrderByWithRelationInputSchema.array(), PaymentIntentOrderByWithRelationInputSchema ]).optional(),
  cursor: PaymentIntentWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PaymentIntentScalarFieldEnumSchema, PaymentIntentScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const PaymentIntentFindManyArgsSchema: z.ZodType<Prisma.PaymentIntentFindManyArgs> = z.object({
  select: PaymentIntentSelectSchema.optional(),
  include: PaymentIntentIncludeSchema.optional(),
  where: PaymentIntentWhereInputSchema.optional(), 
  orderBy: z.union([ PaymentIntentOrderByWithRelationInputSchema.array(), PaymentIntentOrderByWithRelationInputSchema ]).optional(),
  cursor: PaymentIntentWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PaymentIntentScalarFieldEnumSchema, PaymentIntentScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const PaymentIntentAggregateArgsSchema: z.ZodType<Prisma.PaymentIntentAggregateArgs> = z.object({
  where: PaymentIntentWhereInputSchema.optional(), 
  orderBy: z.union([ PaymentIntentOrderByWithRelationInputSchema.array(), PaymentIntentOrderByWithRelationInputSchema ]).optional(),
  cursor: PaymentIntentWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const PaymentIntentGroupByArgsSchema: z.ZodType<Prisma.PaymentIntentGroupByArgs> = z.object({
  where: PaymentIntentWhereInputSchema.optional(), 
  orderBy: z.union([ PaymentIntentOrderByWithAggregationInputSchema.array(), PaymentIntentOrderByWithAggregationInputSchema ]).optional(),
  by: PaymentIntentScalarFieldEnumSchema.array(), 
  having: PaymentIntentScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const PaymentIntentFindUniqueArgsSchema: z.ZodType<Prisma.PaymentIntentFindUniqueArgs> = z.object({
  select: PaymentIntentSelectSchema.optional(),
  include: PaymentIntentIncludeSchema.optional(),
  where: PaymentIntentWhereUniqueInputSchema, 
}).strict();

export const PaymentIntentFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.PaymentIntentFindUniqueOrThrowArgs> = z.object({
  select: PaymentIntentSelectSchema.optional(),
  include: PaymentIntentIncludeSchema.optional(),
  where: PaymentIntentWhereUniqueInputSchema, 
}).strict();

export const CustomerFindFirstArgsSchema: z.ZodType<Prisma.CustomerFindFirstArgs> = z.object({
  select: CustomerSelectSchema.optional(),
  where: CustomerWhereInputSchema.optional(), 
  orderBy: z.union([ CustomerOrderByWithRelationInputSchema.array(), CustomerOrderByWithRelationInputSchema ]).optional(),
  cursor: CustomerWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ CustomerScalarFieldEnumSchema, CustomerScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const CustomerFindFirstOrThrowArgsSchema: z.ZodType<Prisma.CustomerFindFirstOrThrowArgs> = z.object({
  select: CustomerSelectSchema.optional(),
  where: CustomerWhereInputSchema.optional(), 
  orderBy: z.union([ CustomerOrderByWithRelationInputSchema.array(), CustomerOrderByWithRelationInputSchema ]).optional(),
  cursor: CustomerWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ CustomerScalarFieldEnumSchema, CustomerScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const CustomerFindManyArgsSchema: z.ZodType<Prisma.CustomerFindManyArgs> = z.object({
  select: CustomerSelectSchema.optional(),
  where: CustomerWhereInputSchema.optional(), 
  orderBy: z.union([ CustomerOrderByWithRelationInputSchema.array(), CustomerOrderByWithRelationInputSchema ]).optional(),
  cursor: CustomerWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ CustomerScalarFieldEnumSchema, CustomerScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const CustomerAggregateArgsSchema: z.ZodType<Prisma.CustomerAggregateArgs> = z.object({
  where: CustomerWhereInputSchema.optional(), 
  orderBy: z.union([ CustomerOrderByWithRelationInputSchema.array(), CustomerOrderByWithRelationInputSchema ]).optional(),
  cursor: CustomerWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const CustomerGroupByArgsSchema: z.ZodType<Prisma.CustomerGroupByArgs> = z.object({
  where: CustomerWhereInputSchema.optional(), 
  orderBy: z.union([ CustomerOrderByWithAggregationInputSchema.array(), CustomerOrderByWithAggregationInputSchema ]).optional(),
  by: CustomerScalarFieldEnumSchema.array(), 
  having: CustomerScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const CustomerFindUniqueArgsSchema: z.ZodType<Prisma.CustomerFindUniqueArgs> = z.object({
  select: CustomerSelectSchema.optional(),
  where: CustomerWhereUniqueInputSchema, 
}).strict();

export const CustomerFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.CustomerFindUniqueOrThrowArgs> = z.object({
  select: CustomerSelectSchema.optional(),
  where: CustomerWhereUniqueInputSchema, 
}).strict();

export const OutboxEventFindFirstArgsSchema: z.ZodType<Prisma.OutboxEventFindFirstArgs> = z.object({
  select: OutboxEventSelectSchema.optional(),
  where: OutboxEventWhereInputSchema.optional(), 
  orderBy: z.union([ OutboxEventOrderByWithRelationInputSchema.array(), OutboxEventOrderByWithRelationInputSchema ]).optional(),
  cursor: OutboxEventWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ OutboxEventScalarFieldEnumSchema, OutboxEventScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const OutboxEventFindFirstOrThrowArgsSchema: z.ZodType<Prisma.OutboxEventFindFirstOrThrowArgs> = z.object({
  select: OutboxEventSelectSchema.optional(),
  where: OutboxEventWhereInputSchema.optional(), 
  orderBy: z.union([ OutboxEventOrderByWithRelationInputSchema.array(), OutboxEventOrderByWithRelationInputSchema ]).optional(),
  cursor: OutboxEventWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ OutboxEventScalarFieldEnumSchema, OutboxEventScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const OutboxEventFindManyArgsSchema: z.ZodType<Prisma.OutboxEventFindManyArgs> = z.object({
  select: OutboxEventSelectSchema.optional(),
  where: OutboxEventWhereInputSchema.optional(), 
  orderBy: z.union([ OutboxEventOrderByWithRelationInputSchema.array(), OutboxEventOrderByWithRelationInputSchema ]).optional(),
  cursor: OutboxEventWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ OutboxEventScalarFieldEnumSchema, OutboxEventScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const OutboxEventAggregateArgsSchema: z.ZodType<Prisma.OutboxEventAggregateArgs> = z.object({
  where: OutboxEventWhereInputSchema.optional(), 
  orderBy: z.union([ OutboxEventOrderByWithRelationInputSchema.array(), OutboxEventOrderByWithRelationInputSchema ]).optional(),
  cursor: OutboxEventWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const OutboxEventGroupByArgsSchema: z.ZodType<Prisma.OutboxEventGroupByArgs> = z.object({
  where: OutboxEventWhereInputSchema.optional(), 
  orderBy: z.union([ OutboxEventOrderByWithAggregationInputSchema.array(), OutboxEventOrderByWithAggregationInputSchema ]).optional(),
  by: OutboxEventScalarFieldEnumSchema.array(), 
  having: OutboxEventScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const OutboxEventFindUniqueArgsSchema: z.ZodType<Prisma.OutboxEventFindUniqueArgs> = z.object({
  select: OutboxEventSelectSchema.optional(),
  where: OutboxEventWhereUniqueInputSchema, 
}).strict();

export const OutboxEventFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.OutboxEventFindUniqueOrThrowArgs> = z.object({
  select: OutboxEventSelectSchema.optional(),
  where: OutboxEventWhereUniqueInputSchema, 
}).strict();

export const AiUsageLogFindFirstArgsSchema: z.ZodType<Prisma.AiUsageLogFindFirstArgs> = z.object({
  select: AiUsageLogSelectSchema.optional(),
  where: AiUsageLogWhereInputSchema.optional(), 
  orderBy: z.union([ AiUsageLogOrderByWithRelationInputSchema.array(), AiUsageLogOrderByWithRelationInputSchema ]).optional(),
  cursor: AiUsageLogWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ AiUsageLogScalarFieldEnumSchema, AiUsageLogScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const AiUsageLogFindFirstOrThrowArgsSchema: z.ZodType<Prisma.AiUsageLogFindFirstOrThrowArgs> = z.object({
  select: AiUsageLogSelectSchema.optional(),
  where: AiUsageLogWhereInputSchema.optional(), 
  orderBy: z.union([ AiUsageLogOrderByWithRelationInputSchema.array(), AiUsageLogOrderByWithRelationInputSchema ]).optional(),
  cursor: AiUsageLogWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ AiUsageLogScalarFieldEnumSchema, AiUsageLogScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const AiUsageLogFindManyArgsSchema: z.ZodType<Prisma.AiUsageLogFindManyArgs> = z.object({
  select: AiUsageLogSelectSchema.optional(),
  where: AiUsageLogWhereInputSchema.optional(), 
  orderBy: z.union([ AiUsageLogOrderByWithRelationInputSchema.array(), AiUsageLogOrderByWithRelationInputSchema ]).optional(),
  cursor: AiUsageLogWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ AiUsageLogScalarFieldEnumSchema, AiUsageLogScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const AiUsageLogAggregateArgsSchema: z.ZodType<Prisma.AiUsageLogAggregateArgs> = z.object({
  where: AiUsageLogWhereInputSchema.optional(), 
  orderBy: z.union([ AiUsageLogOrderByWithRelationInputSchema.array(), AiUsageLogOrderByWithRelationInputSchema ]).optional(),
  cursor: AiUsageLogWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const AiUsageLogGroupByArgsSchema: z.ZodType<Prisma.AiUsageLogGroupByArgs> = z.object({
  where: AiUsageLogWhereInputSchema.optional(), 
  orderBy: z.union([ AiUsageLogOrderByWithAggregationInputSchema.array(), AiUsageLogOrderByWithAggregationInputSchema ]).optional(),
  by: AiUsageLogScalarFieldEnumSchema.array(), 
  having: AiUsageLogScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const AiUsageLogFindUniqueArgsSchema: z.ZodType<Prisma.AiUsageLogFindUniqueArgs> = z.object({
  select: AiUsageLogSelectSchema.optional(),
  where: AiUsageLogWhereUniqueInputSchema, 
}).strict();

export const AiUsageLogFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.AiUsageLogFindUniqueOrThrowArgs> = z.object({
  select: AiUsageLogSelectSchema.optional(),
  where: AiUsageLogWhereUniqueInputSchema, 
}).strict();

export const FeatureFlagFindFirstArgsSchema: z.ZodType<Prisma.FeatureFlagFindFirstArgs> = z.object({
  select: FeatureFlagSelectSchema.optional(),
  where: FeatureFlagWhereInputSchema.optional(), 
  orderBy: z.union([ FeatureFlagOrderByWithRelationInputSchema.array(), FeatureFlagOrderByWithRelationInputSchema ]).optional(),
  cursor: FeatureFlagWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ FeatureFlagScalarFieldEnumSchema, FeatureFlagScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const FeatureFlagFindFirstOrThrowArgsSchema: z.ZodType<Prisma.FeatureFlagFindFirstOrThrowArgs> = z.object({
  select: FeatureFlagSelectSchema.optional(),
  where: FeatureFlagWhereInputSchema.optional(), 
  orderBy: z.union([ FeatureFlagOrderByWithRelationInputSchema.array(), FeatureFlagOrderByWithRelationInputSchema ]).optional(),
  cursor: FeatureFlagWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ FeatureFlagScalarFieldEnumSchema, FeatureFlagScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const FeatureFlagFindManyArgsSchema: z.ZodType<Prisma.FeatureFlagFindManyArgs> = z.object({
  select: FeatureFlagSelectSchema.optional(),
  where: FeatureFlagWhereInputSchema.optional(), 
  orderBy: z.union([ FeatureFlagOrderByWithRelationInputSchema.array(), FeatureFlagOrderByWithRelationInputSchema ]).optional(),
  cursor: FeatureFlagWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ FeatureFlagScalarFieldEnumSchema, FeatureFlagScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const FeatureFlagAggregateArgsSchema: z.ZodType<Prisma.FeatureFlagAggregateArgs> = z.object({
  where: FeatureFlagWhereInputSchema.optional(), 
  orderBy: z.union([ FeatureFlagOrderByWithRelationInputSchema.array(), FeatureFlagOrderByWithRelationInputSchema ]).optional(),
  cursor: FeatureFlagWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const FeatureFlagGroupByArgsSchema: z.ZodType<Prisma.FeatureFlagGroupByArgs> = z.object({
  where: FeatureFlagWhereInputSchema.optional(), 
  orderBy: z.union([ FeatureFlagOrderByWithAggregationInputSchema.array(), FeatureFlagOrderByWithAggregationInputSchema ]).optional(),
  by: FeatureFlagScalarFieldEnumSchema.array(), 
  having: FeatureFlagScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const FeatureFlagFindUniqueArgsSchema: z.ZodType<Prisma.FeatureFlagFindUniqueArgs> = z.object({
  select: FeatureFlagSelectSchema.optional(),
  where: FeatureFlagWhereUniqueInputSchema, 
}).strict();

export const FeatureFlagFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.FeatureFlagFindUniqueOrThrowArgs> = z.object({
  select: FeatureFlagSelectSchema.optional(),
  where: FeatureFlagWhereUniqueInputSchema, 
}).strict();

export const ProductCreateArgsSchema: z.ZodType<Prisma.ProductCreateArgs> = z.object({
  select: ProductSelectSchema.optional(),
  include: ProductIncludeSchema.optional(),
  data: z.union([ ProductCreateInputSchema, ProductUncheckedCreateInputSchema ]),
}).strict();

export const ProductUpsertArgsSchema: z.ZodType<Prisma.ProductUpsertArgs> = z.object({
  select: ProductSelectSchema.optional(),
  include: ProductIncludeSchema.optional(),
  where: ProductWhereUniqueInputSchema, 
  create: z.union([ ProductCreateInputSchema, ProductUncheckedCreateInputSchema ]),
  update: z.union([ ProductUpdateInputSchema, ProductUncheckedUpdateInputSchema ]),
}).strict();

export const ProductCreateManyArgsSchema: z.ZodType<Prisma.ProductCreateManyArgs> = z.object({
  data: z.union([ ProductCreateManyInputSchema, ProductCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const ProductCreateManyAndReturnArgsSchema: z.ZodType<Prisma.ProductCreateManyAndReturnArgs> = z.object({
  data: z.union([ ProductCreateManyInputSchema, ProductCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const ProductDeleteArgsSchema: z.ZodType<Prisma.ProductDeleteArgs> = z.object({
  select: ProductSelectSchema.optional(),
  include: ProductIncludeSchema.optional(),
  where: ProductWhereUniqueInputSchema, 
}).strict();

export const ProductUpdateArgsSchema: z.ZodType<Prisma.ProductUpdateArgs> = z.object({
  select: ProductSelectSchema.optional(),
  include: ProductIncludeSchema.optional(),
  data: z.union([ ProductUpdateInputSchema, ProductUncheckedUpdateInputSchema ]),
  where: ProductWhereUniqueInputSchema, 
}).strict();

export const ProductUpdateManyArgsSchema: z.ZodType<Prisma.ProductUpdateManyArgs> = z.object({
  data: z.union([ ProductUpdateManyMutationInputSchema, ProductUncheckedUpdateManyInputSchema ]),
  where: ProductWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const ProductUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.ProductUpdateManyAndReturnArgs> = z.object({
  data: z.union([ ProductUpdateManyMutationInputSchema, ProductUncheckedUpdateManyInputSchema ]),
  where: ProductWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const ProductDeleteManyArgsSchema: z.ZodType<Prisma.ProductDeleteManyArgs> = z.object({
  where: ProductWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const OrderCreateArgsSchema: z.ZodType<Prisma.OrderCreateArgs> = z.object({
  select: OrderSelectSchema.optional(),
  include: OrderIncludeSchema.optional(),
  data: z.union([ OrderCreateInputSchema, OrderUncheckedCreateInputSchema ]),
}).strict();

export const OrderUpsertArgsSchema: z.ZodType<Prisma.OrderUpsertArgs> = z.object({
  select: OrderSelectSchema.optional(),
  include: OrderIncludeSchema.optional(),
  where: OrderWhereUniqueInputSchema, 
  create: z.union([ OrderCreateInputSchema, OrderUncheckedCreateInputSchema ]),
  update: z.union([ OrderUpdateInputSchema, OrderUncheckedUpdateInputSchema ]),
}).strict();

export const OrderCreateManyArgsSchema: z.ZodType<Prisma.OrderCreateManyArgs> = z.object({
  data: z.union([ OrderCreateManyInputSchema, OrderCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const OrderCreateManyAndReturnArgsSchema: z.ZodType<Prisma.OrderCreateManyAndReturnArgs> = z.object({
  data: z.union([ OrderCreateManyInputSchema, OrderCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const OrderDeleteArgsSchema: z.ZodType<Prisma.OrderDeleteArgs> = z.object({
  select: OrderSelectSchema.optional(),
  include: OrderIncludeSchema.optional(),
  where: OrderWhereUniqueInputSchema, 
}).strict();

export const OrderUpdateArgsSchema: z.ZodType<Prisma.OrderUpdateArgs> = z.object({
  select: OrderSelectSchema.optional(),
  include: OrderIncludeSchema.optional(),
  data: z.union([ OrderUpdateInputSchema, OrderUncheckedUpdateInputSchema ]),
  where: OrderWhereUniqueInputSchema, 
}).strict();

export const OrderUpdateManyArgsSchema: z.ZodType<Prisma.OrderUpdateManyArgs> = z.object({
  data: z.union([ OrderUpdateManyMutationInputSchema, OrderUncheckedUpdateManyInputSchema ]),
  where: OrderWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const OrderUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.OrderUpdateManyAndReturnArgs> = z.object({
  data: z.union([ OrderUpdateManyMutationInputSchema, OrderUncheckedUpdateManyInputSchema ]),
  where: OrderWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const OrderDeleteManyArgsSchema: z.ZodType<Prisma.OrderDeleteManyArgs> = z.object({
  where: OrderWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const OrderItemCreateArgsSchema: z.ZodType<Prisma.OrderItemCreateArgs> = z.object({
  select: OrderItemSelectSchema.optional(),
  include: OrderItemIncludeSchema.optional(),
  data: z.union([ OrderItemCreateInputSchema, OrderItemUncheckedCreateInputSchema ]),
}).strict();

export const OrderItemUpsertArgsSchema: z.ZodType<Prisma.OrderItemUpsertArgs> = z.object({
  select: OrderItemSelectSchema.optional(),
  include: OrderItemIncludeSchema.optional(),
  where: OrderItemWhereUniqueInputSchema, 
  create: z.union([ OrderItemCreateInputSchema, OrderItemUncheckedCreateInputSchema ]),
  update: z.union([ OrderItemUpdateInputSchema, OrderItemUncheckedUpdateInputSchema ]),
}).strict();

export const OrderItemCreateManyArgsSchema: z.ZodType<Prisma.OrderItemCreateManyArgs> = z.object({
  data: z.union([ OrderItemCreateManyInputSchema, OrderItemCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const OrderItemCreateManyAndReturnArgsSchema: z.ZodType<Prisma.OrderItemCreateManyAndReturnArgs> = z.object({
  data: z.union([ OrderItemCreateManyInputSchema, OrderItemCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const OrderItemDeleteArgsSchema: z.ZodType<Prisma.OrderItemDeleteArgs> = z.object({
  select: OrderItemSelectSchema.optional(),
  include: OrderItemIncludeSchema.optional(),
  where: OrderItemWhereUniqueInputSchema, 
}).strict();

export const OrderItemUpdateArgsSchema: z.ZodType<Prisma.OrderItemUpdateArgs> = z.object({
  select: OrderItemSelectSchema.optional(),
  include: OrderItemIncludeSchema.optional(),
  data: z.union([ OrderItemUpdateInputSchema, OrderItemUncheckedUpdateInputSchema ]),
  where: OrderItemWhereUniqueInputSchema, 
}).strict();

export const OrderItemUpdateManyArgsSchema: z.ZodType<Prisma.OrderItemUpdateManyArgs> = z.object({
  data: z.union([ OrderItemUpdateManyMutationInputSchema, OrderItemUncheckedUpdateManyInputSchema ]),
  where: OrderItemWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const OrderItemUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.OrderItemUpdateManyAndReturnArgs> = z.object({
  data: z.union([ OrderItemUpdateManyMutationInputSchema, OrderItemUncheckedUpdateManyInputSchema ]),
  where: OrderItemWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const OrderItemDeleteManyArgsSchema: z.ZodType<Prisma.OrderItemDeleteManyArgs> = z.object({
  where: OrderItemWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const PaymentIntentCreateArgsSchema: z.ZodType<Prisma.PaymentIntentCreateArgs> = z.object({
  select: PaymentIntentSelectSchema.optional(),
  include: PaymentIntentIncludeSchema.optional(),
  data: z.union([ PaymentIntentCreateInputSchema, PaymentIntentUncheckedCreateInputSchema ]),
}).strict();

export const PaymentIntentUpsertArgsSchema: z.ZodType<Prisma.PaymentIntentUpsertArgs> = z.object({
  select: PaymentIntentSelectSchema.optional(),
  include: PaymentIntentIncludeSchema.optional(),
  where: PaymentIntentWhereUniqueInputSchema, 
  create: z.union([ PaymentIntentCreateInputSchema, PaymentIntentUncheckedCreateInputSchema ]),
  update: z.union([ PaymentIntentUpdateInputSchema, PaymentIntentUncheckedUpdateInputSchema ]),
}).strict();

export const PaymentIntentCreateManyArgsSchema: z.ZodType<Prisma.PaymentIntentCreateManyArgs> = z.object({
  data: z.union([ PaymentIntentCreateManyInputSchema, PaymentIntentCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const PaymentIntentCreateManyAndReturnArgsSchema: z.ZodType<Prisma.PaymentIntentCreateManyAndReturnArgs> = z.object({
  data: z.union([ PaymentIntentCreateManyInputSchema, PaymentIntentCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const PaymentIntentDeleteArgsSchema: z.ZodType<Prisma.PaymentIntentDeleteArgs> = z.object({
  select: PaymentIntentSelectSchema.optional(),
  include: PaymentIntentIncludeSchema.optional(),
  where: PaymentIntentWhereUniqueInputSchema, 
}).strict();

export const PaymentIntentUpdateArgsSchema: z.ZodType<Prisma.PaymentIntentUpdateArgs> = z.object({
  select: PaymentIntentSelectSchema.optional(),
  include: PaymentIntentIncludeSchema.optional(),
  data: z.union([ PaymentIntentUpdateInputSchema, PaymentIntentUncheckedUpdateInputSchema ]),
  where: PaymentIntentWhereUniqueInputSchema, 
}).strict();

export const PaymentIntentUpdateManyArgsSchema: z.ZodType<Prisma.PaymentIntentUpdateManyArgs> = z.object({
  data: z.union([ PaymentIntentUpdateManyMutationInputSchema, PaymentIntentUncheckedUpdateManyInputSchema ]),
  where: PaymentIntentWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const PaymentIntentUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.PaymentIntentUpdateManyAndReturnArgs> = z.object({
  data: z.union([ PaymentIntentUpdateManyMutationInputSchema, PaymentIntentUncheckedUpdateManyInputSchema ]),
  where: PaymentIntentWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const PaymentIntentDeleteManyArgsSchema: z.ZodType<Prisma.PaymentIntentDeleteManyArgs> = z.object({
  where: PaymentIntentWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const CustomerCreateArgsSchema: z.ZodType<Prisma.CustomerCreateArgs> = z.object({
  select: CustomerSelectSchema.optional(),
  data: z.union([ CustomerCreateInputSchema, CustomerUncheckedCreateInputSchema ]),
}).strict();

export const CustomerUpsertArgsSchema: z.ZodType<Prisma.CustomerUpsertArgs> = z.object({
  select: CustomerSelectSchema.optional(),
  where: CustomerWhereUniqueInputSchema, 
  create: z.union([ CustomerCreateInputSchema, CustomerUncheckedCreateInputSchema ]),
  update: z.union([ CustomerUpdateInputSchema, CustomerUncheckedUpdateInputSchema ]),
}).strict();

export const CustomerCreateManyArgsSchema: z.ZodType<Prisma.CustomerCreateManyArgs> = z.object({
  data: z.union([ CustomerCreateManyInputSchema, CustomerCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const CustomerCreateManyAndReturnArgsSchema: z.ZodType<Prisma.CustomerCreateManyAndReturnArgs> = z.object({
  data: z.union([ CustomerCreateManyInputSchema, CustomerCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const CustomerDeleteArgsSchema: z.ZodType<Prisma.CustomerDeleteArgs> = z.object({
  select: CustomerSelectSchema.optional(),
  where: CustomerWhereUniqueInputSchema, 
}).strict();

export const CustomerUpdateArgsSchema: z.ZodType<Prisma.CustomerUpdateArgs> = z.object({
  select: CustomerSelectSchema.optional(),
  data: z.union([ CustomerUpdateInputSchema, CustomerUncheckedUpdateInputSchema ]),
  where: CustomerWhereUniqueInputSchema, 
}).strict();

export const CustomerUpdateManyArgsSchema: z.ZodType<Prisma.CustomerUpdateManyArgs> = z.object({
  data: z.union([ CustomerUpdateManyMutationInputSchema, CustomerUncheckedUpdateManyInputSchema ]),
  where: CustomerWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const CustomerUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.CustomerUpdateManyAndReturnArgs> = z.object({
  data: z.union([ CustomerUpdateManyMutationInputSchema, CustomerUncheckedUpdateManyInputSchema ]),
  where: CustomerWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const CustomerDeleteManyArgsSchema: z.ZodType<Prisma.CustomerDeleteManyArgs> = z.object({
  where: CustomerWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const OutboxEventCreateArgsSchema: z.ZodType<Prisma.OutboxEventCreateArgs> = z.object({
  select: OutboxEventSelectSchema.optional(),
  data: z.union([ OutboxEventCreateInputSchema, OutboxEventUncheckedCreateInputSchema ]),
}).strict();

export const OutboxEventUpsertArgsSchema: z.ZodType<Prisma.OutboxEventUpsertArgs> = z.object({
  select: OutboxEventSelectSchema.optional(),
  where: OutboxEventWhereUniqueInputSchema, 
  create: z.union([ OutboxEventCreateInputSchema, OutboxEventUncheckedCreateInputSchema ]),
  update: z.union([ OutboxEventUpdateInputSchema, OutboxEventUncheckedUpdateInputSchema ]),
}).strict();

export const OutboxEventCreateManyArgsSchema: z.ZodType<Prisma.OutboxEventCreateManyArgs> = z.object({
  data: z.union([ OutboxEventCreateManyInputSchema, OutboxEventCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const OutboxEventCreateManyAndReturnArgsSchema: z.ZodType<Prisma.OutboxEventCreateManyAndReturnArgs> = z.object({
  data: z.union([ OutboxEventCreateManyInputSchema, OutboxEventCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const OutboxEventDeleteArgsSchema: z.ZodType<Prisma.OutboxEventDeleteArgs> = z.object({
  select: OutboxEventSelectSchema.optional(),
  where: OutboxEventWhereUniqueInputSchema, 
}).strict();

export const OutboxEventUpdateArgsSchema: z.ZodType<Prisma.OutboxEventUpdateArgs> = z.object({
  select: OutboxEventSelectSchema.optional(),
  data: z.union([ OutboxEventUpdateInputSchema, OutboxEventUncheckedUpdateInputSchema ]),
  where: OutboxEventWhereUniqueInputSchema, 
}).strict();

export const OutboxEventUpdateManyArgsSchema: z.ZodType<Prisma.OutboxEventUpdateManyArgs> = z.object({
  data: z.union([ OutboxEventUpdateManyMutationInputSchema, OutboxEventUncheckedUpdateManyInputSchema ]),
  where: OutboxEventWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const OutboxEventUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.OutboxEventUpdateManyAndReturnArgs> = z.object({
  data: z.union([ OutboxEventUpdateManyMutationInputSchema, OutboxEventUncheckedUpdateManyInputSchema ]),
  where: OutboxEventWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const OutboxEventDeleteManyArgsSchema: z.ZodType<Prisma.OutboxEventDeleteManyArgs> = z.object({
  where: OutboxEventWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const AiUsageLogCreateArgsSchema: z.ZodType<Prisma.AiUsageLogCreateArgs> = z.object({
  select: AiUsageLogSelectSchema.optional(),
  data: z.union([ AiUsageLogCreateInputSchema, AiUsageLogUncheckedCreateInputSchema ]),
}).strict();

export const AiUsageLogUpsertArgsSchema: z.ZodType<Prisma.AiUsageLogUpsertArgs> = z.object({
  select: AiUsageLogSelectSchema.optional(),
  where: AiUsageLogWhereUniqueInputSchema, 
  create: z.union([ AiUsageLogCreateInputSchema, AiUsageLogUncheckedCreateInputSchema ]),
  update: z.union([ AiUsageLogUpdateInputSchema, AiUsageLogUncheckedUpdateInputSchema ]),
}).strict();

export const AiUsageLogCreateManyArgsSchema: z.ZodType<Prisma.AiUsageLogCreateManyArgs> = z.object({
  data: z.union([ AiUsageLogCreateManyInputSchema, AiUsageLogCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const AiUsageLogCreateManyAndReturnArgsSchema: z.ZodType<Prisma.AiUsageLogCreateManyAndReturnArgs> = z.object({
  data: z.union([ AiUsageLogCreateManyInputSchema, AiUsageLogCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const AiUsageLogDeleteArgsSchema: z.ZodType<Prisma.AiUsageLogDeleteArgs> = z.object({
  select: AiUsageLogSelectSchema.optional(),
  where: AiUsageLogWhereUniqueInputSchema, 
}).strict();

export const AiUsageLogUpdateArgsSchema: z.ZodType<Prisma.AiUsageLogUpdateArgs> = z.object({
  select: AiUsageLogSelectSchema.optional(),
  data: z.union([ AiUsageLogUpdateInputSchema, AiUsageLogUncheckedUpdateInputSchema ]),
  where: AiUsageLogWhereUniqueInputSchema, 
}).strict();

export const AiUsageLogUpdateManyArgsSchema: z.ZodType<Prisma.AiUsageLogUpdateManyArgs> = z.object({
  data: z.union([ AiUsageLogUpdateManyMutationInputSchema, AiUsageLogUncheckedUpdateManyInputSchema ]),
  where: AiUsageLogWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const AiUsageLogUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.AiUsageLogUpdateManyAndReturnArgs> = z.object({
  data: z.union([ AiUsageLogUpdateManyMutationInputSchema, AiUsageLogUncheckedUpdateManyInputSchema ]),
  where: AiUsageLogWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const AiUsageLogDeleteManyArgsSchema: z.ZodType<Prisma.AiUsageLogDeleteManyArgs> = z.object({
  where: AiUsageLogWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const FeatureFlagCreateArgsSchema: z.ZodType<Prisma.FeatureFlagCreateArgs> = z.object({
  select: FeatureFlagSelectSchema.optional(),
  data: z.union([ FeatureFlagCreateInputSchema, FeatureFlagUncheckedCreateInputSchema ]),
}).strict();

export const FeatureFlagUpsertArgsSchema: z.ZodType<Prisma.FeatureFlagUpsertArgs> = z.object({
  select: FeatureFlagSelectSchema.optional(),
  where: FeatureFlagWhereUniqueInputSchema, 
  create: z.union([ FeatureFlagCreateInputSchema, FeatureFlagUncheckedCreateInputSchema ]),
  update: z.union([ FeatureFlagUpdateInputSchema, FeatureFlagUncheckedUpdateInputSchema ]),
}).strict();

export const FeatureFlagCreateManyArgsSchema: z.ZodType<Prisma.FeatureFlagCreateManyArgs> = z.object({
  data: z.union([ FeatureFlagCreateManyInputSchema, FeatureFlagCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const FeatureFlagCreateManyAndReturnArgsSchema: z.ZodType<Prisma.FeatureFlagCreateManyAndReturnArgs> = z.object({
  data: z.union([ FeatureFlagCreateManyInputSchema, FeatureFlagCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const FeatureFlagDeleteArgsSchema: z.ZodType<Prisma.FeatureFlagDeleteArgs> = z.object({
  select: FeatureFlagSelectSchema.optional(),
  where: FeatureFlagWhereUniqueInputSchema, 
}).strict();

export const FeatureFlagUpdateArgsSchema: z.ZodType<Prisma.FeatureFlagUpdateArgs> = z.object({
  select: FeatureFlagSelectSchema.optional(),
  data: z.union([ FeatureFlagUpdateInputSchema, FeatureFlagUncheckedUpdateInputSchema ]),
  where: FeatureFlagWhereUniqueInputSchema, 
}).strict();

export const FeatureFlagUpdateManyArgsSchema: z.ZodType<Prisma.FeatureFlagUpdateManyArgs> = z.object({
  data: z.union([ FeatureFlagUpdateManyMutationInputSchema, FeatureFlagUncheckedUpdateManyInputSchema ]),
  where: FeatureFlagWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const FeatureFlagUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.FeatureFlagUpdateManyAndReturnArgs> = z.object({
  data: z.union([ FeatureFlagUpdateManyMutationInputSchema, FeatureFlagUncheckedUpdateManyInputSchema ]),
  where: FeatureFlagWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const FeatureFlagDeleteManyArgsSchema: z.ZodType<Prisma.FeatureFlagDeleteManyArgs> = z.object({
  where: FeatureFlagWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();