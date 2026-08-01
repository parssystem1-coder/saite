import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Product } from '@/types/product'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const formattedPrice = new Intl.NumberFormat('fa-IR').format(product.price)

  return (
    <div className="group relative rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md">
      <Link href={`/products/${product.id}`} className="block">
        <div className="relative aspect-square overflow-hidden rounded-t-xl">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/5 opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      </Link>

      <div className="p-4">
        <div className="mb-1 text-xs text-muted-foreground">{product.category}</div>
        <Link href={`/products/${product.id}`}>
          <h3 className="line-clamp-1 font-semibold transition-colors hover:text-primary">
            {product.name}
          </h3>
        </Link>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-lg font-bold text-primary">{formattedPrice} تومان</span>
          </div>
          <Button size="icon" variant="secondary" className="rounded-full shadow-sm hover:bg-primary hover:text-primary-foreground">
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
