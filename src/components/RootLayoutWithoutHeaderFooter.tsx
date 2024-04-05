'use client'

import { createContext, useState } from 'react'
import { usePathname } from 'next/navigation'
import { motion, MotionConfig, useReducedMotion } from 'framer-motion'
import { GridPattern } from '@/components/GridPattern'

const RootLayoutContext = createContext<{
  logoHovered: boolean
  setLogoHovered: React.Dispatch<React.SetStateAction<boolean>>
} | null>(null)

function RootLayoutInner({children}: { children: React.ReactNode }) {
  let shouldReduceMotion = useReducedMotion()

  return (
    <MotionConfig transition={shouldReduceMotion ? {duration: 0} : undefined}>
      <motion.div
        layout
        style={{borderTopLeftRadius: 40, borderTopRightRadius: 40}}
        className="relative flex flex-auto overflow-hidden bg-white pt-14"
      >
        <motion.div
          layout
          className="relative isolate flex w-full flex-col pt-9"
        >
          <GridPattern
            className="absolute inset-x-0 -top-14 -z-10 h-[1000px] w-full fill-neutral-50 stroke-neutral-950/5 [mask-image:linear-gradient(to_bottom_left,white_40%,transparent_50%)]"
            yOffset={-96}
            interactive
          />

          <main className="w-full flex-auto">{children}</main>

        </motion.div>
      </motion.div>
    </MotionConfig>
  )
}

export function RootLayoutWithoutHeaderFooter({children}: { children: React.ReactNode }) {
  let pathname = usePathname()
  let [logoHovered, setLogoHovered] = useState(false)

  return (
    <RootLayoutContext.Provider value={{logoHovered, setLogoHovered}}>
      <RootLayoutInner key={pathname}>{children}</RootLayoutInner>
    </RootLayoutContext.Provider>
  )
}
