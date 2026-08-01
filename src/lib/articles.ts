export interface Article {
  slug: string
  title: string
  excerpt: string
  category: string
  readMinutes: number
  publishedAt: string
}

/**
 * مقالات نمونه — محتوای واقعی در فاز ۴ اضافه می‌شود.
 * موضوعات عمداً حول «راهنمای خرید» و «نگهداری» انتخاب شده‌اند،
 * چون همان عبارت‌هایی هستند که مشتری این صنعت در گوگل جستجو می‌کند.
 */
export const ARTICLES: Article[] = [
  {
    slug: 'printer-buying-guide',
    title: 'راهنمای خرید پرینتر: لیزری یا جوهرافشان؟',
    excerpt:
      'کدام فناوری چاپ برای شما مقرون‌به‌صرفه‌تر است؟ مقایسهٔ هزینهٔ هر برگ، کیفیت چاپ و هزینهٔ نگهداری در بلندمدت.',
    category: 'راهنمای خرید',
    readMinutes: 7,
    publishedAt: '2026-07-18',
  },
  {
    slug: 'copier-maintenance-tips',
    title: 'هفت نکتهٔ کلیدی برای افزایش عمر دستگاه کپی',
    excerpt:
      'گیر کردن مکرر کاغذ و افت کیفیت چاپ معمولاً ریشه در نگهداری نادرست دارد. این نکات ساده هزینهٔ تعمیرات را کاهش می‌دهد.',
    category: 'نگهداری',
    readMinutes: 5,
    publishedAt: '2026-07-04',
  },
  {
    slug: 'how-to-replace-toner',
    title: 'آموزش تصویری تعویض تونر و کارتریج',
    excerpt:
      'تعویض تونر کار سختی نیست. گام‌به‌گام یاد بگیرید چطور بدون آسیب به درام، کارتریج دستگاهتان را عوض کنید.',
    category: 'آموزش',
    readMinutes: 4,
    publishedAt: '2026-06-22',
  },
]
