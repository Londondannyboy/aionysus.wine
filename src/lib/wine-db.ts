/**
 * Wine Database Queries
 * Connects to Neon PostgreSQL database with 3,906 wines from Goedhuis Waddesdon
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export interface Wine {
  id: number
  name: string
  slug: string
  winery: string
  region: string
  country: string
  grape_variety: string | null
  vintage: number | null
  wine_type: string | null
  style: string | null
  color: string | null
  price_retail: number | null
  price_trade: number | null
  bottle_size: string | null
  tasting_notes: string | null
  image_url: string | null
  stock_quantity: number | null
  case_size: number | null
  classification: string | null
  original_url: string | null
  aionysus_url: string | null
  shopify_product_id: string | null
}

export interface WineSearchParams {
  query?: string
  region?: string
  country?: string
  wine_type?: string
  color?: string
  min_price?: number
  max_price?: number
  vintage?: number
  limit?: number
}

/**
 * Get all wines (with optional limit)
 */
export async function getAllWines(limit: number = 100): Promise<Wine[]> {
  const wines = await sql`
    SELECT id, name, slug, winery, region, country, grape_variety,
           vintage, wine_type, style, color, price_retail, price_trade,
           bottle_size, tasting_notes, image_url, stock_quantity,
           case_size, classification, original_url, aionysus_url, shopify_product_id
    FROM wines
    WHERE is_active = true
    ORDER BY name ASC
    LIMIT ${limit}
  `
  return wines as Wine[]
}

/**
 * Get wine by slug (for detail pages)
 */
export async function getWineBySlug(slug: string): Promise<Wine | null> {
  const wines = await sql`
    SELECT id, name, slug, winery, region, country, grape_variety,
           vintage, wine_type, style, color, price_retail, price_trade,
           bottle_size, tasting_notes, image_url, stock_quantity,
           case_size, classification, original_url, aionysus_url, shopify_product_id
    FROM wines
    WHERE slug = ${slug} AND is_active = true
    LIMIT 1
  `
  return wines.length > 0 ? (wines[0] as Wine) : null
}

/**
 * Get wine by ID
 */
export async function getWineById(id: number): Promise<Wine | null> {
  const wines = await sql`
    SELECT id, name, slug, winery, region, country, grape_variety,
           vintage, wine_type, style, color, price_retail, price_trade,
           bottle_size, tasting_notes, image_url, stock_quantity,
           case_size, classification, original_url, aionysus_url, shopify_product_id
    FROM wines
    WHERE id = ${id} AND is_active = true
    LIMIT 1
  `
  return wines.length > 0 ? (wines[0] as Wine) : null
}

/**
 * Search wines with filters
 */
export async function searchWines(params: WineSearchParams): Promise<Wine[]> {
  const {
    query,
    region,
    country,
    wine_type,
    color,
    min_price,
    max_price,
    vintage,
    limit = 50
  } = params

  // Build dynamic query - fetch all and filter in app for simplicity
  const allWines = await sql`
    SELECT id, name, slug, winery, region, country, grape_variety,
           vintage, wine_type, style, color, price_retail, price_trade,
           bottle_size, tasting_notes, image_url, stock_quantity,
           case_size, classification, original_url, aionysus_url, shopify_product_id
    FROM wines
    WHERE is_active = true
    ORDER BY price_retail ASC NULLS LAST
  `

  let filtered = allWines as Wine[]

  if (query) {
    const q = query.toLowerCase()
    filtered = filtered.filter(w =>
      w.name?.toLowerCase().includes(q) ||
      w.winery?.toLowerCase().includes(q) ||
      w.region?.toLowerCase().includes(q) ||
      w.grape_variety?.toLowerCase().includes(q)
    )
  }

  if (region) {
    filtered = filtered.filter(w =>
      w.region?.toLowerCase().includes(region.toLowerCase())
    )
  }

  if (country) {
    filtered = filtered.filter(w =>
      w.country?.toLowerCase().includes(country.toLowerCase())
    )
  }

  if (wine_type) {
    filtered = filtered.filter(w =>
      w.wine_type?.toLowerCase() === wine_type.toLowerCase()
    )
  }

  if (color) {
    filtered = filtered.filter(w =>
      w.color?.toLowerCase() === color.toLowerCase()
    )
  }

  if (min_price) {
    filtered = filtered.filter(w =>
      w.price_retail && w.price_retail >= min_price
    )
  }

  if (max_price) {
    filtered = filtered.filter(w =>
      w.price_retail && w.price_retail <= max_price
    )
  }

  if (vintage) {
    filtered = filtered.filter(w => w.vintage === vintage)
  }

  return filtered.slice(0, limit)
}

/**
 * Get wines by region
 */
export async function getWinesByRegion(region: string, limit: number = 20): Promise<Wine[]> {
  const wines = await sql`
    SELECT id, name, slug, winery, region, country, grape_variety,
           vintage, wine_type, style, color, price_retail, image_url
    FROM wines
    WHERE region ILIKE ${'%' + region + '%'} AND is_active = true
    ORDER BY price_retail ASC NULLS LAST
    LIMIT ${limit}
  `
  return wines as Wine[]
}

/**
 * Get wines by producer/winery
 */
export async function getWinesByProducer(producer: string, limit: number = 20): Promise<Wine[]> {
  const wines = await sql`
    SELECT id, name, slug, winery, region, country, grape_variety,
           vintage, wine_type, style, color, price_retail, image_url
    FROM wines
    WHERE winery ILIKE ${'%' + producer + '%'} AND is_active = true
    ORDER BY vintage DESC NULLS LAST
    LIMIT ${limit}
  `
  return wines as Wine[]
}

/**
 * Get unique regions for filtering
 */
export async function getRegions(): Promise<string[]> {
  const results = await sql`
    SELECT DISTINCT region
    FROM wines
    WHERE region IS NOT NULL AND is_active = true
    ORDER BY region
  `
  return results.map(r => r.region as string)
}

/**
 * Get unique producers for filtering
 */
export async function getProducers(): Promise<string[]> {
  const results = await sql`
    SELECT DISTINCT winery
    FROM wines
    WHERE winery IS NOT NULL AND is_active = true
    ORDER BY winery
  `
  return results.map(r => r.winery as string)
}

/**
 * Get wine statistics
 */
export async function getWineStats() {
  const stats = await sql`
    SELECT
      COUNT(*) as total_wines,
      COUNT(DISTINCT region) as unique_regions,
      COUNT(DISTINCT winery) as unique_producers,
      COUNT(DISTINCT vintage) as unique_vintages,
      MIN(price_retail) as min_price,
      MAX(price_retail) as max_price,
      AVG(price_retail) as avg_price
    FROM wines
    WHERE is_active = true
  `
  return stats[0]
}

/**
 * Format price for display
 */
export function formatPrice(price: number | null): string {
  if (!price) return 'Price on request'
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP'
  }).format(price)
}
