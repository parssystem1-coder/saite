'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:translate-y-[2px]',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-[0_4px_0_0_rgba(109,40,217,0.4)] hover:shadow-[0_2px_0_0_rgba(109,40,217,0.4)] hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground shadow-[0_4px_0_0_rgba(153,27,27,0.4)] hover:shadow-[0_2px_0_0_rgba(153,27,27,0.4)] hover:bg-destructive/90',
        outline:
          'border-2 border-primary/20 bg-background shadow-[0_4px_0_0_rgba(255,255,255,0.05)] hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground shadow-[0_4px_0_0_rgba(0,0,0,0.2)] hover:bg-secondary/80',
        ghost: 'hover:bg-primary/10 hover:text-primary',
        link: 'text-primary underline-offset-4 hover:underline shadow-none',
      },
      size: {
        default: 'h-11 px-6 py-2',
        sm: 'h-9 rounded-lg px-3 text-xs',
        lg: 'h-14 rounded-2xl px-10 text-base',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="inline-block"
      >
        <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
      </motion.div>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
