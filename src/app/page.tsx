import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-12">
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
    </div>
  );
}
