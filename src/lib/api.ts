import { Product } from '@/types/product'

const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'گوشی هوشمند مدل X20 Pro',
    price: 35000000,
    category: 'کالای دیجیتال',
    image: 'https://images.unsplash.com/photo-1598327105666-5b89a8a6796d?q=80&w=500&auto=format&fit=crop',
    description: 'قدرتمندترین گوشی هوشمند با دوربین ۱۰۸ مگاپیکسلی و پردازنده هشت هسته‌ای.',
  },
  {
    id: '2',
    name: 'لپ‌تاپ گیمینگ سری Ultra',
    price: 85000000,
    category: 'کالای دیجیتال',
    image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?q=80&w=500&auto=format&fit=crop',
    description: 'لپ‌تاپ مخصوص بازی با کارت گرافیک RTX 4090 و نمایشگر ۱۶۵ هرتز.',
  },
  {
    id: '3',
    name: 'هدفون نویز کنسلینگ AI',
    price: 12000000,
    category: 'صوتی و تصویری',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=500&auto=format&fit=crop',
    description: 'تجربه شنیداری بی‌نظیر با سیستم حذف نویز هوشمند و عمر باتری ۴۰ ساعته.',
  },
  {
    id: '4',
    name: 'ساعت هوشمند ماتریکس',
    price: 9500000,
    category: 'گجت‌ها',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=500&auto=format&fit=crop',
    description: 'پایش دقیق سلامت و اعلان‌های هوشمند در یک طراحی شیک و آینده‌نگرانه.',
  },
  {
    id: '5',
    name: 'تبلت گرافیکی Creator',
    price: 18000000,
    category: 'کالای دیجیتال',
    image: 'https://images.unsplash.com/photo-1544244015-0cd4b3ff869d?q=80&w=500&auto=format&fit=crop',
    description: 'بهترین ابزار برای طراحان و هنرمندان دیجیتال با حساسیت فشار بالا.',
  },
  {
    id: '6',
    name: 'اسپیکر هوشمند سوند-ویو',
    price: 5500000,
    category: 'صوتی و تصویری',
    image: 'https://images.unsplash.com/photo-1589003020683-75a17163f285?q=80&w=500&auto=format&fit=crop',
    description: 'صدای ۳۶۰ درجه و دستیار صوتی داخلی برای کنترل هوشمند خانه.',
  },
]

export async function getProducts(): Promise<Product[]> {
  // شبیه‌سازی تاخیر شبکه
  await new Promise((resolve) => setTimeout(resolve, 800))
  return PRODUCTS
}

export async function getProductById(id: string): Promise<Product | undefined> {
  await new Promise((resolve) => setTimeout(resolve, 500))
  return PRODUCTS.find((p) => p.id === id)
}
