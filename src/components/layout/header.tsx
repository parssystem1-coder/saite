import Link from 'next/link'
import { ShoppingCart, Search, User, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center px-4">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <span className="inline-block font-bold text-xl text-primary">سایت</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link href="/products" className="text-sm font-medium transition-colors hover:text-primary">
              محصولات
            </Link>
            <Link href="/categories" className="text-sm font-medium transition-colors hover:text-primary">
              دسته‌بندی‌ها
            </Link>
            <Link href="/offers" className="text-sm font-medium transition-colors hover:text-primary">
              تخفیف‌ها
            </Link>
          </nav>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-4 space-x-reverse">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <div className="relative">
              <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="جستجوی محصول..."
                className="pr-8 w-full md:w-[300px] lg:w-[400px]"
              />
            </div>
          </div>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link href="/cart">
                <ShoppingCart className="h-5 w-5" />
                <span className="sr-only">سبد خرید</span>
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link href="/login">
                <User className="h-5 w-5" />
                <span className="sr-only">ورود</span>
              </Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  )
}
