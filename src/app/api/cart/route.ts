/**
 * Cart API - Create cart
 */
import { NextResponse } from 'next/server'
import { createCart, getCart } from '@/lib/shopify'

// Create new cart
export async function POST() {
  try {
    const cart = await createCart()
    return NextResponse.json({ cartId: cart.id, checkoutUrl: cart.checkoutUrl })
  } catch (error) {
    console.error('Create cart error:', error)
    return NextResponse.json({ error: 'Failed to create cart' }, { status: 500 })
  }
}

// Get existing cart
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const cartId = searchParams.get('id')

  if (!cartId) {
    return NextResponse.json({ error: 'Cart ID required' }, { status: 400 })
  }

  try {
    const cart = await getCart(cartId)
    if (!cart) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 })
    }
    return NextResponse.json(cart)
  } catch (error) {
    console.error('Get cart error:', error)
    return NextResponse.json({ error: 'Failed to get cart' }, { status: 500 })
  }
}
