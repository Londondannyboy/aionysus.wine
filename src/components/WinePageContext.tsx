'use client'

import { useEffect } from 'react'
import { useCopilotReadable } from '@copilotkit/react-core'

interface Wine {
  id: number
  name: string
  slug: string
  winery: string
  region: string
  country: string
  grape_variety?: string | null
  vintage: number | null
  classification?: string | null
  price_retail: number | null
  shopify_product_id: string | null
}

interface WinePageContextProps {
  wine: Wine
}

/**
 * Client component that provides wine context to CopilotKit
 * Use this on wine detail pages to let Vic know about the current wine
 */
export function WinePageContext({ wine }: WinePageContextProps) {
  // Provide detailed wine context to Vic
  useCopilotReadable({
    description: 'The wine currently being viewed on this page',
    value: {
      name: wine.name,
      fullName: `${wine.vintage || ''} ${wine.name}`.trim(),
      winery: wine.winery,
      region: wine.region,
      country: wine.country,
      grape: wine.grape_variety,
      classification: wine.classification,
      vintage: wine.vintage,
      price: wine.price_retail ? `£${wine.price_retail}` : 'Price on request',
      priceValue: wine.price_retail,
      slug: wine.slug,
      canAddToCart: !!wine.shopify_product_id,
      shopifyProductId: wine.shopify_product_id,
    },
  })

  // Also set a window variable for GlobalCopilotActions to pick up
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__currentWine = wine
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).__currentWine
      }
    }
  }, [wine])

  return null // No UI, just context
}
