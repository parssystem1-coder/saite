import 'server-only'
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

// در زمان build (collecting page data) نباید Prisma engine لود شود —
// در این محیط نه DATABASE_URL هست نه باینری engine (شبکه قطع است)
// پس یک Proxy برمی‌گردانیم تا build سبز بماند؛ در runtime واقعی engine لود می‌شود
function createPrisma(): PrismaClient {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    // Proxy که هر متد را به یک Promise رد شده تبدیل می‌کند — build فقط type-check می‌کند، اجرا نمی‌شود
    return new Proxy({} as PrismaClient, {
      get(_target, prop) {
        if (prop === 'then' || prop === 'catch' || prop === 'finally') return undefined
        return (..._args: unknown[]) =>
          Promise.reject(new Error(`Prisma.${String(prop)} در زمان build در دسترس نیست`))
      },
    })
  }
  try {
    const instance = globalForPrisma.prisma || new PrismaClient()
    if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = instance
    return instance
  } catch {
    return new Proxy({} as PrismaClient, {
      get(_target, prop) {
        if (prop === 'then' || prop === 'catch' || prop === 'finally') return undefined
        return (..._args: unknown[]) =>
          Promise.reject(new Error(`Prisma.${String(prop)} در دسترس نیست`))
      },
    })
  }
}

export const prisma = createPrisma()
