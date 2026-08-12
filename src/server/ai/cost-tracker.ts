import 'server-only'
import { prisma } from '@/server/shared/db'
import { logger } from '@/server/shared/logger'

export interface CostTrackInput {
  feature: string
  promptVersion: string
  provider: string
  model: string
  actorId: string
  inputTokens: number
  outputTokens: number
  durationMs: number
  status: 'success' | 'error' | 'fallback'
}

export async function trackCost(input: CostTrackInput) {
  // ردیابی هزینه هرگز نباید مسیر اصلی چت/سئو را بشکند.
  // try/catch (و نه .catch خام) تا تشرهای همگام — مثل پروکسی
  // بدون-DB در زمان توسعه — هم پوشش داده شوند.
  try {
    await prisma.aiUsageLog.create({
      data: {
        feature: input.feature,
        promptVersion: input.promptVersion,
        provider: input.provider,
        model: input.model,
        actorId: input.actorId,
        inputTokens: input.inputTokens,
        outputTokens: input.outputTokens,
        durationMs: input.durationMs,
        status: input.status,
        gitSha: process.env.GIT_SHA || 'unknown',
      },
    })
  } catch (err: unknown) {
    logger.error({ err, feature: input.feature }, '[CostTracker] Failed to log')
  }
}
