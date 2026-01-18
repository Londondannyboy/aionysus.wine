/**
 * English Wine Scraper - Grape Britannia
 *
 * Scrapes English sparkling wines from grapebritannia.co.uk
 * and adds them to the Aionysus database
 *
 * Usage: npx tsx scripts/scrape-english-wines.ts
 */

import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const sql = neon(process.env.DATABASE_URL!)

const BASE_URL = 'https://www.grapebritannia.co.uk/product-category/english-sparkling-wines/'
const RATE_LIMIT_DELAY = 1000

interface ScrapedWine {
  name: string
  price: number | null
  description: string | null
  url: string
  image_url: string | null
  winery: string | null
  vintage: number | null
}

function extractVintage(name: string): number | null {
  const match = name.match(/\b(19|20)\d{2}\b/)
  return match ? parseInt(match[0]) : null
}

function extractWinery(name: string): string | null {
  // Common English wine producers
  const producers = [
    'Nyetimber', 'Chapel Down', 'Gusbourne', 'Ridgeview', 'Bolney',
    'Albourne Estate', 'Ambriel', 'Ancre Hill', 'Ashling Park', 'Balfour',
    'Hush Heath', 'Camel Valley', 'Hambledon', 'Exton Park', 'Wiston',
    'Rathfinny', 'Coates & Seely', 'Digby', 'Harrow & Hope', 'Bride Valley',
    'Langham', 'Jenkyn Place', 'Hattingley', 'Black Chalk', 'Furleigh',
    'Greyfriars', 'Herbert Hall', 'Hundred Hills', 'Lyme Bay', 'Squerryes',
    'Tillingham', 'Westwell', 'Sugrue', 'Stopham', 'Davenport', 'Court Garden',
    'Breaky Bottom', 'Defined Wine', 'Danbury Ridge', 'Essex Wine'
  ]

  for (const producer of producers) {
    if (name.toLowerCase().includes(producer.toLowerCase())) {
      return producer
    }
  }

  // Try to extract first words before common terms
  const beforeTerms = name.split(/\s+(Blanc|Brut|Rosé|Classic|Reserve|Sparkling|NV|MV)/i)[0]
  if (beforeTerms && beforeTerms.length > 2 && beforeTerms.length < 50) {
    return beforeTerms.trim()
  }

  return null
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 200)
}

async function fetchPage(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }
  })
  return response.text()
}

function parseProducts(html: string): ScrapedWine[] {
  const wines: ScrapedWine[] = []

  // Look for WooCommerce product items specifically
  // Pattern: <li class="... product type-product ..."> with product URL containing /product/
  const productPattern = /<li[^>]*class="[^"]*\bproduct\b[^"]*type-product[^"]*"[^>]*>([\s\S]*?)<\/li>/gi
  const productMatches = html.matchAll(productPattern)

  for (const match of productMatches) {
    const productHtml = match[1]

    // Must have a product URL (not category)
    const urlMatch = productHtml.match(/href="(https?:\/\/[^"]*\/product\/[^"]+)"/i)
    if (!urlMatch) continue

    const url = urlMatch[1]

    // Extract name from woocommerce-loop-product__title
    const nameMatch = productHtml.match(/woocommerce-loop-product__title[^>]*>([^<]+)</i)
      || productHtml.match(/<h2[^>]*>([^<]+)<\/h2>/i)

    if (!nameMatch) continue

    const name = nameMatch[1].trim()
      .replace(/&amp;/g, '&')
      .replace(/&#8217;/g, "'")
      .replace(/&#8211;/g, '-')
      .replace(/&nbsp;/g, ' ')

    // Skip if name looks like HTML or menu item
    if (name.includes('<') || name.includes('class=') || name.length < 10) continue

    // Extract price - look for the actual price span
    const priceMatch = productHtml.match(/woocommerce-Price-amount[^>]*>.*?£([\d,.]+)/i)
      || productHtml.match(/£([\d,.]+)/)
    const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '')) : null

    // Extract image - prefer data-src for lazy loaded images
    const imageMatch = productHtml.match(/data-src="(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i)
      || productHtml.match(/<img[^>]*src="(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i)
    const image_url = imageMatch ? imageMatch[1] : null

    // Extract short description if available
    const descMatch = productHtml.match(/short-description[^>]*>([\s\S]*?)<\/div>/i)
    let description = descMatch ? descMatch[1].replace(/<[^>]+>/g, '').trim() : null
    if (description && description.length > 500) description = description.substring(0, 500)

    wines.push({
      name,
      price,
      description,
      url,
      image_url,
      winery: extractWinery(name),
      vintage: extractVintage(name)
    })
  }

  return wines
}

function getNextPageUrl(html: string, currentPage: number): string | null {
  const nextPage = currentPage + 1
  const nextMatch = html.match(new RegExp(`page/${nextPage}/?["']`, 'i'))
  if (nextMatch) {
    return `${BASE_URL}page/${nextPage}/`
  }
  return null
}

async function insertWine(wine: ScrapedWine): Promise<boolean> {
  try {
    const slug = generateSlug(wine.name)

    // Skip invalid entries (menu items, etc.)
    if (!wine.name || wine.name.length < 5 || wine.name.includes('class=') || wine.name.includes('<')) {
      return false
    }

    // Check if already exists
    const existing = await sql`SELECT id FROM wines_original WHERE aionysus_slug = ${slug}`
    if (existing.length > 0) {
      console.log(`  Skipped (exists): ${wine.name}`)
      return false
    }

    // Insert wine
    const result = await sql`
      INSERT INTO wines_original (
        title, wine_name, producer, region, country, grape_varieties,
        vintage, tasting_notes, original_image_url, original_url,
        aionysus_slug, availability_status, bottle_size_cl
      ) VALUES (
        ${wine.name},
        ${wine.name},
        ${wine.winery},
        ${'Sussex'},
        ${'England'},
        ${['Chardonnay', 'Pinot Noir', 'Pinot Meunier']},
        ${wine.vintage},
        ${wine.description},
        ${wine.image_url},
        ${wine.url},
        ${slug},
        ${'in_stock'},
        ${75}
      )
      RETURNING id
    `

    const wineId = result[0].id

    // Insert price variant if we have a price
    if (wine.price && wineId) {
      await sql`
        INSERT INTO wine_price_variants (
          wine_id, variant_name, price_gbp, is_in_stock, tax_status, price_type
        ) VALUES (
          ${wineId},
          ${'Bottle'},
          ${wine.price},
          ${true},
          ${'IncVAT'},
          ${'retail'}
        )
      `
    }

    return true
  } catch (error) {
    console.error(`  Error inserting ${wine.name}: ${error}`)
    return false
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  console.log('='.repeat(60))
  console.log('English Wine Scraper - Grape Britannia')
  console.log('='.repeat(60))
  console.log(`Source: ${BASE_URL}`)
  console.log('='.repeat(60))

  const allWines: ScrapedWine[] = []
  let currentUrl: string | null = BASE_URL
  let pageNum = 1

  // Scrape all pages
  while (currentUrl) {
    console.log(`\nFetching page ${pageNum}...`)
    const html = await fetchPage(currentUrl)
    const wines = parseProducts(html)
    console.log(`  Found ${wines.length} products`)

    allWines.push(...wines)

    currentUrl = getNextPageUrl(html, pageNum)
    pageNum++

    if (currentUrl) {
      await sleep(RATE_LIMIT_DELAY)
    }
  }

  console.log(`\n${'='.repeat(60)}`)
  console.log(`Total wines scraped: ${allWines.length}`)
  console.log('='.repeat(60))

  // Insert into database
  console.log('\nInserting into database...\n')

  let inserted = 0
  let skipped = 0

  for (const wine of allWines) {
    console.log(`[${inserted + skipped + 1}/${allWines.length}] ${wine.name}`)
    console.log(`  £${wine.price || 'N/A'} | ${wine.winery || 'Unknown producer'}`)

    const success = await insertWine(wine)
    if (success) {
      inserted++
      console.log(`  ✓ Inserted`)
    } else {
      skipped++
    }

    await sleep(100) // Small delay between DB inserts
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('SCRAPING COMPLETE')
  console.log('='.repeat(60))
  console.log(`Total scraped: ${allWines.length}`)
  console.log(`Inserted: ${inserted}`)
  console.log(`Skipped: ${skipped}`)

  // Show sample of English wines
  const samples = await sql`
    SELECT name, winery, price_retail
    FROM wines_original
    WHERE country = 'England'
    ORDER BY price_retail DESC NULLS LAST
    LIMIT 10
  `

  console.log('\nTop English wines in database:')
  for (const s of samples) {
    console.log(`  £${s.price_retail || 'N/A'} - ${s.name} (${s.winery || 'Unknown'})`)
  }

  // Reminder to seed investment data
  console.log('\n⚠️  Remember to run setup-investment-data.ts to add investment metrics for new wines!')
}

main().catch(console.error)
