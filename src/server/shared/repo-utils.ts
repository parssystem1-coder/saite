import 'server-only'

/**
 * الگوی مشترک صفحه‌بندی repository — یک‌جا برای همهٔ ماژول‌ها.
 *
 * جایگزین شش (و بیشتر) کپی از
 *   [items, total] = Promise.all([findMany, count])
 * که در finance/communications/shipping/marketing/content تکرار شده بود.
 *
 * `model` به‌عنوان delegate پاس داده می‌شود (مثل `prisma.invoice`) و
 * ساختار args با cast داخلی به‌دست می‌آید تا با تایپ‌های ژنریک Prisma
 * بدون وابستگی به یک مدل خاص سازگار بماند.
 */
export async function paginatedList<TItem>(
  model: unknown,
  options: {
    where?: object
    orderBy?: object
    include?: object
    page?: number
    limit?: number
  } = {}
): Promise<{ items: TItem[]; total: number; page: number; limit: number }> {
  const page = options.page || 1
  const limit = options.limit || 20
  const where = options.where ?? {}

  const delegate = model as {
    findMany: (args: unknown) => Promise<TItem[]>
    count: (args: unknown) => Promise<number>
  }

  const [items, total] = await Promise.all([
    delegate.findMany({
      where,
      orderBy: options.orderBy ?? { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      ...(options.include ? { include: options.include } : {}),
    }),
    delegate.count({ where }),
  ])

  return { items, total, page, limit }
}
