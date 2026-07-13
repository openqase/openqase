'use client'

import { useState, useEffect } from 'react'

export type LayoutType = 'grid' | 'table'

export function useLayoutPreference(defaultLayout: LayoutType = 'grid') {
  const [layout, setLayout] = useState<LayoutType>(defaultLayout)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true)
    // Only access localStorage on client side
    const saved = localStorage.getItem('content-layout-preference')
    if (saved === 'grid' || saved === 'table') {
      setLayout(saved)
    }
  }, [])

  const toggleLayout = () => {
    const newLayout: LayoutType = layout === 'grid' ? 'table' : 'grid'
    setLayout(newLayout)
    if (isClient) {
      localStorage.setItem('content-layout-preference', newLayout)
    }
  }

  const setLayoutPreference = (newLayout: LayoutType) => {
    setLayout(newLayout)
    if (isClient) {
      localStorage.setItem('content-layout-preference', newLayout)
    }
  }

  return {
    layout,
    toggleLayout,
    setLayoutPreference,
    isClient
  }
}