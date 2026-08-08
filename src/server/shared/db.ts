import 'server-only'
import { PrismaClient } from '@prisma/client'
import { startBackgroundJobs } from '@/server/jobs/init'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

prisma.$connect().catch((err: unknown) => {
  console.error('Prisma connection failed:', err)
  process.exit(1)
})

// راه‌اندازی background jobs هنگام import db
startBackgroundJobs()
