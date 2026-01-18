/**
 * Shopify Storefront API Client
 * For headless cart and checkout operations
 */

const SHOPIFY_STORE_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
const STOREFRONT_ACCESS_TOKEN = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN

interface ShopifyResponse<T> {
  data?: T
  errors?: Array<{ message: string }>
}

export async function storefrontFetch<T>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  if (!SHOPIFY_STORE_DOMAIN || !STOREFRONT_ACCESS_TOKEN) {
    throw new Error(
      'Shopify credentials not configured. Set NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN and NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN'
    )
  }

  const response = await fetch(
    `https://${SHOPIFY_STORE_DOMAIN}/api/2024-01/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': STOREFRONT_ACCESS_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
    }
  )

  const json: ShopifyResponse<T> = await response.json()

  if (json.errors) {
    console.error('Storefront API errors:', json.errors)
    throw new Error(json.errors[0]?.message || 'Storefront API error')
  }

  return json.data as T
}

// Cart types
export interface CartLine {
  id: string
  quantity: number
  merchandise: {
    id: string
    title: string
    product: {
      id: string
      title: string
      handle: string
      featuredImage?: { url: string }
    }
    price: { amount: string; currencyCode: string }
  }
}

export interface Cart {
  id: string
  checkoutUrl: string
  totalQuantity: number
  cost: {
    totalAmount: { amount: string; currencyCode: string }
    subtotalAmount: { amount: string; currencyCode: string }
  }
  lines: {
    edges: Array<{ node: CartLine }>
  }
}

// Create a new cart
export async function createCart(): Promise<Cart> {
  const data = await storefrontFetch<{ cartCreate: { cart: Cart } }>(`
    mutation {
      cartCreate {
        cart {
          id
          checkoutUrl
          totalQuantity
          cost {
            totalAmount { amount currencyCode }
            subtotalAmount { amount currencyCode }
          }
          lines(first: 50) {
            edges {
              node {
                id
                quantity
                merchandise {
                  ... on ProductVariant {
                    id
                    title
                    product {
                      id
                      title
                      handle
                      featuredImage { url }
                    }
                    price { amount currencyCode }
                  }
                }
              }
            }
          }
        }
      }
    }
  `)

  return data.cartCreate.cart
}

// Get an existing cart
export async function getCart(cartId: string): Promise<Cart | null> {
  const data = await storefrontFetch<{ cart: Cart | null }>(
    `
    query GetCart($cartId: ID!) {
      cart(id: $cartId) {
        id
        checkoutUrl
        totalQuantity
        cost {
          totalAmount { amount currencyCode }
          subtotalAmount { amount currencyCode }
        }
        lines(first: 50) {
          edges {
            node {
              id
              quantity
              merchandise {
                ... on ProductVariant {
                  id
                  title
                  product {
                    id
                    title
                    handle
                    featuredImage { url }
                  }
                  price { amount currencyCode }
                }
              }
            }
          }
        }
      }
    }
  `,
    { cartId }
  )

  return data.cart
}

// Add items to cart
export async function addToCart(
  cartId: string,
  variantId: string,
  quantity: number = 1
): Promise<Cart> {
  const data = await storefrontFetch<{ cartLinesAdd: { cart: Cart } }>(
    `
    mutation AddToCart($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart {
          id
          checkoutUrl
          totalQuantity
          cost {
            totalAmount { amount currencyCode }
            subtotalAmount { amount currencyCode }
          }
          lines(first: 50) {
            edges {
              node {
                id
                quantity
                merchandise {
                  ... on ProductVariant {
                    id
                    title
                    product {
                      id
                      title
                      handle
                      featuredImage { url }
                    }
                    price { amount currencyCode }
                  }
                }
              }
            }
          }
        }
      }
    }
  `,
    {
      cartId,
      lines: [{ merchandiseId: variantId, quantity }],
    }
  )

  return data.cartLinesAdd.cart
}

// Update cart line quantity
export async function updateCartLine(
  cartId: string,
  lineId: string,
  quantity: number
): Promise<Cart> {
  const data = await storefrontFetch<{ cartLinesUpdate: { cart: Cart } }>(
    `
    mutation UpdateCartLine($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
      cartLinesUpdate(cartId: $cartId, lines: $lines) {
        cart {
          id
          checkoutUrl
          totalQuantity
          cost {
            totalAmount { amount currencyCode }
            subtotalAmount { amount currencyCode }
          }
          lines(first: 50) {
            edges {
              node {
                id
                quantity
                merchandise {
                  ... on ProductVariant {
                    id
                    title
                    product {
                      id
                      title
                      handle
                      featuredImage { url }
                    }
                    price { amount currencyCode }
                  }
                }
              }
            }
          }
        }
      }
    }
  `,
    {
      cartId,
      lines: [{ id: lineId, quantity }],
    }
  )

  return data.cartLinesUpdate.cart
}

// Remove cart line
export async function removeCartLine(
  cartId: string,
  lineId: string
): Promise<Cart> {
  const data = await storefrontFetch<{ cartLinesRemove: { cart: Cart } }>(
    `
    mutation RemoveCartLine($cartId: ID!, $lineIds: [ID!]!) {
      cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
        cart {
          id
          checkoutUrl
          totalQuantity
          cost {
            totalAmount { amount currencyCode }
            subtotalAmount { amount currencyCode }
          }
          lines(first: 50) {
            edges {
              node {
                id
                quantity
                merchandise {
                  ... on ProductVariant {
                    id
                    title
                    product {
                      id
                      title
                      handle
                      featuredImage { url }
                    }
                    price { amount currencyCode }
                  }
                }
              }
            }
          }
        }
      }
    }
  `,
    {
      cartId,
      lineIds: [lineId],
    }
  )

  return data.cartLinesRemove.cart
}

// Search products in Shopify
export async function searchShopifyProducts(query: string, first: number = 10) {
  const data = await storefrontFetch<{
    products: {
      edges: Array<{
        node: {
          id: string
          title: string
          handle: string
          description: string
          featuredImage?: { url: string }
          variants: {
            edges: Array<{
              node: {
                id: string
                title: string
                price: { amount: string; currencyCode: string }
                availableForSale: boolean
              }
            }>
          }
        }
      }>
    }
  }>(
    `
    query SearchProducts($query: String!, $first: Int!) {
      products(first: $first, query: $query) {
        edges {
          node {
            id
            title
            handle
            description
            featuredImage { url }
            variants(first: 1) {
              edges {
                node {
                  id
                  title
                  price { amount currencyCode }
                  availableForSale
                }
              }
            }
          }
        }
      }
    }
  `,
    { query, first }
  )

  return data.products.edges.map((e) => e.node)
}

// Helper to format price
export function formatPrice(amount: string, currencyCode: string = 'GBP'): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currencyCode,
  }).format(parseFloat(amount))
}
