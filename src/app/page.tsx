import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ui/product-card";
import { Product } from "@/types/product";

const MOCK_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "گوشی هوشمند مدل X10",
    price: 25000000,
    category: "کالای دیجیتال",
    image: "/next.svg", // Placeholder
  },
  {
    id: "2",
    name: "لپ‌تاپ گیمینگ سری Pro",
    price: 68000000,
    category: "کالای دیجیتال",
    image: "/next.svg", // Placeholder
  },
  {
    id: "3",
    name: "هدفون بی‌سیم AirTune",
    price: 4500000,
    category: "صوتی و تصویری",
    image: "/next.svg", // Placeholder
  },
  {
    id: "4",
    name: "ساعت هوشمند HealthWatch",
    price: 8900000,
    category: "گجت‌ها",
    image: "/next.svg", // Placeholder
  },
];

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-16">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center space-y-6 py-20 bg-muted/30 rounded-3xl">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-primary">
          به فروشگاه مدرن ما خوش آمدید
        </h1>
        <p className="text-xl text-muted-foreground max-w-[600px]">
          تجربه خرید سریع، ایمن و لذت‌بخش با جدیدترین محصولات روز دنیا.
        </p>
        <div className="flex gap-4">
          <Button size="lg">مشاهده محصولات</Button>
          <Button size="lg" variant="outline">تخفیف‌های ویژه</Button>
        </div>
      </section>

      {/* Featured Products */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">محصولات برتر</h2>
          <Button variant="link">مشاهده همه</Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {MOCK_PRODUCTS.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
