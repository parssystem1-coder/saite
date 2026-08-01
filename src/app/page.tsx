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
    <div className="container mx-auto px-4 py-8 space-y-24">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center text-center space-y-8 py-32 overflow-hidden">
        <div className="absolute -top-24 -z-10 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[120px]" />
        
        <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 leading-tight">
          خرید آینده <br /> با هوش مصنوعی
        </h1>
        
        <p className="text-xl text-muted-foreground max-w-[600px] leading-relaxed">
          وارد دنیای جدیدی از خرید آنلاین شوید. جایی که تکنولوژی سه بعدی و هوش مصنوعی در خدمت شماست.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 pt-4">
          <Button size="lg" className="px-12 text-lg">همین حالا شروع کنید</Button>
          <Button size="lg" variant="outline" className="px-12 text-lg backdrop-blur-md">تکنولوژی ما</Button>
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
