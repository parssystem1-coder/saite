'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useEffect, useState } from 'react'

export function AIParticles() {
  const [mounted, setMounted] = useState(false)
  const { scrollY } = useScroll()
  const y1 = useTransform(scrollY, [0, 1000], [0, 200])
  const y2 = useTransform(scrollY, [0, 1000], [0, -200])

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="fixed inset-0 -z-20 overflow-hidden pointer-events-none">
      {/* Floating Blobs */}
      <motion.div 
        style={{ y: y1 }}
        className="absolute top-[10%] left-[15%] h-96 w-96 rounded-full bg-primary/20 blur-[120px]" 
      />
      <motion.div 
        style={{ y: y2 }}
        className="absolute bottom-[20%] right-[10%] h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[150px]" 
      />
      
      {/* Particles Grid */}
      <div className="absolute inset-0 opacity-[0.15]" 
        style={{ 
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px' 
        }} 
      />

      {/* Moving Light Lines */}
      <motion.div
        animate={{
          top: ['-10%', '110%'],
          opacity: [0, 1, 0]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute left-1/4 h-32 w-px bg-gradient-to-b from-transparent via-primary to-transparent"
      />
      <motion.div
        animate={{
          top: ['-10%', '110%'],
          opacity: [0, 0.5, 0]
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          delay: 5,
          ease: "linear"
        }}
        className="absolute left-3/4 h-48 w-px bg-gradient-to-b from-transparent via-blue-400 to-transparent"
      />
    </div>
  )
}
