'use client'

import { useState, useEffect } from 'react'
import { Cart, getCart, updateCartLine, removeCartLine, formatPrice } from '@/lib/shopify'
import Link from 'next/link'

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadCart()
  }, [])

  async function loadCart() {
    setLoading(true)
    setError(null)

    try {
      const cartId = localStorage.getItem('shopify_cart_id')
      if (cartId) {
        const cartData = await getCart(cartId)
        setCart(cartData)
      }
    } catch (err) {
      console.error('Failed to load cart:', err)
      setError('Unable to load cart. Please try again.')
    }

    setLoading(false)
  }

  async function handleUpdateQuantity(lineId: string, quantity: number) {
    if (!cart) return

    try {
      if (quantity === 0) {
        const updatedCart = await removeCartLine(cart.id, lineId)
        setCart(updatedCart)
      } else {
        const updatedCart = await updateCartLine(cart.id, lineId, quantity)
        setCart(updatedCart)
      }
    } catch (err) {
      console.error('Failed to update cart:', err)
      setError('Failed to update cart')
    }
  }

  const cartLines = cart?.lines.edges.map(e => e.node) || []
  const subtotal = cart?.cost.subtotalAmount
  const total = cart?.cost.totalAmount

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Shopping Cart</h1>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={loadCart}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500"
            >
              Try Again
            </button>
          </div>
        ) : cartLines.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-400 mb-6">Your cart is empty</p>
            <Link
              href="/wines"
              className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-500"
            >
              Browse Wines
            </Link>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="space-y-4 mb-8">
              {cartLines.map((line) => (
                <div
                  key={line.id}
                  className="flex gap-4 bg-slate-900 rounded-xl p-4 border border-slate-800"
                >
                  {/* Product Image */}
                  <div className="w-20 h-28 bg-slate-800 rounded-lg overflow-hidden flex-shrink-0">
                    {line.merchandise.product.featuredImage?.url ? (
                      <img
                        src={line.merchandise.product.featuredImage.url}
                        alt={line.merchandise.product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">
                        🍷
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">
                      {line.merchandise.product.title}
                    </h3>
                    <p className="text-sm text-slate-400 mb-2">
                      {line.merchandise.title}
                    </p>
                    <p className="text-purple-400 font-semibold">
                      {formatPrice(line.merchandise.price.amount, line.merchandise.price.currencyCode)}
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex flex-col items-end justify-between">
                    <button
                      onClick={() => handleUpdateQuantity(line.id, 0)}
                      className="text-slate-500 hover:text-red-400"
                    >
                      Remove
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateQuantity(line.id, line.quantity - 1)}
                        className="w-8 h-8 bg-slate-800 rounded-lg text-white hover:bg-slate-700"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-white">{line.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(line.id, line.quantity + 1)}
                        className="w-8 h-8 bg-slate-800 rounded-lg text-white hover:bg-slate-700"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart Summary */}
            <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
              <div className="flex justify-between mb-2">
                <span className="text-slate-400">Subtotal</span>
                <span className="text-white">
                  {subtotal ? formatPrice(subtotal.amount, subtotal.currencyCode) : '-'}
                </span>
              </div>
              <div className="flex justify-between mb-4">
                <span className="text-slate-400">Shipping</span>
                <span className="text-slate-400">Calculated at checkout</span>
              </div>
              <div className="border-t border-slate-800 pt-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold text-white">Total</span>
                  <span className="text-lg font-bold text-white">
                    {total ? formatPrice(total.amount, total.currencyCode) : '-'}
                  </span>
                </div>
              </div>

              {cart?.checkoutUrl && (
                <a
                  href={cart.checkoutUrl}
                  className="block w-full text-center py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-500 transition-colors"
                >
                  Proceed to Checkout
                </a>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
