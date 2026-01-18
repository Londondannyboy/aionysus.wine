/**
 * Cart API - Add to cart
 */
import { NextRequest, NextResponse } from 'next/server'
import { addToCart, searchShopifyProducts } from '@/lib/shopify'

export async function POST(request: NextRequest) {
  try {
    const { cartId, productId, variantId, quantity = 1 } = await request.json()

    if (!cartId) {
      return NextResponse.json({ error: 'Cart ID required' }, { status: 400 })
    }

    if (!productId && !variantId) {
      return NextResponse.json({ error: 'Product ID or Variant ID required' }, { status: 400 })
    }

    let merchandiseId = variantId

    // If we have a product ID but no variant, search for the product to get the variant
    if (productId && !variantId) {
      try {
        // Search for the product by ID in Shopify
        const products = await searchShopifyProducts(`id:${productId}`, 1)
        if (products.length > 0 && products[0].variants.edges.length > 0) {
          merchandiseId = products[0].variants.edges[0].node.id
        } else {
          // Try by title/handle
          const productsByTitle = await searchShopifyProducts(productId, 1)
          if (productsByTitle.length > 0 && productsByTitle[0].variants.edges.length > 0) {
            merchandiseId = productsByTitle[0].variants.edges[0].node.id
          }
        }
      } catch (e) {
        console.error('Error finding variant:', e)
      }
    }

    if (!merchandiseId) {
      return NextResponse.json({ error: 'Could not find product variant' }, { status: 404 })
    }

    const cart = await addToCart(cartId, merchandiseId, quantity)

    return NextResponse.json({
      success: true,
      totalQuantity: cart.totalQuantity,
      checkoutUrl: cart.checkoutUrl,
      subtotal: cart.cost.subtotalAmount.amount,
    })
  } catch (error) {
    console.error('Add to cart error:', error)
    return NextResponse.json({ error: 'Failed to add to cart' }, { status: 500 })
  }
}
