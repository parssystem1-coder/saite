export type FaqPair = {
  question: string
  answer: string
}

/** FAQPage schema.org */
export function buildFaqPageLd(items: FaqPair[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((i) => ({
      '@type': 'Question',
      name: i.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: i.answer,
      },
    })),
  }
}
