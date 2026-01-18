'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface UnsplashPhoto {
  id: string
  urls: {
    raw: string
    regular: string
  }
  alt_description: string | null
  user: {
    name: string
    username: string
  }
  blur_hash: string | null
}

// Region to search query mapping
const REGION_QUERIES: Record<string, string> = {
  'burgundy': 'burgundy vineyard france',
  'bordeaux': 'bordeaux vineyard chateau',
  'champagne': 'champagne vineyard france',
  'rhone': 'rhone valley vineyard',
  'loire': 'loire valley vineyard',
  'alsace': 'alsace vineyard',
  'provence': 'provence vineyard',
  'tuscany': 'tuscany vineyard hills',
  'piedmont': 'piedmont barolo vineyard',
  'rioja': 'rioja spain vineyard',
  'napa': 'napa valley vineyard',
  'england': 'english vineyard sussex',
  'sussex': 'sussex vineyard england',
  'kent': 'kent vineyard england',
  'default': 'vineyard sunset wine',
}

interface DynamicBackgroundProps {
  region?: string | null
  wineType?: string | null
  children: React.ReactNode
  className?: string
}

export function DynamicBackground({
  region,
  wineType,
  children,
  className = ''
}: DynamicBackgroundProps) {
  const [photo, setPhoto] = useState<UnsplashPhoto | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentQuery, setCurrentQuery] = useState<string>('')

  const fetchBackground = useCallback(async (query: string) => {
    const accessKey = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY
    if (!accessKey || query === currentQuery) return

    setIsLoading(true)
    setCurrentQuery(query)

    try {
      const response = await fetch(
        `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=landscape&content_filter=high`,
        {
          headers: {
            Authorization: `Client-ID ${accessKey}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setPhoto(data)
      }
    } catch (error) {
      console.error('Failed to fetch background:', error)
    } finally {
      setIsLoading(false)
    }
  }, [currentQuery])

  useEffect(() => {
    // Determine best query based on region or wine type
    let query = REGION_QUERIES['default']

    if (region) {
      const normalizedRegion = region.toLowerCase()
      for (const [key, value] of Object.entries(REGION_QUERIES)) {
        if (normalizedRegion.includes(key) || key.includes(normalizedRegion)) {
          query = value
          break
        }
      }
    } else if (wineType) {
      const typeMap: Record<string, string> = {
        'red': 'red wine vineyard sunset',
        'white': 'white wine vineyard morning',
        'rose': 'rose wine provence',
        'sparkling': 'champagne vineyard',
      }
      query = typeMap[wineType.toLowerCase()] || REGION_QUERIES['default']
    }

    fetchBackground(query)
  }, [region, wineType, fetchBackground])

  const backgroundUrl = photo
    ? `${photo.urls.raw}&w=1920&q=80&fit=crop&auto=format`
    : null

  return (
    <div className={`relative min-h-screen overflow-hidden ${className}`}>
      {/* Animated Background Layer */}
      <AnimatePresence mode="wait">
        {backgroundUrl && (
          <motion.div
            key={photo?.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0 z-0"
          >
            <img
              src={backgroundUrl}
              alt={photo?.alt_description || 'Vineyard background'}
              className="w-full h-full object-cover"
            />
            {/* Dark overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-purple-950/60 to-slate-950/80" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fallback gradient when no image */}
      {!backgroundUrl && (
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950" />
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Attribution (required by Unsplash) */}
      {photo && (
        <div className="absolute bottom-2 right-2 z-20 text-white/30 text-xs">
          Photo by{' '}
          <a
            href={`https://unsplash.com/@${photo.user.username}?utm_source=aionysus&utm_medium=referral`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white/50"
          >
            {photo.user.name}
          </a>
          {' '}on{' '}
          <a
            href="https://unsplash.com/?utm_source=aionysus&utm_medium=referral"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white/50"
          >
            Unsplash
          </a>
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute top-4 right-4 z-20">
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
        </div>
      )}
    </div>
  )
}

/**
 * Hook for using dynamic backgrounds in custom components
 */
export function useDynamicBackground(region?: string | null) {
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null)
  const [attribution, setAttribution] = useState<string | null>(null)

  useEffect(() => {
    const fetchBackground = async () => {
      const accessKey = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY
      if (!accessKey) return

      let query = REGION_QUERIES['default']
      if (region) {
        const normalizedRegion = region.toLowerCase()
        for (const [key, value] of Object.entries(REGION_QUERIES)) {
          if (normalizedRegion.includes(key)) {
            query = value
            break
          }
        }
      }

      try {
        const response = await fetch(
          `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=landscape`,
          {
            headers: { Authorization: `Client-ID ${accessKey}` },
          }
        )

        if (response.ok) {
          const photo = await response.json()
          setBackgroundUrl(`${photo.urls.raw}&w=1920&q=80&fit=crop`)
          setAttribution(`Photo by ${photo.user.name} on Unsplash`)
        }
      } catch (error) {
        console.error('Failed to fetch background:', error)
      }
    }

    fetchBackground()
  }, [region])

  return { backgroundUrl, attribution }
}
