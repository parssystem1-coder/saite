export const mockAiProvider = {
  async chat(_opts: { feature: string; prompt: string; actorId: string }) {
    return {
      text: 'این یک پاسخ آزمایشی است — کلید API تنظیم نشده.',
      usage: { inputTokens: 0, outputTokens: 0 },
    }
  },

  async embedding(_text: string) {
    return new Array(1536).fill(0)
  },
}
