/**
 * Shopify Product Sync Script
 *
 * Syncs 3,906 wines from Neon PostgreSQL to Shopify via Admin API
 *
 * Usage: npx tsx scripts/sync-shopify-products.ts [--dry-run] [--limit=N]
 */

import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const DATABASE_URL = process.env.DATABASE_URL!
const SHOPIFY_STORE_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN!
const SHOPIFY_ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN!

const sql = neon(DATABASE_URL)

// Shopify Admin API rate limit: 2 requests/second for basic stores
const RATE_LIMIT_DELAY = 600 // ms between requests
const BATCH_SIZE = 50

interface Wine {
  id: number
  name: string
  slug: string
  winery: string | null
  region: string | null
  country: string | null
  grape_variety: string | null
  vintage: number | null
  wine_type: string | null
  price_retail: number | null
  bottle_size: string | null
  tasting_notes: string | null
  image_url: string | null
  classification: string | null
  shopify_product_id: string | null
}

interface WineVariant {
  id: number
  wine_id: number
  variant_name: string | null
  price_gbp: number | null
  is_in_stock: boolean
  variant_sku: string | null
  tax_status: string | null
}

interface ShopifyProduct {
  product: {
    title: string
    body_html: string
    vendor: string
    product_type: string
    tags: string[]
    variants: ShopifyVariant[]
    images?: { src: string }[]
  }
}

interface ShopifyVariant {
  title: string
  price: string
  sku: string
  inventory_management: string
  inventory_policy: string
  requires_shipping: boolean
  taxable: boolean
  option1?: string
}

async function shopifyAdminFetch(endpoint: string, method: string = 'GET', body?: unknown) {
  const url = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/${endpoint}`

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Shopify API error: ${response.status} - ${errorText}`)
  }

  return response.json()
}

async function getWinesWithoutShopifyId(limit: number): Promise<Wine[]> {
  const wines = await sql`
    SELECT id, name, slug, winery, region, country, grape_variety,
           vintage, wine_type, price_retail, bottle_size, tasting_notes,
           image_url, classification, shopify_product_id
    FROM wines
    WHERE is_active = true AND (shopify_product_id IS NULL OR shopify_product_id = '')
    ORDER BY id ASC
    LIMIT ${limit}
  `
  return wines as Wine[]
}

async function getVariantsForWine(wineId: number): Promise<WineVariant[]> {
  const variants = await sql`
    SELECT id, wine_id, variant_name, price_gbp, is_in_stock, variant_sku, tax_status
    FROM wine_price_variants
    WHERE wine_id = ${wineId}
    ORDER BY price_gbp ASC
  `
  return variants as WineVariant[]
}

function buildProductTags(wine: Wine): string[] {
  const tags: string[] = []

  if (wine.region) tags.push(wine.region)
  if (wine.country) tags.push(wine.country)
  if (wine.grape_variety) tags.push(wine.grape_variety)
  if (wine.vintage) tags.push(`Vintage ${wine.vintage}`)
  if (wine.wine_type) tags.push(wine.wine_type)
  if (wine.classification) tags.push(wine.classification)

  // Add English wine tag for UK wines
  if (wine.country?.toLowerCase() === 'england' || wine.country?.toLowerCase() === 'uk') {
    tags.push('English Wine')
    tags.push("Vic's Pick")
  }

  return tags
}

function buildProductDescription(wine: Wine): string {
  const parts: string[] = []

  if (wine.tasting_notes) {
    parts.push(`<p>${wine.tasting_notes}</p>`)
  }

  const details: string[] = []
  if (wine.winery) details.push(`<strong>Producer:</strong> ${wine.winery}`)
  if (wine.region) details.push(`<strong>Region:</strong> ${wine.region}`)
  if (wine.country) details.push(`<strong>Country:</strong> ${wine.country}`)
  if (wine.grape_variety) details.push(`<strong>Grape:</strong> ${wine.grape_variety}`)
  if (wine.vintage) details.push(`<strong>Vintage:</strong> ${wine.vintage}`)
  if (wine.classification) details.push(`<strong>Classification:</strong> ${wine.classification}`)
  if (wine.bottle_size) details.push(`<strong>Size:</strong> ${wine.bottle_size}`)

  if (details.length > 0) {
    parts.push(`<ul>${details.map(d => `<li>${d}</li>`).join('')}</ul>`)
  }

  return parts.join('\n') || '<p>Fine wine from our curated collection.</p>'
}

function wineToShopifyProduct(wine: Wine, variants: WineVariant[]): ShopifyProduct {
  // Build title with vintage if available
  const title = wine.vintage
    ? `${wine.vintage} ${wine.name}`
    : wine.name

  // Build variants for Shopify
  const shopifyVariants: ShopifyVariant[] = []

  if (variants.length > 0) {
    for (const v of variants) {
      const price = parseFloat(String(v.price_gbp || wine.price_retail || 0)) || 0
      shopifyVariants.push({
        title: v.variant_name || 'Standard',
        price: price.toFixed(2),
        sku: v.variant_sku || `WINE-${wine.id}-${v.id}`,
        inventory_management: 'shopify',
        inventory_policy: 'continue', // Allow overselling
        requires_shipping: true,
        taxable: v.tax_status !== 'IB', // In Bond wines are tax-free
        option1: v.variant_name || 'Standard',
      })
    }
  } else {
    // No variants - create default
    const price = parseFloat(String(wine.price_retail || 0)) || 0
    shopifyVariants.push({
      title: 'Standard',
      price: price.toFixed(2),
      sku: `WINE-${wine.id}`,
      inventory_management: 'shopify',
      inventory_policy: 'continue',
      requires_shipping: true,
      taxable: true,
      option1: 'Standard',
    })
  }

  const product: ShopifyProduct = {
    product: {
      title,
      body_html: buildProductDescription(wine),
      vendor: wine.winery || 'Aionysus Wine',
      product_type: wine.wine_type || 'Wine',
      tags: buildProductTags(wine),
      variants: shopifyVariants,
    }
  }

  // Add image if available and appears valid
  // Skip images that are likely invalid (data URIs, local paths, etc.)
  if (wine.image_url &&
      wine.image_url.startsWith('http') &&
      !wine.image_url.includes('localhost') &&
      !wine.image_url.includes('127.0.0.1')) {
    product.product.images = [{ src: wine.image_url }]
  }

  return product
}

async function createShopifyProduct(product: ShopifyProduct): Promise<string> {
  const result = await shopifyAdminFetch('products.json', 'POST', product)
  return result.product.id.toString()
}

async function updateWineWithShopifyId(wineId: number, shopifyId: string): Promise<void> {
  await sql`
    UPDATE wines
    SET shopify_product_id = ${shopifyId}
    WHERE id = ${wineId}
  `
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const limitArg = args.find(a => a.startsWith('--limit='))
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 3906

  console.log('='.repeat(60))
  console.log('Shopify Product Sync')
  console.log('='.repeat(60))
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`)
  console.log(`Limit: ${limit} wines`)
  console.log(`Store: ${SHOPIFY_STORE_DOMAIN}`)
  console.log('='.repeat(60))

  if (!SHOPIFY_ADMIN_TOKEN) {
    console.error('ERROR: SHOPIFY_ADMIN_API_TOKEN not set')
    process.exit(1)
  }

  // Get wines without Shopify IDs
  console.log('\nFetching wines without Shopify product IDs...')
  const wines = await getWinesWithoutShopifyId(limit)
  console.log(`Found ${wines.length} wines to sync`)

  if (wines.length === 0) {
    console.log('No wines to sync!')
    return
  }

  let synced = 0
  let failed = 0
  const errors: { wine: string; error: string }[] = []

  for (const wine of wines) {
    try {
      // Get variants for this wine
      const variants = await getVariantsForWine(wine.id)

      // Build Shopify product
      const product = wineToShopifyProduct(wine, variants)

      console.log(`\n[${synced + failed + 1}/${wines.length}] ${wine.name}`)
      console.log(`  Variants: ${variants.length}`)
      console.log(`  Tags: ${product.product.tags.join(', ')}`)

      if (dryRun) {
        console.log(`  [DRY RUN] Would create product`)
        synced++
      } else {
        // Create product in Shopify
        const shopifyId = await createShopifyProduct(product)
        console.log(`  Created: ${shopifyId}`)

        // Update database
        await updateWineWithShopifyId(wine.id, shopifyId)
        console.log(`  Updated database`)

        synced++

        // Rate limiting
        await sleep(RATE_LIMIT_DELAY)
      }
    } catch (error) {
      failed++
      const errorMsg = error instanceof Error ? error.message : String(error)
      errors.push({ wine: wine.name, error: errorMsg })
      console.error(`  ERROR: ${errorMsg}`)

      // Continue after error, but slow down
      await sleep(RATE_LIMIT_DELAY * 2)
    }

    // Progress update every 100
    if ((synced + failed) % 100 === 0) {
      console.log(`\n--- Progress: ${synced} synced, ${failed} failed ---\n`)
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('SYNC COMPLETE')
  console.log('='.repeat(60))
  console.log(`Total wines: ${wines.length}`)
  console.log(`Synced: ${synced}`)
  console.log(`Failed: ${failed}`)

  if (errors.length > 0) {
    console.log('\nErrors:')
    errors.forEach(e => console.log(`  - ${e.wine}: ${e.error}`))
  }

  // Estimate time for full sync
  if (dryRun && wines.length < limit) {
    const totalWines = 3906
    const estimatedSeconds = totalWines * (RATE_LIMIT_DELAY / 1000)
    const estimatedMinutes = Math.ceil(estimatedSeconds / 60)
    console.log(`\nEstimated time for full sync: ~${estimatedMinutes} minutes`)
  }
}

main().catch(console.error)
