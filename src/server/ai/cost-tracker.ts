import 'server-only'
import { prisma } from '@/server/shared/db'

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
  // Async fire-and-forget — لاگ نباید critical path را مسدود کند
  queueMicrotask(async () => {
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
    } catch (err) {
      console.error('[CostTracker] Failed to log:', err)
    }
  })
}
