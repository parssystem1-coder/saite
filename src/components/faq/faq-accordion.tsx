'use client'

import Link from 'next/link'
import { Accordion } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'

interface Props {
  groups: { group: string; items: { question: string; answer: string }[] }[]
}

/** بخش‌بندی پرسش‌ها بر اساس موضوع تا کاربر سریع‌تر پاسخ خود را پیدا کند */
export function FaqAccordion({ groups }: Props) {
  return (
    <div className="space-y-10 not-prose">
      {groups.map((g, gi) => (
        <section key={g.group}>
          <h2 className="mb-4 text-lg font-black text-foreground">{g.group}</h2>
          <Accordion
            defaultOpenId={gi === 0 ? `${gi}-0` : undefined}
            items={g.items.map((item, i) => ({
              id: `${gi}-${i}`,
              title: item.question,
              content: item.answer,
            }))}
          />
        </section>
      ))}

      <div className="surface-3d rounded-2xl p-6 text-center">
        <p className="text-sm font-bold text-foreground">پاسخ سوال خود را پیدا نکردید؟</p>
        <p className="mt-1.5 text-xs text-muted-foreground">
          کارشناسان ما در ساعات کاری پاسخگوی شما هستند.
        </p>
        <Button className="mt-5" asChild>
          <Link href="/contact">تماس با ما</Link>
        </Button>
      </div>
    </div>
  )
}
