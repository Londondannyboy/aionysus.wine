/**
 * Delete All Shopify Products
 *
 * Removes all products from Shopify store for fresh sync
 *
 * Usage: npx tsx scripts/delete-shopify-products.ts [--confirm]
 */

import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const SHOPIFY_STORE_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN!
const SHOPIFY_ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN!

const RATE_LIMIT_DELAY = 500 // ms between requests

async function shopifyAdminFetch(endpoint: string, method: string = 'GET') {
  const url = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/${endpoint}`

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN,
    },
  })

  if (!response.ok && response.status !== 404) {
    const errorText = await response.text()
    throw new Error(`Shopify API error: ${response.status} - ${errorText}`)
  }

  if (method === 'DELETE') {
    return { success: true }
  }

  return response.json()
}

async function getProductIds(limit: number = 250): Promise<string[]> {
  const result = await shopifyAdminFetch(`products.json?limit=${limit}&fields=id`)
  return result.products.map((p: { id: number }) => p.id.toString())
}

async function deleteProduct(productId: string): Promise<boolean> {
  try {
    await shopifyAdminFetch(`products/${productId}.json`, 'DELETE')
    return true
  } catch (error) {
    console.error(`Failed to delete ${productId}:`, error)
    return false
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  const args = process.argv.slice(2)
  const confirmed = args.includes('--confirm')

  console.log('='.repeat(60))
  console.log('Shopify Product Deletion')
  console.log('='.repeat(60))
  console.log(`Store: ${SHOPIFY_STORE_DOMAIN}`)

  // Get product count
  const countResult = await shopifyAdminFetch('products/count.json')
  const totalProducts = countResult.count

  console.log(`Total products to delete: ${totalProducts}`)
  console.log('='.repeat(60))

  if (totalProducts === 0) {
    console.log('No products to delete!')
    return
  }

  if (!confirmed) {
    console.log('\n⚠️  WARNING: This will DELETE ALL PRODUCTS from your Shopify store!')
    console.log('Run with --confirm to proceed.\n')
    console.log('Example: npx tsx scripts/delete-shopify-products.ts --confirm')
    return
  }

  console.log('\n🗑️  Starting deletion...\n')

  let deleted = 0
  let failed = 0

  // Delete in batches
  while (true) {
    const productIds = await getProductIds(250)

    if (productIds.length === 0) {
      break
    }

    for (const productId of productIds) {
      const success = await deleteProduct(productId)

      if (success) {
        deleted++
        process.stdout.write(`\rDeleted: ${deleted} / ${totalProducts}`)
      } else {
        failed++
      }

      await sleep(RATE_LIMIT_DELAY)
    }
  }

  console.log('\n\n' + '='.repeat(60))
  console.log('DELETION COMPLETE')
  console.log('='.repeat(60))
  console.log(`Deleted: ${deleted}`)
  console.log(`Failed: ${failed}`)

  // Verify
  const verifyCount = await shopifyAdminFetch('products/count.json')
  console.log(`Remaining products: ${verifyCount.count}`)
}

main().catch(console.error)
