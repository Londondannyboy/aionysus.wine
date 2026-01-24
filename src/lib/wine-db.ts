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
  image_credit: string | null
  image_credit_url: string | null
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
           case_size, classification, original_url, aionysus_url, shopify_product_id,
           image_credit, image_credit_url
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
           case_size, classification, original_url, aionysus_url, shopify_product_id,
           image_credit, image_credit_url
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
           case_size, classification, original_url, aionysus_url, shopify_product_id,
           image_credit, image_credit_url
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
           case_size, classification, original_url, aionysus_url, shopify_product_id,
           image_credit, image_credit_url
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

/**
 * Wine Investment Data
 */
export interface WineInvestmentData {
  wine_id: number
  price_2020: number | null
  price_2021: number | null
  price_2022: number | null
  price_2023: number | null
  price_2024: number | null
  price_2025: number | null
  annual_return_pct: number | null
  volatility_score: number | null
  investment_rating: string | null
  liquidity_score: number | null
  projected_5yr_return: number | null
  analyst_recommendation: string | null
}

/**
 * Get investment data for a wine
 */
export async function getWineInvestmentData(wineId: number): Promise<WineInvestmentData | null> {
  const data = await sql`
    SELECT wine_id, price_2020, price_2021, price_2022, price_2023, price_2024, price_2025,
           annual_return_pct, volatility_score, investment_rating, liquidity_score,
           projected_5yr_return, analyst_recommendation
    FROM wine_investment_data
    WHERE wine_id = ${wineId}
    LIMIT 1
  `
  return data.length > 0 ? (data[0] as WineInvestmentData) : null
}

/**
 * Merchant Config (global platform settings for structured data / availability)
 */
export interface MerchantConfig {
  merchant_name: string
  merchant_url: string
  product_availability: string
  availability_label: string
  placeholder_image_url: string
  shipping_country_code: string
  shipping_handling_days_min: number
  shipping_handling_days_max: number
  shipping_cost_currency: string
  shipping_cost_value: number
  shipping_label: string
  return_policy_category: string
  return_days: number
  return_method: string
  price_currency: string
  platform_mode: string
}

let merchantConfigCache: { data: MerchantConfig; fetchedAt: number } | null = null
const CONFIG_TTL_MS = 5 * 60 * 1000 // 5 minutes

export async function getMerchantConfig(): Promise<MerchantConfig> {
  const now = Date.now()
  if (merchantConfigCache && (now - merchantConfigCache.fetchedAt) < CONFIG_TTL_MS) {
    return merchantConfigCache.data
  }

  const result = await sql`
    SELECT merchant_name, merchant_url, product_availability, availability_label,
           placeholder_image_url, shipping_country_code,
           shipping_handling_days_min, shipping_handling_days_max,
           shipping_cost_currency, shipping_cost_value, shipping_label,
           return_policy_category, return_days, return_method,
           price_currency, platform_mode
    FROM merchant_config
    WHERE id = 1
    LIMIT 1
  `

  const config = result[0] as MerchantConfig
  merchantConfigCache = { data: config, fetchedAt: now }
  return config
}

/**
 * Get wines by appellation/sub-region (exact name match in region field)
 */
export async function getWinesByAppellation(appellation: string, limit: number = 50): Promise<Wine[]> {
  const wines = await sql`
    SELECT id, name, slug, winery, region, country, grape_variety,
           vintage, wine_type, style, color, price_retail, price_trade,
           bottle_size, tasting_notes, image_url, stock_quantity,
           case_size, classification, original_url, aionysus_url, shopify_product_id,
           image_credit, image_credit_url
    FROM wines
    WHERE region ILIKE ${'%' + appellation + '%'} AND is_active = true
    ORDER BY vintage DESC NULLS LAST, price_retail DESC NULLS LAST
    LIMIT ${limit}
  `
  return wines as Wine[]
}

/**
 * Count wines by appellation/sub-region
 */
export async function countWinesByAppellation(appellation: string): Promise<number> {
  const result = await sql`
    SELECT COUNT(*) as count
    FROM wines
    WHERE region ILIKE ${'%' + appellation + '%'} AND is_active = true
  `
  return Number(result[0].count)
}

/**
 * Get similar wines by region or producer
 */
export async function getSimilarWines(
  wineId: number,
  region: string | null,
  winery: string | null,
  limit: number = 4
): Promise<Wine[]> {
  // Try to find wines from same region first, excluding current wine
  if (region) {
    const wines = await sql`
      SELECT id, name, slug, winery, region, country, grape_variety,
             vintage, wine_type, price_retail, image_url
      FROM wines
      WHERE region ILIKE ${region} AND id != ${wineId} AND is_active = true
      ORDER BY RANDOM()
      LIMIT ${limit}
    `
    if (wines.length >= limit) {
      return wines as Wine[]
    }
  }

  // Fallback to same producer
  if (winery) {
    const wines = await sql`
      SELECT id, name, slug, winery, region, country, grape_variety,
             vintage, wine_type, price_retail, image_url
      FROM wines
      WHERE winery ILIKE ${winery} AND id != ${wineId} AND is_active = true
      ORDER BY RANDOM()
      LIMIT ${limit}
    `
    if (wines.length > 0) {
      return wines as Wine[]
    }
  }

  // Fallback to random wines, preferring those with real web-accessible images
  const wines = await sql`
    SELECT id, name, slug, winery, region, country, grape_variety,
           vintage, wine_type, price_retail, image_url
    FROM wines
    WHERE id != ${wineId} AND is_active = true
      AND image_url IS NOT NULL
      AND image_url NOT LIKE '%placeholder%'
      AND image_url NOT LIKE '/Users/%'
    ORDER BY RANDOM()
    LIMIT ${limit}
  `
  if (wines.length >= limit) {
    return wines as Wine[]
  }

  // Final fallback if not enough wines with images
  const allWines = await sql`
    SELECT id, name, slug, winery, region, country, grape_variety,
           vintage, wine_type, price_retail, image_url
    FROM wines
    WHERE id != ${wineId} AND is_active = true
    ORDER BY RANDOM()
    LIMIT ${limit}
  `
  return allWines as Wine[]
}
