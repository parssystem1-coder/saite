import '@testing-library/jest-dom/vitest'
import * as React from 'react'
import { vi } from 'vitest'

/**
 * next/image در jsdom قابل رندر نیست — به <img> ساده تبدیل می‌شود.
 */
vi.mock('next/image', () => ({
  default: function MockImage({
    src,
    alt,
    ...rest
  }: {
    src: string
    alt: string
    fill?: boolean
    sizes?: string
    priority?: boolean
    className?: string
  }) {
    const { fill: _f, sizes: _s, priority: _p, ...imgProps } = rest
    return React.createElement('img', { src, alt, ...imgProps })
  },
}))

/**
 * next/link → <a> برای assert روی href
 */
vi.mock('next/link', () => ({
  default: function MockLink({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode
    href: string
    className?: string
    onClick?: () => void
  }) {
    return React.createElement('a', { href, ...rest }, children)
  },
}))

/**
 * motion در تست: بدون انیمیشن — children را مستقیم رندر کن
 * تا Card3D و AnimatePresence در jsdom پایدار بمانند.
 */
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  const passthrough = ({
    children,
    ...props
  }: {
    children?: React.ReactNode
    className?: string
    style?: React.CSSProperties
  }) => {
    const {
      // motion-only props — از DOM حذف می‌شوند
      initial: _i,
      animate: _a,
      exit: _e,
      transition: _t,
      whileHover: _wh,
      whileTap: _wt,
      layout: _l,
      ...dom
    } = props as Record<string, unknown>
    return React.createElement('div', dom, children)
  }

  return {
    ...actual,
    motion: new Proxy(actual.motion, {
      get(target, key) {
        if (key === 'div' || key === 'span' || key === 'button') return passthrough
        return Reflect.get(target, key)
      },
    }),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    useReducedMotion: () => true,
  }
})
