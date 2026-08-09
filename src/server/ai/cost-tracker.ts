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
  // fire-and-forget بدون queueMicrotask — مستقیم با .catch تا process قبل از microtask نمیرد
  prisma.aiUsageLog
    .create({
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
    .catch((err: unknown) => {
      logger.error({ err, feature: input.feature }, '[CostTracker] Failed to log')
    })
}
