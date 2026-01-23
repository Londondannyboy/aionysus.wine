'use client'

import { useEffect, useState, useCallback } from 'react'
import { useFrontendTool, useCopilotReadable } from '@copilotkit/react-core'
import { usePathname } from 'next/navigation'

interface Wine {
  id: number
  name: string
  slug: string
  winery: string
  region: string
  country: string
  vintage: number | null
  price_retail: number | null
  shopify_product_id: string | null
}

interface GlobalCopilotActionsProps {
  // Optional: pass current wine data if on a wine detail page
  currentWine?: Wine | null
}

export function GlobalCopilotActions({ currentWine }: GlobalCopilotActionsProps) {
  const pathname = usePathname()
  const [cartId, setCartId] = useState<string | null>(null)
  const [cartCount, setCartCount] = useState(0)
  const [searchResults, setSearchResults] = useState<Wine[]>([])
  const [vicPushedBottle, setVicPushedBottle] = useState(false)
  const [platformConfig, setPlatformConfig] = useState<Record<string, string> | null>(null)

  // Check session storage for Vic's bottle push
  useEffect(() => {
    const pushed = sessionStorage.getItem('vic_pushed_bottle')
    if (pushed) setVicPushedBottle(true)
  }, [])

  // Fetch platform/merchant config
  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => setPlatformConfig(data))
      .catch(() => {})
  }, [])

  // Get or create Shopify cart
  const getOrCreateCart = useCallback(async () => {
    let id = cartId || (typeof localStorage !== 'undefined' ? localStorage.getItem('shopify_cart_id') : null)
    if (!id) {
      try {
        const res = await fetch('/api/cart', { method: 'POST' })
        const data = await res.json()
        id = data.cartId
        if (id && typeof localStorage !== 'undefined') {
          localStorage.setItem('shopify_cart_id', id)
        }
      } catch (e) {
        console.error('Failed to create cart:', e)
        return null
      }
    }
    if (id) setCartId(id)
    return id
  }, [cartId])

  // Provide page context to Vic
  useCopilotReadable({
    description: 'Current page the user is viewing',
    value: {
      path: pathname,
      isHomePage: pathname === '/',
      isWinesPage: pathname === '/wines',
      isWineDetailPage: pathname?.startsWith('/wines/') && pathname !== '/wines',
      isCartPage: pathname === '/cart',
    },
  })

  // Provide current wine context if on detail page
  useCopilotReadable({
    description: 'The wine currently being viewed (if on a wine detail page)',
    value: currentWine ? {
      name: currentWine.name,
      fullName: `${currentWine.vintage || ''} ${currentWine.name}`.trim(),
      winery: currentWine.winery,
      region: currentWine.region,
      country: currentWine.country,
      price: currentWine.price_retail ? `£${currentWine.price_retail}` : 'Price on request',
      slug: currentWine.slug,
      canAddToCart: !!currentWine.shopify_product_id,
    } : null,
  })

  // Provide search results
  useCopilotReadable({
    description: 'Recent wine search results from user queries',
    value: searchResults.length > 0 ? searchResults.map(w => ({
      name: w.name,
      vintage: w.vintage,
      winery: w.winery,
      region: w.region,
      price: w.price_retail ? `£${w.price_retail}` : 'Price on request',
      slug: w.slug,
    })) : null,
  })

  // Provide cart state
  useCopilotReadable({
    description: 'Shopping cart status',
    value: {
      itemCount: cartCount,
      hasCart: !!cartId,
    },
  })

  // Provide platform/merchant config so Vic can answer shipping, availability, returns questions
  useCopilotReadable({
    description: 'Platform merchant configuration - availability status, shipping policy, and return policy for Aionysus wines',
    value: platformConfig,
  })

  // ============ COPILOTKIT ACTIONS ============

  // Action: Search wines
  useFrontendTool({
    name: 'search_wines',
    description: 'Search for wines by name, region, producer, grape variety, or price. Use this when the user wants to find wines.',
    parameters: [
      { name: 'query', type: 'string', description: 'Search term (name, producer, grape)', required: false },
      { name: 'region', type: 'string', description: 'Wine region filter (e.g., Burgundy, Bordeaux, Champagne)', required: false },
      { name: 'country', type: 'string', description: 'Country filter (e.g., France, England, Italy)', required: false },
      { name: 'max_price', type: 'number', description: 'Maximum price in GBP', required: false },
      { name: 'min_price', type: 'number', description: 'Minimum price in GBP', required: false },
    ],
    handler: async ({ query, region, country, max_price, min_price }) => {
      const params = new URLSearchParams()
      if (query) params.set('q', query)
      if (region) params.set('region', region)
      if (country) params.set('country', country)
      if (max_price) params.set('max_price', max_price.toString())
      if (min_price) params.set('min_price', min_price.toString())
      params.set('limit', '8')

      try {
        const res = await fetch(`/api/wines?${params}`)
        const data = await res.json()
        const wines = Array.isArray(data) ? data : []
        setSearchResults(wines)

        return {
          success: true,
          count: wines.length,
          wines: wines.slice(0, 6).map((w: Wine) => ({
            name: `${w.vintage || ''} ${w.name}`.trim(),
            winery: w.winery,
            region: w.region,
            country: w.country,
            price: w.price_retail ? `£${w.price_retail}` : 'Price on request',
            slug: w.slug,
            canAddToCart: !!w.shopify_product_id,
          })),
          message: wines.length > 0
            ? `Found ${wines.length} wines. Here are the top results.`
            : 'No wines found matching those criteria.',
        }
      } catch (error) {
        return { success: false, error: 'Failed to search wines' }
      }
    },
  })

  // Action: Get wine details
  useFrontendTool({
    name: 'get_wine_details',
    description: 'Get detailed information about a specific wine by its slug. Use this when user wants more info about a wine.',
    parameters: [
      { name: 'slug', type: 'string', description: 'Wine slug (URL identifier)', required: true },
    ],
    handler: async ({ slug }) => {
      try {
        const res = await fetch(`/api/wines?slug=${slug}`)
        const wine = await res.json()

        if (wine.error || !wine.id) {
          return { success: false, error: 'Wine not found' }
        }

        return {
          success: true,
          wine: {
            name: `${wine.vintage || ''} ${wine.name}`.trim(),
            winery: wine.winery,
            region: wine.region,
            country: wine.country,
            grape: wine.grape_variety,
            classification: wine.classification,
            price: wine.price_retail ? `£${wine.price_retail}` : 'Price on request',
            bottleSize: wine.bottle_size,
            tastingNotes: wine.tasting_notes?.replace(/<[^>]*>/g, '').slice(0, 300),
            slug: wine.slug,
            canAddToCart: !!wine.shopify_product_id,
            viewUrl: `/wines/${wine.slug}`,
          },
        }
      } catch (error) {
        return { success: false, error: 'Failed to get wine details' }
      }
    },
  })

  // Action: Add wine to cart
  useFrontendTool({
    name: 'add_to_cart',
    description: 'Add a wine to the shopping cart. Use this when the user wants to buy a wine or says "add to cart", "buy this", etc.',
    parameters: [
      { name: 'wine_slug', type: 'string', description: 'The wine slug to add to cart', required: true },
      { name: 'quantity', type: 'number', description: 'Quantity to add (default 1)', required: false },
    ],
    handler: async ({ wine_slug, quantity = 1 }) => {
      try {
        const cid = await getOrCreateCart()
        if (!cid) return { success: false, error: 'Could not create cart' }

        // Get wine details to find Shopify product ID
        const wineRes = await fetch(`/api/wines?slug=${wine_slug}`)
        const wine = await wineRes.json()

        if (!wine || wine.error) {
          return { success: false, error: 'Wine not found' }
        }

        if (!wine.shopify_product_id) {
          return {
            success: false,
            error: 'This wine is not available for purchase yet',
            message: `${wine.name} is in our catalog but not yet available in the shop. Check back soon!`
          }
        }

        // Add to cart via API
        const cartRes = await fetch('/api/cart/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cartId: cid,
            productId: wine.shopify_product_id,
            quantity,
          }),
        })
        const cart = await cartRes.json()

        if (cart.error) {
          return { success: false, error: cart.error }
        }

        if (cart.totalQuantity) {
          setCartCount(cart.totalQuantity)
        }

        return {
          success: true,
          message: `Added ${wine.name} to your cart!`,
          wine: wine.name,
          price: wine.price_retail ? `£${wine.price_retail}` : 'Price on request',
          cartTotal: cart.totalQuantity || quantity,
          checkoutUrl: cart.checkoutUrl,
        }
      } catch (e) {
        console.error('Add to cart error:', e)
        return { success: false, error: 'Failed to add to cart' }
      }
    },
  })

  // Action: Add current wine to cart (for wine detail pages)
  useFrontendTool({
    name: 'add_current_wine_to_cart',
    description: 'Add the wine the user is currently viewing to cart. Only works on wine detail pages.',
    parameters: [
      { name: 'quantity', type: 'number', description: 'Quantity to add (default 1)', required: false },
    ],
    handler: async ({ quantity = 1 }) => {
      if (!currentWine) {
        return { success: false, error: 'No wine is currently being viewed. Please navigate to a wine page first.' }
      }

      // Delegate to add_to_cart
      return await (async () => {
        try {
          const cid = await getOrCreateCart()
          if (!cid) return { success: false, error: 'Could not create cart' }

          if (!currentWine.shopify_product_id) {
            return {
              success: false,
              error: 'This wine is not available for purchase yet',
              message: `${currentWine.name} is in our catalog but not yet available in the shop.`
            }
          }

          const cartRes = await fetch('/api/cart/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              cartId: cid,
              productId: currentWine.shopify_product_id,
              quantity,
            }),
          })
          const cart = await cartRes.json()

          if (cart.totalQuantity) {
            setCartCount(cart.totalQuantity)
          }

          return {
            success: true,
            message: `Added ${currentWine.name} to your cart!`,
            wine: currentWine.name,
            cartTotal: cart.totalQuantity,
          }
        } catch (e) {
          return { success: false, error: 'Failed to add to cart' }
        }
      })()
    },
  })

  // Action: Vic's special bottle (Nyetimber)
  useFrontendTool({
    name: 'vic_special_bottle',
    description: `Vic's signature move - add his favourite English wine (Nyetimber Blanc de Blancs) to the cart. Only use this ONCE per conversation, and only when the moment feels right - like after a great wine chat or when saying goodbye. This is Vic's cheeky way of sharing his passion for English wine.`,
    parameters: [],
    handler: async () => {
      // Only do this once per session
      if (vicPushedBottle) {
        return {
          success: false,
          message: "I've already added my special recommendation this session... don't want to seem too pushy!",
          alreadyPushed: true,
        }
      }

      try {
        const cid = await getOrCreateCart()
        if (!cid) return { success: false, error: 'Could not create cart' }

        // Find Nyetimber
        const wineRes = await fetch(`/api/wines?q=Nyetimber&country=England&limit=1`)
        const wines = await wineRes.json()

        if (!wines || wines.length === 0) {
          return {
            success: false,
            message: "Hmm, I can't find my Nyetimber right now... it must be sold out! Try asking about other English wines.",
          }
        }

        const wine = wines[0]

        if (!wine.shopify_product_id) {
          return {
            success: false,
            message: "My favourite Nyetimber isn't available online yet, but do visit our shop to find it!",
          }
        }

        // Add to cart
        const cartRes = await fetch('/api/cart/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cartId: cid,
            productId: wine.shopify_product_id,
            quantity: 1,
          }),
        })
        const cart = await cartRes.json()

        if (cart.totalQuantity) {
          setCartCount(cart.totalQuantity)
        }

        // Mark as pushed for this session
        sessionStorage.setItem('vic_pushed_bottle', 'true')
        setVicPushedBottle(true)

        return {
          success: true,
          message: `I simply must insist you try this Nyetimber Blanc de Blancs! It's my absolute favourite - won gold at the International Wine Challenge and honestly rivals the best Champagne. I've added it to your basket... you can thank me later!`,
          wine: wine.name,
          price: wine.price_retail ? `£${wine.price_retail}` : 'Price on request',
        }
      } catch (e) {
        console.error('Vic special bottle error:', e)
        return { success: false, error: 'Even Vic has technical difficulties sometimes!' }
      }
    },
  })

  // Action: View cart
  useFrontendTool({
    name: 'view_cart',
    description: 'Navigate to the shopping cart page. Use when user wants to see their cart or checkout.',
    parameters: [],
    handler: async () => {
      if (typeof window !== 'undefined') {
        window.location.href = '/cart'
      }
      return {
        success: true,
        message: 'Taking you to your cart...',
        itemCount: cartCount,
      }
    },
  })

  // Action: Browse wines
  useFrontendTool({
    name: 'browse_wines',
    description: 'Navigate to the wines page with optional filters. Use when user wants to browse or explore wines.',
    parameters: [
      { name: 'region', type: 'string', description: 'Filter by region', required: false },
      { name: 'country', type: 'string', description: 'Filter by country', required: false },
    ],
    handler: async ({ region, country }) => {
      const params = new URLSearchParams()
      if (region) params.set('region', region)
      if (country) params.set('country', country)

      const url = `/wines${params.toString() ? '?' + params.toString() : ''}`

      if (typeof window !== 'undefined') {
        window.location.href = url
      }

      return {
        success: true,
        message: region || country
          ? `Taking you to browse ${region || country} wines...`
          : 'Taking you to our wine collection...',
        url,
      }
    },
  })

  // Action: View specific wine
  useFrontendTool({
    name: 'view_wine',
    description: 'Navigate to a specific wine detail page. Use when user wants to see more about a wine.',
    parameters: [
      { name: 'slug', type: 'string', description: 'Wine slug', required: true },
    ],
    handler: async ({ slug }) => {
      const url = `/wines/${slug}`

      if (typeof window !== 'undefined') {
        window.location.href = url
      }

      return {
        success: true,
        message: 'Taking you to the wine page...',
        url,
      }
    },
  })

  return null // This component only provides actions, no UI
}
