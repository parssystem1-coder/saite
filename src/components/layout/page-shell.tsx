import { Breadcrumb, type Crumb } from '@/components/ui/breadcrumb'

interface Props {
  title: string
  description?: string
  crumbs?: Crumb[]
  children: React.ReactNode
}

/**
 * قالب مشترک صفحات محتوایی (قوانین، حریم خصوصی، ارسال، ضمانت و …).
 *
 * از prose سفارشی استفاده می‌کند چون plugin تایپوگرافی Tailwind نصب
 * نیست و برای این حجم محتوا، چند کلاس ساده کافی است.
 */
export function PageShell({ title, description, crumbs, children }: Props) {
  return (
    <div className="container mx-auto px-4 py-10">
      <Breadcrumb
        className="mb-8"
        items={crumbs ?? [{ label: 'خانه', href: '/' }, { label: title }]}
      />

      <header className="mb-10 max-w-3xl">
        <h1 className="text-3xl font-black text-balance text-foreground md:text-4xl">{title}</h1>
        {description && (
          <p className="mt-3 leading-relaxed text-muted-foreground">{description}</p>
        )}
      </header>

      <div
        className="
          max-w-3xl space-y-6 leading-loose text-muted-foreground
          [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-black [&_h2]:text-foreground
          [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-foreground
          [&_li]:leading-loose
          [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pr-5
          [&_strong]:text-foreground
          [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pr-5
        "
      >
        {children}
      </div>
    </div>
  )
}
