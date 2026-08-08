# معماری بک‌اند Saite — سند مرجع

> **نوع سند:** طراحی معماری + runbook استقرار  
> **وضعیت فرانت‌اند:** فاز ۸ — mock کامل، ۶۴۹ تست سبز، RBAC/CSP/E2E اجرا شده  
> **هدف:** اتصال بک‌اند واقعی (Prisma+Postgres+Redis) بدون شکستن هیچ‌کدام از قراردادهای موجود  
> **زبان:** فارسی — سطح تخصصی  
> **آخرین به‌روزرسانی:** ۸ اوت ۲۰۲۶

---

## فهرست

1. [خلاصهٔ اجرایی](#۱-خلاصهٔ-اجرایی)
2. [تصمیمات معماری](#۲-تصمیمات-معماری)
3. [محدودیت‌های VPS ۸GB و trade-offها](#۳-محدودیتهای-vps-۸gb-و-trade-offها)
4. [ساختار پوشه‌ها](#۴-ساختار-پوشهها)
5. [Prisma Schema پیشنهادی](#۵-prisma-schema-پیشنهادی)
6. [AI Gateway Design](#۶-ai-gateway-design)
7. [Docker Compose Production](#۷-docker-compose-production)
8. [Nginx Config](#۸-nginx-config)
9. [درگاه پرداخت ایرانی](#۹-درگاه-پرداخت-ایرانی)
10. [مسیر مهاجرت (C0–C9)](#۱۰-مسیر-مهاجرت-c0c9)
11. [Deployment Runbook](#۱۱-deployment-runbook)
12. [Monitoring & Backup Strategy](#۱۲-monitoring--backup-strategy)
13. [Path به مدل محلی (Ollama)](#۱۳-path-به-مدل-محلی-ollama)
14. [Trade-offs و ممنوعیت‌های آینده](#۱۴-trade-offs-و-ممنوعیتهای-آینده)

---

## ۱) خلاصهٔ اجرایی

معماری **Modular Monolith درون همان پروژهٔ Next.js** است — نه میکروسرویس، نه سرور جدا. هر دامنهٔ کسب‌وکار (`products`، `orders`، `finance`، …) یک ماژول خودکفا با لایه‌های `schema → repository → service → route` دارد. دامنه‌ها فقط از طریق **Event Bus داخلی (Outbox Pattern روی Postgres)** با هم حرف می‌زنند.

**استک قطعی:**
- Next.js ۱۶ App Router + Route Handlers
- Prisma ORM + `zod-prisma-types` + pgvector
- PostgreSQL ۱۶ + Redis ۷ (۵۱۲MB maxmemory)
- BullMQ برای background jobs
- Docker Compose (dev + prod)
- Nginx reverse proxy + Let's Encrypt

**AI:**
- فاز ۱: Claude API (primary) + OpenAI embeddings (fallback) — SDK مستقیم، بدون Vercel AI SDK
- فاز ۲: FastAPI sidecar + Ollama (profile جدا در Docker Compose)
- فاز ۳: مدل محلی fine-tune شده روی دادهٔ چت واقعی

**Graceful Degradation:** هر سرویس خارجی (پرداخت، ایمیل، SMS، AI) یک حالت Mock/Console پیش‌فرض دارد. بدون هیچ API key، سیستم بالا می‌آید و لاگ می‌کند.

---

## ۲) تصمیمات معماری

| # | تصمیم | انتخاب | دلیل |
|---:|---|---|---|
| ۱ | معماری کلی | Modular Monolith در Next.js | یک VPS، یک تیم کوچک، یک container کمتر |
| ۲ | ORM | Prisma + `zod-prisma-types` | انتخاب صریح کاربر؛ type-safety end-to-end؛ تیم تازه‌کار |
| ۳ | API Layer | Next.js Route Handlers | `src/lib/api.ts` از قبل روی همین فرض ساخته شده |
| ۴ | Background Jobs | BullMQ + Redis | سبک، بالغ، یک instance هم cache هم queue |
| ۵ | Cache | Redis (همان instance) | `maxmemory=512MB` + `allkeys-lru` — محدودیت VPS |
| ۶ | Database | PostgreSQL ۱۶ + pgvector | روابط قوی + JSONB + جستجوی معنایی بدون DB دوم |
| ۷ | Process Manager | PM2 cluster mode (۲ worker) | روی ۲ vCPU، ۲ worker بهینه‌تر از ۳ |
| ۸ | Reverse Proxy | Nginx + Let's Encrypt | استاندارد، سبک، rate-limit لایهٔ شبکه |
| ۹ | AI Primary | `@anthropic-ai/sdk` مستقیم | فقط ۲ provider در فاز ۱؛ abstraction عمومی سربار است |
| ۱۰ | AI Embeddings | `openai` SDK مستقیم | Anthropic embedding عمومی ندارد |
| ۱۱ | پرداخت | Zarinpal (primary) + IDPay (secondary) | رایج‌ترین درگاه‌های ایران |
| ۱۲ | ایمیل فاز ۱ | `ConsoleMailProvider` | بدون وابستگی SaaS خارجی |
| ۱۳ | SMS | Kavenegar/Melipayamak پشت interface | گیت‌وی داخلی ایران |
| ۱۴ | Storage | ArvanCloud Object Storage (S3-compatible) | ریسک جغرافیایی کمتر از Vercel Blob |
| ۱۵ | Monitoring فاز ۱ | UptimeRobot + `docker stats` + Pino JSONL | روی ۸GB، Prometheus/Grafana سربار است |
| ۱۶ | Feature Flags | جدول DB ساده + Redis cache | برای تعداد کم flag، SaaS overkill است |
| ۱۷ | Auth مشتری | HMAC session مشابه ادمین | الگوی موجود بالغ است؛ NextAuth = دو سیستم موازی |
| ۱۸ | Test Integration | Postgres test instance دستی | Testcontainers وابستگی سنگین برای تیم تازه‌کار |

---

## ۳) محدودیت‌های VPS ۸GB و trade-offها

### بودجهٔ RAM

| سرویس | سقف تنظیم‌شده | توضیح |
|---|---|---|
| app (Next.js + PM2 × ۲) | ۲.۵GB | هر worker ~۹۰۰MB max |
| worker (BullMQ) | ۰.۸GB | concurrency ≤ ۳ |
| postgres | ۲GB | shared_buffers = ۱GB |
| redis | ۰.۶GB | maxmemory = ۵۱۲MB |
| nginx + OS + buffer | ~۲GB | شامل ۲GB swap |
| **جمع** | **~۵.۹GB از ۸GB** | حاشیهٔ امن برای spike |

### نتیجهٔ بحرانی

**Ollama + Llama 3.1 8B (۴-bit ~۶GB) روی همین VPS در فاز ۱ جا نمی‌شود.** پس:
- فاز ۱: Claude API (هزینهٔ ماهانه ~۴۰-۲۰۰ هزار تومان)
- فاز ۲: sidecar فقط با `docker compose --profile ai up` — وقتی VPS ارتقا یافت یا سرور جدا خریدی

### محدودیت SSD ۴۰GB

| مورد | سیاست |
|---|---|
| log rotation | max ۵۰۰MB total |
| Docker image cleanup | هفتگی `docker system prune -f` |
| فایل بزرگ | ArvanCloud (نه MinIO محلی) |
| backup | pg_dump به S3 خارجی (نه روی همان دیسک) |

---

## ۴) ساختار پوشه‌ها

```
saite/
├── src/
│   ├── app/
│   │   ├── admin/(panel)/...          # ✅ بدون تغییر
│   │   └── api/                       # Route Handlers — لایهٔ نازک HTTP
│   │       ├── products/
│   │       │   ├── route.ts           # GET (list) / POST (create)
│   │       │   ├── [id]/route.ts      # GET / PATCH / DELETE
│   │       │   └── by-slug/[slug]/route.ts
│   │       ├── orders/...
│   │       ├── payments/
│   │       │   ├── route.ts
│   │       │   └── webhook/zarinpal/route.ts
│   │       ├── customers/session/route.ts   # auth مشتری
│   │       ├── uploads/route.ts       # presigned URL
│   │       ├── ai/
│   │       │   ├── search/route.ts    # جستجوی معنایی (sync)
│   │       │   ├── chat/route.ts      # چت‌بات (streaming)
│   │       │   └── admin-assist/route.ts
│   │       ├── health/route.ts        # برای UptimeRobot
│   │       └── webhooks/sidecar/route.ts    # نتیجهٔ async Python
│   │
│   ├── server/                        # منطق سرور-فقط
│   │   ├── shared/
│   │   │   ├── db.ts                  # Prisma singleton + pool
│   │   │   ├── logger.ts              # Pino JSONL + traceId
│   │   │   ├── event-bus.ts           # publish/subscribe + outbox
│   │   │   ├── cache.ts               # Redis client + cache-aside
│   │   │   ├── feature-flags.ts       # isEnabled(key, ctx)
│   │   │   ├── rate-limit.ts          # distributed Redis
│   │   │   └── errors.ts              # NotFoundError, ValidationError, ...
│   │   │
│   │   ├── modules/                   # هر دامنه یک پوشه
│   │   │   ├── products/
│   │   │   │   ├── repository.ts      # فقط query — بدون business logic
│   │   │   │   ├── service.ts         # business logic + event publish
│   │   │   │   ├── events.ts          # تایپ رویدادهای این دامنه
│   │   │   │   └── __tests__/
│   │   │   ├── orders/
│   │   │   ├── inventory/
│   │   │   ├── finance/
│   │   │   ├── customers/
│   │   │   ├── shipping/
│   │   │   ├── payments/
│   │   │   ├── marketing/
│   │   │   ├── communications/
│   │   │   ├── content/
│   │   │   └── reports/
│   │   │
│   │   ├── auth/
│   │   │   ├── admin-session.ts       # wrapper روی src/lib/auth/server موجود
│   │   │   ├── customer-session.ts    # همان الگو HMAC، برای مشتری
│   │   │   └── service-account.ts     # برای AI worker/sidecar
│   │   │
│   │   ├── ai/
│   │   │   ├── gateway.ts             # نقطهٔ ورود یکسان
│   │   │   ├── providers/
│   │   │   │   ├── anthropic.ts       # Claude primary
│   │   │   │   ├── openai.ts          # embeddings + fallback chat
│   │   │   │   ├── mock.ts            # graceful degradation
│   │   │   │   └── ollama.ts          # 🚧 stub — فاز ۲
│   │   │   ├── prompts/
│   │   │   │   ├── product-seo.v1.ts
│   │   │   │   ├── support-chat.v1.ts
│   │   │   │   └── admin-assist.v1.ts
│   │   │   ├── features/
│   │   │   │   ├── product-seo/subscriber.ts
│   │   │   │   ├── semantic-search/
│   │   │   │   ├── support-chat/
│   │   │   │   └── admin-assist/
│   │   │   ├── cost-tracker.ts
│   │   │   ├── safety.ts              # PII redaction + injection detect
│   │   │   └── python-bridge.ts       # 🚧 stub — فاز ۲
│   │   │
│   │   ├── jobs/
│   │   │   ├── queue-registry.ts
│   │   │   ├── email.processor.ts
│   │   │   ├── sms.processor.ts
│   │   │   ├── search-index.processor.ts
│   │   │   ├── ai-async.processor.ts
│   │   │   └── outbox-dispatcher.processor.ts
│   │   │
│   │   ├── payments/
│   │   │   ├── gateway.ts             # resolve provider + fallback
│   │   │   └── providers/
│   │   │       ├── zarinpal.ts
│   │   │       ├── idpay.ts
│   │   │       └── mock.ts
│   │   │
│   │   ├── mail/
│   │   │   ├── contract.ts
│   │   │   └── providers/{console.ts, smtp.ts}
│   │   │
│   │   ├── sms/
│   │   │   ├── contract.ts
│   │   │   └── providers/{console.ts, kavenegar.ts}
│   │   │
│   │   └── storage/
│   │       ├── contract.ts
│   │       └── providers/{local-disk.ts, s3-arvan.ts}
│   │
│   ├── lib/                           # ✅ بدون تغییر ساختاری
│   │   ├── api.ts                     # ✅ امضای ثابت
│   │   ├── api-client.ts              # ✅ بدون تغییر
│   │   ├── {finance,orders,...}/
│   │   │   ├── mock-adapter.ts        # ✅ دست‌نخورده
│   │   │   └── http-adapter.ts        # 🆕 صدا زدن /api/<domain>
│   │   └── auth/rbac.ts               # ✅ بدون تغییر
│   │
│   ├── domain/commerce.ts             # ✅ بدون تغییر
│   └── types/                         # ✅ بدون تغییر دستی
│
├── prisma/
│   ├── schema.prisma                  # تعریف مرکزی مدل‌ها + pgvector
│   └── migrations/
│
├── services/
│   └── ai-sidecar/                    # 🚧 فاز ۲ — FastAPI + Ollama
│       ├── main.py
│       ├── models/
│       ├── requirements.txt
│       └── Dockerfile
│
├── deploy/
│   ├── docker-compose.dev.yml         # Postgres + Redis + MinIO محلی
│   ├── docker-compose.prod.yml        # بهینه ۸GB RAM
│   ├── Dockerfile.app                 # Next.js + PM2 (۲ worker)
│   ├── Dockerfile.worker              # BullMQ worker
│   ├── nginx.conf                     # rate-limit + SSL
│   ├── ecosystem.config.js
│   └── scripts/
│       ├── backup.sh
│       ├── restore-drill.sh
│       └── deploy.sh
│
├── tests/
│   ├── integration/modules/...
│   └── lib/, store/, components/      # ✅ بدون تغییر
│
└── docs/
    └── BACKEND-ARCHITECTURE.md        # ← همین سند
```

**قواعد import:**
- `src/server/` هرگز از `src/app/*.tsx` (Client/Server Components UI) import نمی‌شود مستقیم — فقط از `src/app/api/**/route.ts`
- هر ماژول فقط به `shared/` و `domain/commerce.ts` وابسته است، هرگز مستقیم به ماژول دیگر query نمی‌زند

---

## ۵) Prisma Schema پیشنهادی

برگرفته از `src/types/product.ts` + `src/types/finance.ts` + `src/types/payment.ts` + `src/types/customer.ts`.

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

generator zod {
  provider = "zod-prisma-types"
  output   = "./zod"
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [vector]
}

// ── محصولات ──────────────────────────────────────────

model Product {
  id             String   @id @default(cuid())
  slug           String   @unique
  name           String
  brand          String
  model          String
  sku            String   @unique
  category       String
  subCategory    String?
  priceType      PriceType
  price          Int?     // ریال، عدد صحیح
  compareAtPrice Int?
  stockStatus    StockStatus
  images         String[] @default([])
  shortDescription String
  description    String?
  keyFeatures    String[] @default([])
  specs          Json?    // Spec[]
  technology     String?
  colorSupport   String?
  usageClass     String?
  warrantyMonths Int?
  condition      ProductCondition
  compatibleWith String[] @default([])
  consumables    String[] @default([])
  isFeatured     Boolean  @default(false)
  isBestSeller   Boolean  @default(false)
  embedding      Unsupported("vector(1536)")?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  orderItems     OrderItem[]
  @@map("products")
}

enum PriceType      { fixed quote_only }
enum StockStatus    { in_stock low_stock out_of_stock on_request }
enum ProductCondition { new refurbished }

// ── سفارشات ──────────────────────────────────────────

model Order {
  id            String      @id @default(cuid())
  customerId    String
  status        OrderStatus @default(pending)
  totalAmount   Int
  currency      String      @default("IRR")
  shippingAddress Json?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  items         OrderItem[]
  paymentIntents PaymentIntent[]
  @@map("orders")
}

model OrderItem {
  id        String @id @default(cuid())
  orderId   String
  productId String
  quantity  Int
  unitPrice Int
  order     Order   @relation(fields: [orderId], references: [id])
  product   Product @relation(fields: [productId], references: [id])
  @@map("order_items")
}

enum OrderStatus {
  pending
  paid
  processing
  shipped
  delivered
  cancelled
  refunded
}

// ── پرداخت ───────────────────────────────────────────

model PaymentIntent {
  id             String            @id @default(cuid())
  orderId        String
  providerCode   String
  amount         Int
  currency       String
  status         PaymentIntentStatus @default(created)
  idempotencyKey String            @unique
  authority      String?           @unique
  transactionId  String?
  redirectUrl    String?
  failureCode    String?
  failureMessage String?
  createdAt      DateTime          @default(now())
  expiresAt      DateTime
  verifiedAt     DateTime?

  order Order @relation(fields: [orderId], references: [id])
  @@map("payment_intents")
}

enum PaymentIntentStatus {
  created
  redirect_required
  pending
  succeeded
  failed
  cancelled
  expired
  refunded
  partially_refunded
  chargeback
}

// ── مشتریان ──────────────────────────────────────────

model Customer {
  id        String   @id @default(cuid())
  email     String   @unique
  phone     String?
  name      String
  metadata  Json?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("customers")
}

// ── رویدادها (Outbox Pattern) ────────────────────────

model OutboxEvent {
  id          String   @id @default(cuid())
  type        String
  payload     Json
  aggregateId String
  processedAt DateTime?
  retryCount  Int      @default(0)
  createdAt   DateTime @default(now())

  @@index([processedAt, createdAt])
  @@map("outbox_events")
}

// ── لاگ AI ────────────────────────────────────────────

model AiUsageLog {
  id                String   @id @default(cuid())
  feature           String
  promptVersion     String
  provider          String
  model             String
  actorId           String
  inputTokens       Int
  outputTokens      Int
  estimatedCostRial Int?
  durationMs        Int
  status            String   // success | error | fallback
  gitSha            String?
  createdAt         DateTime @default(now())

  @@index([feature, createdAt])
  @@map("ai_usage_logs")
}

// ── feature flags ─────────────────────────────────────

model FeatureFlag {
  key                String   @id
  enabled            Boolean  @default(false)
  rolloutPercentage  Int      @default(100)
  allowedRoles       String[] @default([])
  updatedAt          DateTime @updatedAt

  @@map("feature_flags")
}
```

> **نکته pgvector:** ستون `vector` هنوز native در Prisma پشتیبانی نمی‌شود. عملیات شباهت (`<=>`) با `$queryRaw` نوشته می‌شود — این محدودیت پذیرفته‌شده است.

---

## ۶) AI Gateway Design

### ۶.۱ Abstraction

`src/server/ai/gateway.ts` تنها نقطهٔ ورود است. هیچ فایل دیگری مستقیم SDK provider را import نمی‌کند.

```ts
// src/server/ai/gateway.ts
import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { getPromptTemplate } from './prompts/registry'
import { trackCost } from './cost-tracker'
import { redactPII, detectInjection } from './safety'
import { mockChatResponse, mockEmbedding } from './providers/mock'

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ httpAgent: process.env.HTTPS_PROXY ? new ProxyAgent(process.env.HTTPS_PROXY) : undefined })
  : null

const openai = process.env.OPENAI_API_KEY ? new OpenAI() : null

export async function callChat(opts: ChatCallOptions) {
  if (detectInjection(opts.variables)) throw new AiSafetyError('ورودی مشکوک')
  const template = getPromptTemplate(opts.feature, opts.promptVersion)
  const prompt = template.render(redactPII(opts.variables))

  if (!anthropic) return mockChatResponse(opts)

  const started = Date.now()
  try {
    const result = await anthropic.messages.create({
      model: 'claude-sonnet-4',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
      tools: opts.tools,
    })
    await trackCost({ feature: opts.feature, provider: 'anthropic', model: 'claude-sonnet-4',
      usage: result.usage, durationMs: Date.now() - started, actorId: opts.actorId,
      promptVersion: template.version, gitSha: process.env.GIT_SHA })
    return result
  } catch (err) {
    return fallbackToOpenAi(opts, err)
  }
}

export async function callEmbedding(text: string) {
  if (!openai) return mockEmbedding()
  const res = await openai.embeddings.create({ model: 'text-embedding-3-small', input: text })
  return res.data[0].embedding
}
```

### ۶.۲ Prompt Versioning

هر prompt یک فایل TypeScript در git:

```ts
// src/server/ai/prompts/product-seo.v1.ts
export default {
  id: 'product-seo',
  version: 'v1',
  status: 'active', // draft | active | deprecated
  render: (vars: { productName: string; category: string }) =>
    `شما دستیار سئوی فروشگاه فارسی هستید... محصول: ${vars.productName}`,
}
```

نسخهٔ قبلی هرگز حذف نمی‌شود — فقط `status: 'deprecated'` می‌شود. `gitSha` در `ai_usage_logs` قابلیت reproduce کامل را تضمین می‌کند.

### ۶.۳ فازبندی

| فاز | زمان | محتوا |
|---|---|---|
| ۱ | الان | Claude API + OpenAI embeddings + product-seo async + cost tracker |
| ۲ | ۶-۱۲ ماه | FastAPI sidecar + Ollama (profile جدا) — فقط وقتی VPS ارتقا یافت |
| ۳ | ۱۲-۲۴ ماه | مدل محلی fine-tune شده روی دادهٔ چت واقعی |

### ۶.۴ VPN/Proxy برای Anthropic

متغیر محیطی `HTTPS_PROXY` در `.env.production` تنظیم شود. `@anthropic-ai/sdk` از `undici` استفاده می‌کند که `ProxyAgent` می‌پذیرد. **کد اپلیکیشن هیچ شرط جغرافیایی ندارد.**

---

## ۷) Docker Compose Production

### ۷.۱ `docker-compose.prod.yml`

```yaml
version: "3.8"

services:
  app:
    build: { context: .., dockerfile: deploy/Dockerfile.app }
    restart: unless-stopped
    env_file: .env.production
    depends_on: [postgres, redis]
    deploy:
      resources:
        limits: { memory: 2.5G, cpus: "1.2" }
    logging:
      driver: json-file
      options: { max-size: "50m", max-file: "5" }

  worker:
    build: { context: .., dockerfile: deploy/Dockerfile.worker }
    restart: unless-stopped
    env_file: .env.production
    depends_on: [postgres, redis]
    deploy:
      resources:
        limits: { memory: 800M, cpus: "0.5" }
    logging:
      driver: json-file
      options: { max-size: "50m", max-file: "5" }

  postgres:
    image: registry.arvancloud.ir/library/postgres:16-alpine
    restart: unless-stopped
    env_file: .env.production
    command:
      - "postgres"
      - "-c"
      - "shared_buffers=1GB"
      - "-c"
      - "effective_cache_size=3GB"
      - "-c"
      - "maintenance_work_mem=256MB"
      - "-c"
      - "max_connections=60"
      - "-c"
      - "wal_compression=on"
    volumes:
      - pgdata:/var/lib/postgresql/data
    deploy:
      resources:
        limits: { memory: 2G, cpus: "0.8" }
    logging:
      driver: json-file
      options: { max-size: "50m", max-file: "5" }

  redis:
    image: registry.arvancloud.ir/library/redis:7-alpine
    restart: unless-stopped
    command:
      [
        "redis-server",
        "--maxmemory", "512mb",
        "--maxmemory-policy", "allkeys-lru",
        "--save", "60", "100",
      ]
    volumes:
      - redisdata:/data
    deploy:
      resources:
        limits: { memory: 600M, cpus: "0.3" }
    logging:
      driver: json-file
      options: { max-size: "20m", max-file: "3" }

  # profile اختیاری — فاز ۲
  ai-sidecar:
    build: { context: ../services/ai-sidecar }
    profiles: ["ai"]
    restart: unless-stopped
    deploy:
      resources:
        limits: { memory: 6.5G, cpus: "1.5" }

volumes:
  pgdata:
  redisdata:
```

### ۷.۲ `Dockerfile.app`

```dockerfile
FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
RUN npm install -g pm2
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma
COPY deploy/ecosystem.config.js ./
EXPOSE 3000
CMD ["pm2-runtime", "start", "ecosystem.config.js"]
```

### ۷.۳ `ecosystem.config.js`

```js
module.exports = {
  apps: [{
    name: 'saite-app',
    script: 'server.js',
    instances: 2,
    exec_mode: 'cluster',
    max_memory_restart: '900M',
    env: { PORT: 3000 },
  }],
}
```

---

## ۸) Nginx Config

```nginx
# deploy/nginx.conf

limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=admin_login:10m rate=3r/m;
limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

upstream app {
    server app:3000;
}

server {
    listen 443 ssl http2;
    server_name saite.local;  # ← با دامنهٔ واقعی جایگزین شود

    ssl_certificate     /etc/letsencrypt/live/saite.local/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/saite.local/privkey.pem;

    limit_conn conn_limit 20;

    location /admin/login {
        limit_req zone=admin_login burst=2 nodelay;
        proxy_pass http://app;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /api/ {
        limit_req zone=general burst=20 nodelay;
        proxy_pass http://app;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location / {
        limit_req zone=general burst=30 nodelay;
        proxy_pass http://app;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

server {
    listen 80;
    server_name saite.local;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 301 https://$host$request_uri; }
}
```

---

## ۹) درگاه پرداخت ایرانی

### ۹.۱ Provider Interface (موجود در repo)

`src/lib/payments/provider-contract.ts` از قبل تعریف شده:

```ts
export interface PaymentGatewayAdapter {
  createPayment(provider: PaymentProvider, input: CreatePaymentInput): Promise<CreatePaymentResult>
  verifyPayment(provider: PaymentProvider, authority: string, amount: number): Promise<VerifyPaymentResult>
  refundPayment(provider: PaymentProvider, authority: string, amount: number): Promise<RefundPaymentResult>
  healthCheck(provider: PaymentProvider): Promise<'healthy' | 'degraded' | 'down'>
}
```

### ۹.۲ Order State Machine

```
pending ──▶ paid ──▶ processing ──▶ shipped ──▶ delivered
   │                                              │
   └──▶ cancelled                          refunded ◀──┘
```

### ۹.۳ Idempotency

```prisma
model PaymentIntent {
  id             String @id @default(cuid())
  authority      String? @unique   // 🔑 جلوگیری از پردازش دوباره
  idempotencyKey String @unique   // 🔑 کلاینت می‌تواند retry کند بدون دوبله
  ...
}
```

### ۹.۴ Graceful Degradation

| متغیر محیطی | با مقدار | بدون مقدار (پیش‌فرض) |
|---|---|---|
| `ZARINPAL_MERCHANT_ID` | Zarinpal واقعی | `MockPaymentProvider` — همیشه success + log |
| `IDPAY_API_KEY` | IDPay واقعی | نادیده گرفته می‌شود |

---

## ۱۰) مسیر مهاجرت (C0–C9)

| کد | محتوا | تخمین | verify |
|---|---|---|---|
| **C0** | Infrastructure: Docker Compose dev/prod, Prisma init, health check, `.env.example`, CI job `prisma-generate` | ۱۶-۲۰h | ✅ |
| **C1** | Products module: schema, repo, service, route, seed از `mock-data.ts` | ۱۲-۱۶h | ✅ |
| **C2** | Customer auth: HMAC session مشابه ادمین | ۱۰-۱۴h | ✅ |
| **C3** | Orders + Inventory + state machine | ۱۶-۲۰h | ✅ |
| **C4** | Payments: Zarinpal + webhook + idempotency | ۱۲-۱۶h | ✅ |
| **C5** | AI فاز ۱: Claude API + embeddings + product-seo async + cost tracker | ۱۲-۱۶h | ✅ |
| **C6** | Finance + Shipping + Marketing + Comms + Content | ۱۶-۲۰h | ✅ |
| **C7** | Background jobs: email/SMS + outbox dispatcher + BullMQ Board | ۱۰-۱۴h | ✅ |
| **C8** | Upload: S3-compatible + image optimization | ۸-۱۲h | ✅ |
| **C9** | Production deploy: VPS + SSL + backup + UptimeRobot | ۸-۱۲h | ✅ |

**مجموع: ~۱۲۰-۱۶۰ ساعت**

قاعدهٔ هر گام:
1. `npm run type-check && npm run lint && npm test && npm run build`
2. commit فارسی
3. push به `arena/019fe061-saite`

---

## ۱۱) Deployment Runbook

### ۱۱.۱ نصب Docker روی VPS

```bash
# Ubuntu 22.04/24.04
sudo apt update
sudo apt install -y docker.io docker-compose-plugin
sudo usermod -aG docker $USER
newgrp docker
docker --version
```

### ۱۱.۲ swap file اجباری

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### ۱۱.۳ clone و deploy

```bash
git clone https://github.com/parssystem1-coder/saite.git
cd saite
cp .env.example .env.production
# ← ویرایش .env.production با مقادیر واقعی

cd deploy
docker compose -f docker-compose.prod.yml up -d --build
```

### ۱۱.۴ SSL (Let's Encrypt)

```bash
sudo apt install -y certbot
sudo certbot --nginx -d your-domain.ir
```

### ۱۱.۵ اولین migration

```bash
docker compose exec app npx prisma migrate deploy
```

---

## ۱۲) Monitoring & Backup Strategy

### ۱۲.۱ Monitoring فاز ۱

| ابزار | نقش | هزینه |
|---|---|---|
| UptimeRobot | چک `/api/health` هر ۵ دقیقه | رایگان |
| `docker stats` | CPU/RAM/container | رایگان |
| Pino JSONL | لاگ ساختاریافته با `traceId` | رایگان |

```ts
// src/app/api/health/route.ts
export async function GET() {
  const dbOk = await prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false)
  const redisOk = await redis.ping().then(() => true).catch(() => false)
  return NextResponse.json(
    { db: dbOk, redis: redisOk },
    { status: dbOk && redisOk ? 200 : 503 }
  )
}
```

### ۱۲.۲ Backup

```bash
# deploy/scripts/backup.sh
#!/usr/bin/env bash
set -euo pipefail
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
docker compose exec -T postgres pg_dump -U saite saite_prod \
  | gzip > "/tmp/saite_${TIMESTAMP}.sql.gz"
# آپلود به ArvanCloud S3
aws s3 cp "/tmp/saite_${TIMESTAMP}.sql.gz" "s3://saite-backups/db/" \
  --endpoint-url "$ARVAN_S3_ENDPOINT"
rm "/tmp/saite_${TIMESTAMP}.sql.gz"
```

**crontab:**
```bash
30 3 * * * /opt/saite/deploy/scripts/backup.sh >> /var/log/saite-backup.log 2>&1
```

**retention:** ۱۴ روز در S3

### ۱۲.۳ Log Rotation

| سرویس | max-size | max-file |
|---|---|---|
| app, worker, postgres | ۵۰MB | ۵ |
| redis | ۲۰MB | ۳ |
| **جمع** | **~۵۰۰MB** | — |

---

## ۱۳) Path به مدل محلی (Ollama)

### ۱۳.۱ چرا نه الان؟

| منبع | نیاز Ollama | VPS فعلی |
|---|---|---|
| RAM | ~۶GB (Llama 3.1 8B 4-bit) | ۸GB کل — با stack کامل جا نمی‌شود |

### ۱۳.۲ مسیر آینده

```
فاز ۱ (الان):        Claude API → VPN روی VPS
                     ↓
فاز ۲ (۶-۱۲ ماه):   Claude API + cache پرتکرار در Redis
                     ↓
فاز ۳ (۱۲-۱۸ ماه):  [گزینه A] VPS upgrade به ۱۶GB → Ollama روی همان سرور
                     [گزینه B] VPS جدا ۸GB → Ollama روی شبکهٔ خصوصی
                     ↓
فاز ۴ (۲۴+ ماه):    مدل fine-tune شده روی دادهٔ چت واقعی
                     جایگزین Claude برای سوالات ساده
```

### ۱۳.۳ sidecar FastAPI (فاز ۲)

```yaml
# اضافه به docker-compose.prod.yml (profile: ai)
  ai-sidecar:
    build: { context: ../services/ai-sidecar }
    profiles: ["ai"]
    restart: unless-stopped
    environment:
      - SIDECAR_SERVICE_TOKEN=${SIDECAR_SERVICE_TOKEN}
    deploy:
      resources:
        limits: { memory: 6.5G, cpus: "1.5" }
```

**ارتباط:** worker Node → HTTP داخلی → FastAPI → Ollama. هر درخواست HMAC-signed.

---

## ۱۴) Trade-offs و ممنوعیت‌های آینده

### ۱۴.۱ Trade-offs پذیرفته‌شده

| تصمیم | هزینه | سود |
|---|---|---|
| Prisma به‌جای Drizzle | pgvector با `$queryRaw` | تیم آشنا، اکوسیستم بزرگ‌تر |
| SDK مستقیم به‌جای Vercel AI SDK | نگهداری ۲ SDK جدا | یک وابستگی کمتر، کنترل بیشتر |
| UptimeRobot به‌جای Prometheus | دقت کمتر | صفر سربار روی VPS |
| ConsoleProvider به‌جای Resend | ایمیل واقعی نداریم فاز ۱ | صفر وابستگی SaaS خارجی |
| Mock AI به‌جای Claude بدون کلید | هوشمندی نداریم | سیستم بالا می‌آید |

### ۱۴.۲ ۷ ممنوعیت (از MASTER-REFERENCE)

۱. ❌ PW_CHANNEL را در playwright.config.ts hard-code نکن
۲. ❌ `getByRole` با متن فارسی برای dialog استفاده نکن
۳. ❌ `devices[...]` را spread نکن اگر PW_CHANNEL ست می‌شود
۴. ❌ workflow جدید در `.github/workflows/` مستقیم اضافه نکن
۵. ❌ CSP `'unsafe-inline'` را کامل حذف نکن (Safari fallback)
۶. ❌ `ADMIN_ROLE` را از fingerprint session-token حذف نکن
۷. ❌ `Date.now()` در `useMemo` نگذار

### ۱۴.۳ ممنوعیت‌های بک‌اند اضافه

۱. ❌ هویت بصری (تیره + بنفش نئون) دست نزن
۲. ❌ `components/ui/` باید pure بماند
۳. ❌ mock-adapters موجود حذف نشوند
۴. ❌ `src/lib/api.ts` contract عوض نشود
۵. ❌ بدون افزودن وابستگی جدید non-critical
۶. ❌ صفر `any` یا `@ts-ignore` جدید
۷. ❌ فقط npm (نه pnpm نه yarn)
۸. ❌ هیچ secret در commit، env.local، یا لاگ
۹. ❌ Prometheus/Grafana/Ollama در فاز ۱
۱۰. ❌ push به `main` — فقط `arena/019fe061-saite`

---

**پایان سند.**

برای شروع C0، تایید کاربر نیاز است.
