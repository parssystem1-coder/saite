import { Breadcrumb, type Crumb } from '@/components/ui/breadcrumb'
import { cn } from '@/lib/utils'

interface Props {
  /**
   * عنوان صفحه. اگر ندهید، `<h1>` رندر نمی‌شود و صفحه باید
   * خودش دقیقاً یک `<h1>` داشته باشد (مثل صفحهٔ برند که عنوانش
   * لاتین و `dir="ltr"` است).
   */
  title?: string
  description?: string
  crumbs?: Crumb[]
  /** محتوای سفارشی زیر breadcrumb و بالای بدنه — جایگزین header پیش‌فرض */
  header?: React.ReactNode
  /**
   * عرض بدنه. پیش‌فرض `max-w-3xl` برای خوانایی متن است؛ صفحاتی که
   * گرید محصول نشان می‌دهند باید `full` بگیرند وگرنه کارت‌ها له می‌شوند.
   */
  width?: 'prose' | 'full'
  children: React.ReactNode
}

/**
 * قالب مشترک صفحات محتوایی (قوانین، حریم خصوصی، ارسال، ضمانت و …).
 *
 * از prose سفارشی استفاده می‌کند چون plugin تایپوگرافی Tailwind نصب
 * نیست و برای این حجم محتوا، چند کلاس ساده کافی است.
 */
export function PageShell({
  title,
  description,
  crumbs,
  header,
  width = 'prose',
  children,
}: Props) {
  const fallbackCrumbs: Crumb[] = [
    { label: 'خانه', href: '/' },
    ...(title ? [{ label: title }] : []),
  ]

  return (
    <div className="container mx-auto px-4 py-10">
      <Breadcrumb className="mb-8" items={crumbs ?? fallbackCrumbs} />

      {header ??
        (title && (
          <header className="mb-10 max-w-3xl">
            <h1 className="text-3xl font-black text-balance text-foreground md:text-4xl">
              {title}
            </h1>
            {description && (
              <p className="mt-3 leading-relaxed text-muted-foreground">{description}</p>
            )}
          </header>
        ))}

      <div
        className={cn(
          `space-y-6 leading-loose text-muted-foreground
           [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-black [&_h2]:text-foreground
           [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-foreground
           [&_li]:leading-loose
           [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pr-5
           [&_strong]:text-foreground
           [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pr-5`,
          width === 'prose' && 'max-w-3xl'
        )}
      >
        {children}
      </div>
    </div>
  )
}
