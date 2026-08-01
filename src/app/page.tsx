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

import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ui/product-card";
import { Product } from "@/types/product";
import { Cpu, Zap, Shield, Globe } from "lucide-react";

const FEATURED_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "گوشی هوشمند مدل X20 Pro",
    price: 35000000,
    category: "کالای دیجیتال",
    image: "https://images.unsplash.com/photo-1598327105666-5b89a8a6796d?q=80&w=500&auto=format&fit=crop",
  },
  {
    id: "2",
    name: "لپ‌تاپ گیمینگ سری Ultra",
    price: 85000000,
    category: "کالای دیجیتال",
    image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?q=80&w=500&auto=format&fit=crop",
  },
  {
    id: "3",
    name: "هدفون نویز کنسلینگ AI",
    price: 12000000,
    category: "صوتی و تصویری",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=500&auto=format&fit=crop",
  },
  {
    id: "4",
    name: "ساعت هوشمند ماتریکس",
    price: 9500000,
    category: "گجت‌ها",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=500&auto=format&fit=crop",
  },
];

const FEATURES = [
  { icon: Cpu, title: "پردازش هوشمند", desc: "انتخاب بهترین محصولات با الگوریتم‌های پیشرفته" },
  { icon: Zap, title: "ارسال سریع", desc: "تحویل سفارشات در کمترین زمان ممکن" },
  { icon: Shield, title: "ضمانت اصالت", desc: "تضمین ۱۰۰٪ کالاها و خدمات پس از فروش" },
  { icon: Globe, title: "پشتیبانی جهانی", desc: "خدمات مشتریان در تمام ساعات شبانه‌روز" },
];

import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ui/product-card";
import { Product } from "@/types/product";
import { Cpu, Zap, Shield, Globe } from "lucide-react";
import { FadeIn } from "@/components/ui/fade-in";

// ... باقی کدها ...

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-32">
      {/* Hero Section */}
      <FadeIn delay={0.2}>
        <section className="relative flex flex-col items-center justify-center text-center space-y-8 py-32 overflow-hidden">
          <div className="absolute -top-24 -z-10 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[120px]" />
          
          <motion.h1 
            initial={{ filter: 'blur(10px)', opacity: 0 }}
            animate={{ filter: 'blur(0px)', opacity: 1 }}
            transition={{ duration: 1 }}
            className="text-5xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 leading-tight"
          >
            خرید آینده <br /> با هوش مصنوعی
          </motion.h1>
          
          <p className="text-xl text-muted-foreground max-w-[600px] leading-relaxed">
            وارد دنیای جدیدی از خرید آنلاین شوید. جایی که تکنولوژی سه بعدی و هوش مصنوعی در خدمت شماست.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 pt-4">
            <Button size="lg" className="px-12 text-lg">همین حالا شروع کنید</Button>
            <Button size="lg" variant="outline" className="px-12 text-lg backdrop-blur-md">تکنولوژی ما</Button>
          </div>
        </section>
      </FadeIn>

      {/* Features Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {FEATURES.map((feature, i) => (
          <FadeIn key={i} delay={i * 0.1}>
            <div className="group relative p-8 rounded-3xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all duration-300 shadow-2xl overflow-hidden h-full">
              <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-primary/10 blur-2xl group-hover:bg-primary/20 transition-all" />
              <feature.icon className="h-12 w-12 text-primary mb-6" />
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
            </div>
          </FadeIn>
        ))}
      </section>

      {/* Featured Products */}
      <section>
        <FadeIn>
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-black">محصولات برتر</h2>
              <p className="text-muted-foreground mt-2">انتخابی از بهترین‌های دنیای تکنولوژی</p>
            </div>
            <Button variant="link" size="lg" className="text-primary font-bold" asChild>
              <Link href="/products">مشاهده همه محصولات ←</Link>
            </Button>
          </div>
        </FadeIn>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {FEATURED_PRODUCTS.map((product, i) => (
            <FadeIn key={product.id} delay={i * 0.1}>
              <ProductCard product={product} />
            </FadeIn>
          ))}
        </div>
      </section>
    </div>
  );
}
