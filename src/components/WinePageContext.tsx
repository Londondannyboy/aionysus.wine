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

interface MerchantConfigContext {
  merchant_name: string
  product_availability: string
  availability_label: string
  shipping_label: string
  shipping_country_code: string
  return_policy_category: string
  return_days: number
  price_currency: string
  platform_mode: string
}

interface WinePageContextProps {
  wine: Wine
  merchantConfig?: MerchantConfigContext
}

/**
 * Client component that provides wine context to CopilotKit
 * Use this on wine detail pages to let Vic know about the current wine
 */
export function WinePageContext({ wine, merchantConfig }: WinePageContextProps) {
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

  // Provide merchant/platform config to Vic
  useCopilotReadable({
    description: 'Platform merchant configuration - availability, shipping, and return policies',
    value: merchantConfig ? {
      platformMode: merchantConfig.platform_mode,
      availability: merchantConfig.availability_label,
      shipping: merchantConfig.shipping_label,
      shipsTo: merchantConfig.shipping_country_code,
      returnPolicy: merchantConfig.return_days > 0
        ? `${merchantConfig.return_days}-day returns`
        : 'Returns not currently accepted (demo mode)',
      currency: merchantConfig.price_currency,
      merchantName: merchantConfig.merchant_name,
    } : null,
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
