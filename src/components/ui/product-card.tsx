'use client'

import React, { useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Product } from '@/types/product'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const mouseXSpring = useSpring(x)
  const mouseYSpring = useSpring(y)

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['10deg', '-10deg'])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-10deg', '10deg'])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const xPct = mouseX / width - 0.5
    const yPct = mouseY / height - 0.5
    x.set(xPct)
    y.set(yPct)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  const formattedPrice = new Intl.NumberFormat('fa-IR').format(product.price)

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      className="relative h-96 w-full rounded-2xl bg-gradient-to-br from-white/5 to-white/10 border border-white/10 p-2 shadow-2xl transition-all duration-200"
    >
      <div
        style={{
          transform: 'translateZ(50px)',
          transformStyle: 'preserve-3d',
        }}
        className="h-full w-full rounded-xl bg-card p-4 shadow-lg flex flex-col"
      >
        <Link href={`/products/${product.id}`} className="relative block h-48 w-full overflow-hidden rounded-lg">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-contain p-4 transition-transform duration-500 hover:scale-110"
          />
        </Link>

        <div className="mt-4 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-primary/80">{product.category}</div>
          <Link href={`/products/${product.id}`}>
            <h3 className="mt-1 line-clamp-1 text-lg font-bold text-foreground">
              {product.name}
            </h3>
          </Link>
          
          <div className="mt-auto pt-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground line-through opacity-50">
                {(product.price * 1.2).toLocaleString('fa-IR')}
              </span>
              <span className="text-xl font-black text-primary">{formattedPrice} تومان</span>
            </div>
            <Button size="icon" className="rounded-full shadow-lg">
              <ShoppingCart className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
