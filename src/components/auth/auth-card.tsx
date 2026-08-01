'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

export function AuthCard({ children, title, description }: { children: ReactNode, title: string, description: string }) {
  return (
    <div className="relative w-full max-w-md">
      {/* Background Glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-600 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative px-8 py-10 bg-[#0d0d0f] border border-white/10 rounded-3xl shadow-2xl backdrop-blur-xl overflow-hidden"
      >
        {/* Top Scan Line */}
        <motion.div 
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 left-0 h-[2px] w-20 bg-primary/50"
        />

        <div className="text-center mb-10">
          <h2 className="text-3xl font-black tracking-tight text-white">{title}</h2>
          <p className="mt-3 text-muted-foreground text-sm leading-relaxed">{description}</p>
        </div>

        {children}
      </motion.div>
    </div>
  )
}
