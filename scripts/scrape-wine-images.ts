/**
 * Wine Image Scraping Script
 *
 * Scrapes bottle images from the original merchant product pages for wines
 * that currently have placeholder images. Stores the image URL and
 * attribution in the database.
 *
 * Usage: npx tsx scripts/scrape-wine-images.ts [--limit N] [--dry-run]
 *
 * Options:
 *   --limit N    Process only N wines (default: all)
 *   --dry-run    Show what would be done without updating the database
 *   --id N       Process only the wine with this ID
 */

import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const sql = neon(process.env.DATABASE_URL!)

const DELAY_MS = 2000 // Rate limit: 2 seconds between requests
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'

interface WineRecord {
  id: number
  wine_name: string
  producer: string
  vintage: number | null
  original_url: string | null
  region: string | null
}

/**
 * Extract product image URL from an HTML page
 * Tries multiple common patterns used by wine merchant sites
 */
function extractImageFromHtml(html: string, baseUrl: string): string | null {
  // Pattern 1: Open Graph image meta tag
  const ogMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i)
    || html.match(/<meta\s+content="([^"]+)"\s+property="og:image"/i)
  if (ogMatch && !isPlaceholder(ogMatch[1])) {
    return resolveUrl(ogMatch[1], baseUrl)
  }

  // Pattern 2: Twitter card image
  const twitterMatch = html.match(/<meta\s+name="twitter:image"\s+content="([^"]+)"/i)
    || html.match(/<meta\s+content="([^"]+)"\s+name="twitter:image"/i)
  if (twitterMatch && !isPlaceholder(twitterMatch[1])) {
    return resolveUrl(twitterMatch[1], baseUrl)
  }

  // Pattern 3: Product image in structured data (JSON-LD)
  const jsonLdMatch = html.match(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi)
  if (jsonLdMatch) {
    for (const match of jsonLdMatch) {
      try {
        const jsonContent = match.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '')
        const data = JSON.parse(jsonContent)
        const image = data.image || data?.offers?.image
        if (image && typeof image === 'string' && !isPlaceholder(image)) {
          return resolveUrl(image, baseUrl)
        }
        if (Array.isArray(image) && image.length > 0 && !isPlaceholder(image[0])) {
          return resolveUrl(image[0], baseUrl)
        }
      } catch {
        // Skip invalid JSON-LD
      }
    }
  }

  // Pattern 4: Main product image (common CSS classes)
  const productImgPatterns = [
    /class="[^"]*product[^"]*image[^"]*"[^>]*src="([^"]+)"/i,
    /class="[^"]*main[^"]*image[^"]*"[^>]*src="([^"]+)"/i,
    /id="[^"]*product[^"]*image[^"]*"[^>]*src="([^"]+)"/i,
    /data-zoom-image="([^"]+)"/i,
    /class="[^"]*gallery[^"]*"[^>]*src="([^"]+)"/i,
  ]

  for (const pattern of productImgPatterns) {
    const match = html.match(pattern)
    if (match && !isPlaceholder(match[1])) {
      return resolveUrl(match[1], baseUrl)
    }
  }

  // Pattern 5: First large image (likely product photo)
  const imgMatches = html.matchAll(/<img[^>]+src="([^"]+)"[^>]*>/gi)
  for (const match of imgMatches) {
    const src = match[1]
    if (src && isLikelyProductImage(src) && !isPlaceholder(src)) {
      return resolveUrl(src, baseUrl)
    }
  }

  return null
}

/**
 * Check if an image URL is likely a placeholder or icon
 */
function isPlaceholder(url: string): boolean {
  const lower = url.toLowerCase()
  return lower.includes('placeholder') ||
    lower.includes('no-image') ||
    lower.includes('noimage') ||
    lower.includes('default') ||
    lower.includes('logo') ||
    lower.includes('icon') ||
    lower.includes('1x1') ||
    lower.includes('spacer') ||
    lower.endsWith('.svg') ||
    lower.includes('data:image')
}

/**
 * Check if a URL looks like a product/wine bottle image
 */
function isLikelyProductImage(url: string): boolean {
  const lower = url.toLowerCase()
  // Must be a reasonable image format
  if (!lower.match(/\.(jpg|jpeg|png|webp)/)) return false
  // Must be reasonably sized (not tiny icons)
  if (lower.includes('thumb') && !lower.includes('large')) return false
  if (lower.includes('50x') || lower.includes('100x')) return false
  // Prefer larger images
  if (lower.includes('large') || lower.includes('800') || lower.includes('1000') || lower.includes('zoom')) return true
  return true
}

/**
 * Resolve relative URLs
 */
function resolveUrl(url: string, baseUrl: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  if (url.startsWith('//')) return 'https:' + url
  const base = new URL(baseUrl)
  if (url.startsWith('/')) return `${base.origin}${url}`
  return `${base.origin}/${url}`
}

/**
 * Get the merchant name from a URL
 */
function getMerchantName(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace('www.', '')
    const merchantMap: Record<string, string> = {
      'goedhuis.com': 'Goedhuis & Co',
      'wine-searcher.com': 'Wine-Searcher',
      'vivino.com': 'Vivino',
      'garrafeiranacional.com': 'Garrafeira Nacional',
      'winehouseportugal.com': 'Wine House Portugal',
      'justerinis.com': 'Justerini & Brooks',
      'bbr.com': 'Berry Bros & Rudd',
      'laywheeler.com': 'Lay & Wheeler',
      'tanners-wines.co.uk': 'Tanners Wines',
    }
    return merchantMap[hostname] || hostname.split('.')[0].charAt(0).toUpperCase() + hostname.split('.')[0].slice(1)
  } catch {
    return 'Merchant'
  }
}

/**
 * Fetch a page with timeout and error handling
 */
async function fetchPage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-GB,en;q=0.9',
      },
      signal: controller.signal,
      redirect: 'follow',
    })

    clearTimeout(timeout)

    if (!response.ok) {
      console.log(`  [${response.status}] Failed to fetch: ${url}`)
      return null
    }

    return await response.text()
  } catch (error) {
    console.log(`  [ERROR] ${error instanceof Error ? error.message : 'Unknown error'}: ${url}`)
    return null
  }
}

/**
 * Process a single wine: fetch its page and extract the image
 */
async function processWine(wine: WineRecord, dryRun: boolean): Promise<boolean> {
  if (!wine.original_url) {
    console.log(`  [SKIP] No original URL for: ${wine.wine_name}`)
    return false
  }

  console.log(`  Fetching: ${wine.original_url}`)
  const html = await fetchPage(wine.original_url)

  if (!html) return false

  const imageUrl = extractImageFromHtml(html, wine.original_url)

  if (!imageUrl) {
    console.log(`  [NO IMAGE] Could not find product image`)
    return false
  }

  const merchantName = getMerchantName(wine.original_url)
  console.log(`  [FOUND] ${imageUrl.substring(0, 80)}...`)
  console.log(`  [CREDIT] ${merchantName}`)

  if (!dryRun) {
    await sql`
      UPDATE wines_original
      SET our_image_url = ${imageUrl},
          image_credit = ${merchantName},
          image_credit_url = ${wine.original_url},
          is_placeholder_image = false,
          updated_at = NOW()
      WHERE id = ${wine.id}
    `
    console.log(`  [SAVED] Updated wine #${wine.id}`)
  } else {
    console.log(`  [DRY RUN] Would update wine #${wine.id}`)
  }

  return true
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const limitIdx = args.indexOf('--limit')
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1]) : null
  const idIdx = args.indexOf('--id')
  const specificId = idIdx >= 0 ? parseInt(args[idIdx + 1]) : null

  console.log('=== Wine Image Scraper ===')
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`)
  if (limit) console.log(`Limit: ${limit} wines`)
  if (specificId) console.log(`Specific ID: ${specificId}`)
  console.log('')

  // Fetch wines that need images
  let wines: WineRecord[]
  if (specificId) {
    wines = await sql`
      SELECT id, wine_name, producer, vintage, original_url, region
      FROM wines_original
      WHERE id = ${specificId}
    ` as WineRecord[]
  } else {
    const limitClause = limit || 100
    wines = await sql`
      SELECT id, wine_name, producer, vintage, original_url, region
      FROM wines_original
      WHERE is_placeholder_image = true
        AND original_url IS NOT NULL
      ORDER BY id ASC
      LIMIT ${limitClause}
    ` as WineRecord[]
  }

  console.log(`Found ${wines.length} wines to process\n`)

  let success = 0
  let failed = 0

  for (let i = 0; i < wines.length; i++) {
    const wine = wines[i]
    console.log(`[${i + 1}/${wines.length}] ${wine.vintage || ''} ${wine.wine_name} (${wine.producer})`)

    const result = await processWine(wine, dryRun)
    if (result) {
      success++
    } else {
      failed++
    }

    // Rate limit between requests
    if (i < wines.length - 1) {
      await new Promise(resolve => setTimeout(resolve, DELAY_MS))
    }
  }

  console.log('\n=== Results ===')
  console.log(`Success: ${success}`)
  console.log(`Failed: ${failed}`)
  console.log(`Total: ${wines.length}`)
}

main().catch(console.error)
